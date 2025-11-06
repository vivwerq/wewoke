export interface MatchingPreferences {
  mood: string;
  intent: string;
  interests: string[];
  region?: string;
  language?: string;
  preferNearby?: boolean;
}

export interface MatchRequest {
  userId: string;
  preferences: MatchingPreferences;
  timestamp: number;
}

export interface MatchResult {
  user1: string;
  user2: string;
  score: number;
  timestamp: number;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'ready' | 'leave';
  data: unknown;
  from: string;
  to: string;
}

export interface RecordingConsent {
  callId: string;
  userId: string;
  consented: boolean;
  timestamp: number;
}

export interface VideoUpload {
  callId: string;
  userId: string;
  fileName: string;
  size: number;
  timestamp: number;
}
