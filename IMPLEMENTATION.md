# VibeCast - Full-Stack Video Chat Application

## Overview

VibeCast is a modern video chat application with real-time WebRTC capabilities, Redis-backed matchmaking, friend system, video recording, and comprehensive moderation tools.

## Features Implemented

### 1. Real WebRTC Video/Audio Streaming
- **Frontend Integration**: WebRTC peer connections with STUN/TURN server support
- **Backend Signaling**: Socket.IO server for WebRTC signaling (offers, answers, ICE candidates)
- **Media Controls**: Mute/unmute audio, enable/disable video
- **Blur-by-default UI**: Privacy-first approach where both users must consent to unblur
- **Connection Quality**: Real-time network quality indicators

### 2. Redis-backed Matchmaking Engine
- **Scalable Architecture**: Node.js worker process using Redis queues
- **Intelligent Matching**: Scoring algorithm based on:
  - Mood match (30 points)
  - Intent match (30 points)
  - Interest overlap (30 points max)
  - Region proximity (10 points)
- **Real-time Notifications**: Pub/Sub pattern for instant match notifications
- **Database Integration**: Synced with Supabase match_queue table

### 3. Friend System
- **In-call Friend Requests**: Send friend requests during or after calls
- **Mutual Friends**: Only friends can send private messages
- **Friend Management**: Accept, reject, or remove friends
- **Real-time Updates**: Supabase realtime subscriptions for instant updates
- **Pending Requests**: View and manage incoming friend requests

### 4. Private Messaging
- **Friends-only Chat**: Secure messaging between accepted friends
- **Real-time Messaging**: Instant message delivery via Supabase subscriptions
- **Read Receipts**: Track message read status
- **Unread Counters**: Badge notifications for unread messages

### 5. Client-side Video Recording
- **MediaRecorder Integration**: Browser-based video recording
- **Dual Consent Required**: Both call participants must consent before recording starts
- **Automatic Codec Selection**: Uses best available codec (VP9, VP8, or H.264)
- **Upload/Download**: Options to save recordings locally or upload to server
- **Recording Indicators**: Clear visual feedback when recording is active

### 6. Moderation & Report System
- **In-call Reporting**: Flag users during calls for inappropriate behavior
- **Report Categories**: Harassment, nudity, violence, spam
- **Moderation Dashboard**: Admin interface to review and resolve reports
- **Report Resolution**: Track resolved vs pending reports
- **User Safety**: Comprehensive reporting flow integrated into call UI

## Project Structure

```
vibe-link-chat-83/
├── server/                       # Backend Node.js server
│   ├── src/
│   │   ├── index.ts             # Main server with Socket.IO signaling
│   │   ├── routes/
│   │   │   ├── friends.ts       # Friend system API
│   │   │   ├── messages.ts      # Private messaging API
│   │   │   ├── reports.ts       # Moderation/reporting API
│   │   │   └── uploads.ts       # Video upload handling
│   │   ├── worker/
│   │   │   └── matchmaking.ts   # Redis-based matchmaking worker
│   │   └── types/
│   │       └── index.ts         # TypeScript type definitions
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── src/                          # Frontend React application
│   ├── pages/
│   │   ├── CallEnhanced.tsx     # WebRTC call page with all features
│   │   ├── Friends.tsx          # Friend management page
│   │   ├── Chat.tsx             # Private messaging page
│   │   ├── Moderation.tsx       # Admin moderation dashboard
│   │   ├── Match.tsx            # Matchmaking UI
│   │   └── Dashboard.tsx        # Main dashboard
│   ├── lib/
│   │   ├── webrtc.ts           # WebRTC service class
│   │   ├── videoRecorder.ts    # Video recording service
│   │   └── api.ts              # API client functions
│   └── components/
│       └── ui/                  # shadcn/ui components
│
├── supabase/
│   └── migrations/
│       └── *.sql               # Database schema
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Redis server (local or cloud)
- Supabase account (database already configured)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (already configured)
- `REDIS_URL` (default: redis://localhost:6379)
- `TURN_SERVER_URL`, `TURN_USERNAME`, `TURN_PASSWORD` (optional, for production)

5. Start Redis (if running locally):
```bash
redis-server
```

6. Start the backend server:
```bash
npm run dev
```

7. In a separate terminal, start the matchmaking worker:
```bash
npm run worker
```

### Frontend Setup

1. Navigate to the root directory:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. The `.env` file is already configured with:
- Supabase credentials
- Socket.IO server URL (http://localhost:3001)

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## Usage Guide

### Making a Call

1. **Onboarding**: Set your mood, intent, and interests
2. **Dashboard**: Click "Start Matching"
3. **Matching**: Wait for the algorithm to find a compatible match
4. **Call Screen**:
   - Video/audio are blurred by default
   - Both users must click "Unblur" to see each other
   - Use controls to mute/unmute, enable/disable video
   - Timer shows remaining call time

### Recording a Call

1. During a call, click the recording button (circle icon)
2. Both participants must consent
3. When both consent, recording starts (red indicator appears)
4. Recording stops automatically when call ends
5. Video is downloaded to your device

### Friend System

1. **During/After Call**: Click "Add Friend" button
2. **Friend Requests**: Navigate to Friends page to see pending requests
3. **Accept/Decline**: Manage incoming requests
4. **Send Messages**: Click "Message" on any friend to start chatting

### Private Messaging

1. Navigate to Friends page
2. Click "Message" on a friend
3. Send real-time messages
4. Messages are marked as read automatically

### Reporting Users

1. During a call, click the flag icon
2. Select a category (harassment, nudity, violence, spam)
3. Optionally add a description
4. Submit report

### Moderation Dashboard

1. Navigate to /moderation (admin/moderator only)
2. View pending reports
3. Review report details
4. Mark reports as resolved

## Technical Details

### WebRTC Flow

1. User joins match queue → Redis enqueues request
2. Matchmaking worker finds compatible match
3. Server creates call session and notifies both users via Socket.IO
4. Frontend establishes WebRTC peer connection:
   - Exchange SDP offers/answers
   - Exchange ICE candidates
   - Media streams connected
5. Call proceeds with real-time audio/video

### Matchmaking Algorithm

```typescript
Score Calculation:
- Mood match: 30 points
- Intent match: 30 points  
- Interest overlap: 10 points per common interest (max 30)
- Region match: 10 points (or -5 penalty if preferNearby but different)
- Minimum score required: 20 points
```

### Security Features

- Row-level security (RLS) on all Supabase tables
- Friend requests require mutual acceptance
- Messages only between accepted friends
- Recording requires dual consent
- Report system for inappropriate behavior
- Blur-by-default video for privacy

### Database Schema

Key tables:
- `profiles`: User profiles with mood, intent, interests
- `friendships`: Friend relationships (pending/accepted/rejected)
- `messages`: Private messages between friends
- `reports`: User reports with category and resolution status
- `match_queue`: Active users waiting for matches
- `user_roles`: Role-based access control (admin/moderator/user)

## API Endpoints

### Friends API
- `GET /api/friends/:userId` - Get user's friends
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:friendshipId` - Accept request
- `POST /api/friends/reject/:friendshipId` - Reject request
- `DELETE /api/friends/:friendshipId` - Remove friend
- `GET /api/friends/:userId/pending` - Get pending requests

