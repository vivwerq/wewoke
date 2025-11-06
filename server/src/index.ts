import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './lib/supabase.js';
import { createClient as createRedisClient } from 'redis';
import friendsRouter from './routes/friends.js';
import messagesRouter from './routes/messages.js';
import reportsRouter from './routes/reports.js';
import uploadsRouter from './routes/uploads.js';
import { SignalingMessage } from './types/index.js';
import turnRouter from './routes/turn.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Supabase client is provided by ./lib/supabase which falls back to a stub when env is missing

// Redis client
export const redis = createRedisClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Redis Client Connected'));

// Try to connect to Redis but don't crash the entire server if Redis is unavailable in dev.
// This avoids a hard crash when Redis isn't running locally and allows the HTTP and Socket.IO
// endpoints (including /health) to come up so we can debug other issues.
try {
  await redis.connect();
} catch (err) {
  console.warn('Warning: Failed to connect to Redis. Continuing without Redis. Error:', err);
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

// Routes
app.use('/api/friends', friendsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/uploads', uploadsRouter);
// Ephemeral TURN credentials (if configured)
app.use('/api/webrtc', turnRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebRTC Configuration endpoint
app.get('/api/webrtc/config', (req, res) => {
  const config: {
    iceServers: Array<{
      urls: string;
      username?: string;
      credential?: string;
    }>;
  } = {
    iceServers: [
      { urls: process.env.STUN_SERVER_URL || 'stun:stun.l.google.com:19302' }
    ]
  };
  
  // Add TURN server if configured
  if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
    config.iceServers.push({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD
    });
  }
  
  res.json(config);
});

// Store active connections and call sessions
const userSockets = new Map<string, string>(); // userId -> socketId
const callSessions = new Map<string, Set<string>>(); // callId -> Set<userId>
const recordingConsents = new Map<string, Map<string, boolean>>(); // callId -> Map<userId, consented>

// Socket.IO signaling server
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // User joins with their ID
  socket.on('join', async (userId: string) => {
    userSockets.set(userId, socket.id);
    socket.data.userId = userId;
    
    // Update online status in database
    try {
      await supabase
        .from('profiles')
        .update({ is_online: true })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
    
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });
  
  // Handle match found notification
  socket.on('match-found', async (data: { user1: string; user2: string; callId: string }) => {
    const { user1, user2, callId } = data;
    
    // Create call session
    callSessions.set(callId, new Set([user1, user2]));
    
    // Notify both users
    const socket1 = userSockets.get(user1);
    const socket2 = userSockets.get(user2);
    
    if (socket1) {
      io.to(socket1).emit('match-ready', { callId, peerId: user2 });
    }
    if (socket2) {
      io.to(socket2).emit('match-ready', { callId, peerId: user1 });
    }
  });
  
  // WebRTC signaling
  socket.on('signal', (message: SignalingMessage) => {
    const targetSocket = userSockets.get(message.to);
    if (targetSocket) {
      io.to(targetSocket).emit('signal', message);
    }
  });
  
  // Recording consent (legacy - keeping for backward compatibility)
  socket.on('recording-consent', (data: { callId: string; userId: string; consented: boolean }) => {
    const { callId, userId, consented } = data;
    
    if (!recordingConsents.has(callId)) {
      recordingConsents.set(callId, new Map());
    }
    recordingConsents.get(callId)!.set(userId, consented);
    
    // Check if both users consented
    const consents = recordingConsents.get(callId)!;
    if (consents.size === 2 && Array.from(consents.values()).every(c => c)) {
      // Notify both users that recording can start
      const users = callSessions.get(callId);
      if (users) {
        users.forEach(userId => {
          const socketId = userSockets.get(userId);
          if (socketId) {
            io.to(socketId).emit('recording-approved', { callId });
          }
        });
      }
    }
  });
  
  // Recording status (one-sided recording - no consent needed)
  socket.on('recording-status', (data: { callId: string; userId: string; isRecording: boolean }) => {
    const { callId, userId, isRecording } = data;
    
    // Notify other participants in the call
    const users = callSessions.get(callId);
    if (users) {
      users.forEach(otherUserId => {
        if (otherUserId !== userId) {
          const socketId = userSockets.get(otherUserId);
          if (socketId) {
            io.to(socketId).emit('peer-recording-status', { isRecording });
          }
        }
      });
    }
  });
  
  // Leave call
  socket.on('leave-call', (callId: string) => {
    const userId = socket.data.userId;
    if (userId && callSessions.has(callId)) {
      const users = callSessions.get(callId)!;
      users.delete(userId);
      
      // Notify other user
      users.forEach(otherUserId => {
        const otherSocket = userSockets.get(otherUserId);
        if (otherSocket) {
          io.to(otherSocket).emit('peer-left', { userId });
        }
      });
      
      // Clean up if call is empty
      if (users.size === 0) {
        callSessions.delete(callId);
        recordingConsents.delete(callId);
      }
    }
  });
  
  // Disconnect
  socket.on('disconnect', async () => {
    const userId = socket.data.userId;
    if (userId) {
      userSockets.delete(userId);
      
      // Update online status
      try {
        await supabase
          .from('profiles')
          .update({ is_online: false })
          .eq('user_id', userId);
      } catch (error) {
        console.error('Error updating online status on disconnect:', error);
      }
      
      // Clean up call sessions
      callSessions.forEach((users, callId) => {
        if (users.has(userId)) {
          users.delete(userId);
          // Notify others
          users.forEach(otherUserId => {
            const otherSocket = userSockets.get(otherUserId);
            if (otherSocket) {
              io.to(otherSocket).emit('peer-left', { userId });
            }
          });
          if (users.size === 0) {
            callSessions.delete(callId);
            recordingConsents.delete(callId);
          }
        }
      });
    }
    
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebRTC signaling server ready`);
});

export { io, supabase };
