import { createClient } from 'redis';
import { supabase } from '../lib/supabase.js';
import dotenv from 'dotenv';
import { MatchRequest, MatchingPreferences } from '../types/index.js';

dotenv.config();

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// supabase is imported from ../lib/supabase and may be a stub in local dev

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Matchmaking Worker - Redis Connected'));

await redis.connect();

const MATCH_QUEUE_KEY = 'match:queue';
const PROCESSING_SET_KEY = 'match:processing';

// Calculate match score between two users
function calculateMatchScore(
  pref1: MatchingPreferences,
  pref2: MatchingPreferences
): number {
  let score = 0;
  
  // Mood match (30 points)
  if (pref1.mood === pref2.mood) {
    score += 30;
  }
  
  // Intent match (30 points)
  if (pref1.intent === pref2.intent) {
    score += 30;
  }
  
  // Interest overlap (30 points max)
  const interests1 = new Set(pref1.interests);
  const interests2 = new Set(pref2.interests);
  const commonInterests = [...interests1].filter(i => interests2.has(i));
  score += Math.min(30, commonInterests.length * 10);
  
  // Region match (10 points)
  if (pref1.region && pref2.region) {
    if (pref1.region === pref2.region) {
      score += 10;
    } else if (pref1.preferNearby || pref2.preferNearby) {
      score -= 5; // Penalty if they prefer nearby but different regions
    }
  }
  
  return score;
}

// Find best match for a user
async function findMatch(request: MatchRequest): Promise<MatchRequest | null> {
  // Get all waiting users
  const queueLength = await redis.lLen(MATCH_QUEUE_KEY);
  if (queueLength === 0) {
    return null;
  }
  
  // Get all potential matches
  const potentialMatches: MatchRequest[] = [];
  const range = await redis.lRange(MATCH_QUEUE_KEY, 0, -1);
  
  for (const item of range) {
    try {
      const match = JSON.parse(item) as MatchRequest;
      // Don't match with self
      if (match.userId !== request.userId) {
        potentialMatches.push(match);
      }
    } catch (e) {
      console.error('Error parsing match request:', e);
    }
  }
  
  if (potentialMatches.length === 0) {
    return null;
  }
  
  // Calculate scores and find best match
  let bestMatch: MatchRequest | null = null;
  let bestScore = 0;
  
  for (const candidate of potentialMatches) {
    const score = calculateMatchScore(request.preferences, candidate.preferences);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  
  // Require minimum score of 20 to match
  if (bestScore >= 20 && bestMatch) {
    return bestMatch;
  }
  
  return null;
}

// Process match queue
async function processQueue() {
  try {
    // Get next request from queue
    const item = await redis.rPop(MATCH_QUEUE_KEY);
    if (!item) {
      return; // Queue is empty
    }
    
    const request: MatchRequest = JSON.parse(item);
    
    // Add to processing set
    await redis.sAdd(PROCESSING_SET_KEY, request.userId);
    
    // Try to find a match
    const match = await findMatch(request);
    
    if (match) {
      // Remove matched user from queue
      await redis.lRem(MATCH_QUEUE_KEY, 1, JSON.stringify(match));
      await redis.sAdd(PROCESSING_SET_KEY, match.userId);
      
      // Generate call ID
      const callId = `call_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Notify via Redis pub/sub
      await redis.publish('matches', JSON.stringify({
        user1: request.userId,
        user2: match.userId,
        callId,
        timestamp: Date.now()
      }));
      
      console.log(`Match found: ${request.userId} <-> ${match.userId} (callId: ${callId})`);
      
      // Remove from processing
      await redis.sRem(PROCESSING_SET_KEY, request.userId);
      await redis.sRem(PROCESSING_SET_KEY, match.userId);
      
      // Update database - remove from match queue with error handling
      try {
        // Use Promise.all to ensure both deletions happen together
        await Promise.all([
          supabase.from('match_queue').delete().eq('user_id', request.userId),
          supabase.from('match_queue').delete().eq('user_id', match.userId)
        ]);
      } catch (error) {
        console.error('Error updating database after match:', error);
        // Note: Users are already matched via Redis, database cleanup failure is non-critical
      }
      
    } else {
      // No match found, put back in queue
      await redis.lPush(MATCH_QUEUE_KEY, item);
      await redis.sRem(PROCESSING_SET_KEY, request.userId);
    }
    
  } catch (error) {
    console.error('Error processing queue:', error);
  }
}

// Subscribe to match notifications
const subscriber = redis.duplicate();
await subscriber.connect();

subscriber.subscribe('matches', async (message) => {
  try {
    const match = JSON.parse(message);
    // Forward to Socket.IO server via Redis
    await redis.publish('match-notifications', JSON.stringify(match));
  } catch (e) {
    console.error('Error handling match notification:', e);
  }
});

// Subscribe to new match requests
subscriber.subscribe('match-requests', async (message) => {
  try {
    const request: MatchRequest = JSON.parse(message);
    await redis.lPush(MATCH_QUEUE_KEY, JSON.stringify(request));
    console.log(`New match request from ${request.userId}`);
  } catch (e) {
    console.error('Error handling match request:', e);
  }
});

// Main worker loop
console.log('Matchmaking worker started');
console.log('Processing queue every 2 seconds...');

setInterval(async () => {
  await processQueue();
}, 2000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down matchmaking worker...');
  await redis.quit();
  await subscriber.quit();
  process.exit(0);
});