### Messages API
- `GET /api/messages/:userId/:friendId` - Get conversation
- `POST /api/messages` - Send message
- `POST /api/messages/read` - Mark messages as read
- `GET /api/messages/:userId/unread` - Get unread count

### Reports API
- `POST /api/reports` - Create report
- `GET /api/reports` - List reports (with filtering)
- `GET /api/reports/:reportId` - Get report details
- `POST /api/reports/:reportId/resolve` - Resolve report
- `GET /api/reports/user/:userId` - Get user's reports

### Uploads API
- `POST /api/uploads/video` - Upload recorded video
- `GET /api/uploads/video/:callId` - Get video metadata

### WebRTC API
- `GET /api/webrtc/config` - Get STUN/TURN server configuration

## Socket.IO Events

### Client → Server
- `join` - User joins with userId
- `match-found` - Notify users of successful match
- `signal` - WebRTC signaling (offer/answer/ICE)
- `recording-consent` - User consents to recording
- `leave-call` - User leaves call

### Server → Client
- `match-ready` - Match found, ready to connect
- `signal` - WebRTC signaling from peer
- `peer-left` - Peer disconnected
- `recording-approved` - Both users consented, start recording

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SOCKET_URL=http://localhost:3001
```

### Backend (server/.env)
```
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
REDIS_URL=redis://localhost:6379
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_USERNAME=your_username
TURN_PASSWORD=your_password
STUN_SERVER_URL=stun:stun.l.google.com:19302
CORS_ORIGIN=http://localhost:5173
```

## Production Deployment

### Required Services
1. **Redis**: Use Redis Cloud, AWS ElastiCache, or similar
2. **TURN Server**: Deploy coturn or use a service like Twilio
3. **Video Storage**: Use AWS S3, Cloudflare R2, or similar for recordings
4. **Server**: Deploy Node.js server on Railway, Render, or similar
5. **Frontend**: Deploy on Vercel, Netlify, or similar

### Scaling Considerations
- Multiple matchmaking workers can process queue in parallel
- Redis pub/sub enables horizontal scaling of signaling servers
- Database connection pooling for high concurrency
- CDN for static assets
- Load balancer for multiple server instances

## Testing

### Manual Testing Checklist
- [ ] User can register and complete onboarding
- [ ] Matchmaking finds compatible users
- [ ] WebRTC connection establishes successfully
- [ ] Video/audio controls work correctly
- [ ] Blur/unblur functionality works
- [ ] Recording requires dual consent
- [ ] Friend requests can be sent and accepted
- [ ] Private messaging works between friends
- [ ] Reports can be submitted and reviewed
- [ ] Moderation dashboard accessible to admins

## Known Limitations

1. **Mock Authentication**: Currently using placeholder user IDs (integrate with Supabase Auth)
2. **STUN-only**: Default configuration uses Google's STUN server (add TURN for production)
3. **Local Video Storage**: Recordings saved to server disk (use cloud storage in production)
4. **No Call History**: Implement call history tracking
5. **Limited Moderation Tools**: Add ban/suspend functionality

## Future Enhancements

- [ ] Supabase Auth integration
- [ ] Call history and statistics
- [ ] User blocking functionality
- [ ] Advanced moderation tools (ban, suspend, warn)
- [ ] Video quality settings
- [ ] Screen sharing
- [ ] Group calls (3+ participants)
- [ ] Emoji reactions during calls
- [ ] Voice messages in chat
- [ ] User reputation system
- [ ] Analytics dashboard

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact support.
