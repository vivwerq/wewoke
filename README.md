# Vibe Link Chat — Deploy & Dev Guide

This repository contains a Vite + React frontend and an Express + Socket.IO TypeScript backend (in `server/`) that uses Supabase for auth/storage and Redis for optional ephemeral state. This README explains how to run locally and recommended deployment options using free/discounted services (GitHub Student benefits).

## Quick summary (recommended stack)
- Domain: Claim a domain from Namecheap (GitHub Student Offer) — free/year for some TLDs or heavy discounts on .com.
- Frontend: Vercel (excellent Next.js/React integration) or Netlify (generous free bandwidth). Both work with Vite-built apps.
- Backend (signaling / REST): Render (free hobby) or Fly — Render gives always-on instances which are useful for WebSocket/Socket.IO.
- TURN server (WebRTC relay): Run coturn on a small DigitalOcean droplet using GitHub Student credits.
- DB & Storage: Supabase (already used here). Move large uploads to S3-compatible storage if needed.

## Repo layout
- `/` — Vite + React frontend
- `/server` — Express + Socket.IO backend (TypeScript)

## Local development
Prereqs: Node >= 18, npm, (optional) Redis locally for full feature parity.

1. Frontend

```bash
# from repo root
cd /home/comrade/Alapa
npm install
npm run dev
# opens Vite dev server (default port 8080 per vite.config.ts)
```

2. Backend

```bash
cd /home/comrade/Alapa/server
npm install
npm run dev
# server runs with tsx watch — default port 3001
```

3. Environment variables
Create a `.env` in `server/` (see `server/.env.example`) and set values for Supabase and optional TURN/Redis.

## Production build (frontend)

```bash
cd /home/comrade/Alapa
npm ci
npm run build
# `dist/` will be created and can be served by static hosts
```

Vite produces a `dist/` folder. For Vercel/Netlify, set build command `npm run build` and publish directory `dist`.

## Deploying the Frontend (Vercel or Netlify)

- Vercel
  - Connect your GitHub repository to Vercel.
  - Project settings: Framework: `Other` or `Vite`. Build command: `npm run build`. Output Directory: `dist`.
  - Set environment variables (if frontend needs any runtime keys).

- Netlify
  - Connect the repo to Netlify.
  - Build command: `npm run build`. Publish directory: `dist`.

Notes: For custom domains, add the domain in Vercel/Netlify dashboard and update Namecheap DNS (CNAME/ALIAS records) as instructed by the host.

## Deploying the Backend (Render)

1. Create a new Web Service on Render.
   - Connect GitHub repo and choose the `server/` directory as the service root.
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start` (this will run `node dist/index.js`).
   - Environment: Set all required env vars (see `server/.env.example`).

2. Make sure the service uses a plan that supports WebSockets (Render Hobby/Starter typically do).

3. Redis: if you need a managed Redis, Render offers managed Redis or use Upstash/redis provider — point `REDIS_URL` to the service.

## TURN server (coturn) on DigitalOcean (recommended)

Use your GitHub Student credits on DigitalOcean to spin up a small droplet (shared CPU / 1GB is fine for light use).

Example high-level steps:

1. Create a droplet and note its public IP (e.g. `1.2.3.4`).
2. SSH in and install coturn (Ubuntu example):

```bash
sudo apt update
sudo apt install coturn -y
```

3. Basic `/etc/turnserver.conf` essential options (example values):

```
listening-port=3478
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=YOUR_SECRET_HERE  # optional if using long-term credentials flow
realm=your-domain.example
external-ip=1.2.3.4
listening-ip=0.0.0.0
min-port=49152
max-port=65535
tls-listening-port=5349   # TLS (optional)
cert=/path/to/fullchain.pem
pkey=/path/to/privkey.pem
```

4. You can configure long-term credentials (username/password) per session or integrate dynamic credentials.
5. Open ports UDP/TCP 3478 and desired relay ports (e.g., 49152-65535) in the droplet firewall.

TURN URL used by clients/server example: `turn:turn.your-domain.example:3478` (and `turns:` for TLS).

Security note: Use ephemeral credentials or a secure static secret. Do not hard-code credentials in the client.

## DNS & Domain (Namecheap GitHub Student)

1. Claim the Namecheap student offer via the GitHub Student developer pack page.
2. Once you have your domain, add records:
   - Frontend (Vercel/Netlify) — follow provider's domain setup; usually you add a CNAME or ALIAS for the root.
   - Backend API (Render) — you can add a CNAME to the Render service or an A record if recommended.
   - TURN server — create an A record for `turn.your-domain.example` pointing at your DigitalOcean droplet IP.

## Supabase notes
- Frontend and backend use `SUPABASE_URL` and `SUPABASE_ANON_KEY`. For server-side only features use the service role key (keep secret).
- Supabase free tier has limits (row size, storage). Move large uploads to S3 or a Supabase Storage bucket and monitor usage.

## Environment variables (server)
Create `server/.env` from `server/.env.example`.

- SUPABASE_URL=
- SUPABASE_ANON_KEY=
- REDIS_URL=redis://localhost:6379
- PORT=3001
- CORS_ORIGIN=http://localhost:8080
- TURN_SERVER_URL=turn:turn.your-domain.example:3478
- TURN_USERNAME=example
- TURN_PASSWORD=examplepassword

## Troubleshooting & common fixes
- If Socket.IO fails to connect in production, verify CORS origin, and check that the host supports WebSockets.
- If WebRTC cannot connect or media is failing in restrictive networks, verify TURN configuration and credentials.
- If Supabase client fails due to env missing, the server includes a local stub to allow routes to run in dev — real Supabase credentials are required in production.

## What I changed
- Added this `README.md` and a `server/.env.example` to document env vars and deployment steps.

## Next steps you may want me to do
- Create a one-click Render/Vercel deploy configuration (optional).
- Add a small GitHub Actions or Render build manifest to automate builds and environment checks.

---
If you want, I can also generate a step-by-step script to provision a DigitalOcean droplet and install coturn automatically.
# VibeCast - Real-time Video Chat with Matchmaking

## Project info

**URL**: https://lovable.dev/projects/e792fd3b-60e4-4c3e-bec3-8d4145ee3545

## Overview

VibeCast is a modern, full-stack video chat application featuring:
- **Real WebRTC video/audio streaming** with STUN/TURN support
- **Redis-backed matchmaking engine** with intelligent scoring
- **Friend system** with private messaging
- **Client-side video recording** with dual consent
- **Comprehensive moderation tools** and reporting system

For detailed implementation documentation, see [IMPLEMENTATION.md](./IMPLEMENTATION.md).

## Quick Start

### Frontend Development

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup

The application requires a Node.js backend server for WebRTC signaling and matchmaking.

```sh
cd server

# Install dependencies
npm install

# Create .env from example
cp .env.example .env

# Start Redis (required for matchmaking)
redis-server

# Start the backend server
npm run dev

# In a separate terminal, start the matchmaking worker
npm run worker
```

### Environment Configuration

**Frontend** (`.env`):
```
VITE_SUPABASE_URL=https://thkohotkplkiptvxnnwo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SOCKET_URL=http://localhost:3001
```

**Backend** (`server/.env`):
```
PORT=3001
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://thkohotkplkiptvxnnwo.supabase.co
SUPABASE_ANON_KEY=your-anon-key
TURN_SERVER_URL=turn:your-turn-server.com:3478  # Optional
TURN_USERNAME=your_username  # Optional
TURN_PASSWORD=your_password  # Optional
```

## Key Features

### 1. WebRTC Video/Audio Calls
- Peer-to-peer video and audio streaming
- Blur-by-default privacy protection
- Real-time network quality indicators
- Mute/unmute and video on/off controls
- 30-60 second "micro calls" with extension option

### 2. Intelligent Matchmaking
- Redis-based queue system for scalability
- Scoring algorithm based on:
  - Mood compatibility (30 pts)
  - Intent matching (30 pts)
  - Shared interests (up to 30 pts)
  - Geographic proximity (10 pts)
- Real-time match notifications via Socket.IO

### 3. Friend System
- Send friend requests during or after calls
- Accept/reject/remove friends
- View pending requests
- Real-time updates via Supabase subscriptions

### 4. Private Messaging
- Friends-only encrypted chat
- Real-time message delivery
- Read receipts
- Unread message counters

### 5. Video Recording
- Browser-based MediaRecorder API
- Requires consent from both parties
- Automatic codec selection (VP9/VP8/H.264)
- Download or upload recordings

### 6. Moderation & Safety
- In-call reporting (harassment, nudity, violence, spam)
- Admin moderation dashboard
- Report resolution workflow
- User safety features

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds
- **shadcn/ui** components
- **Tailwind CSS** for styling
- **Supabase** for authentication and database
- **Socket.IO Client** for real-time signaling
- **WebRTC API** for peer-to-peer streaming

### Backend
- **Node.js + Express** server
- **Socket.IO** for WebRTC signaling
- **Redis** for matchmaking queue and pub/sub
- **Supabase** for database and real-time subscriptions
- **Multer** for video uploads
- **TypeScript** for type safety

## Project Structure

```
vibe-link-chat-83/
├── server/              # Backend Node.js server
│   ├── src/
│   │   ├── index.ts    # Socket.IO signaling server
│   │   ├── routes/     # REST API routes
│   │   └── worker/     # Matchmaking worker
│   └── package.json
├── src/
│   ├── pages/          # React pages
│   │   ├── CallEnhanced.tsx  # WebRTC call UI
│   │   ├── Friends.tsx       # Friend management
│   │   ├── Chat.tsx          # Private messaging
│   │   └── Moderation.tsx    # Admin dashboard
│   ├── lib/
│   │   ├── webrtc.ts         # WebRTC service
│   │   ├── videoRecorder.ts  # Recording service
│   │   └── api.ts            # API client
│   └── components/ui/  # UI components
├── supabase/
│   └── migrations/     # Database schema
└── IMPLEMENTATION.md   # Detailed documentation
```

## API Endpoints

- `GET /api/webrtc/config` - WebRTC STUN/TURN configuration
- `GET /api/friends/:userId` - Get user's friends
- `POST /api/friends/request` - Send friend request
- `GET /api/messages/:userId/:friendId` - Get conversation
- `POST /api/messages` - Send message
- `POST /api/reports` - Submit user report
- `GET /api/reports` - List reports (admin)
- `POST /api/uploads/video` - Upload recorded video

## Socket.IO Events

**Client → Server:**
- `join` - User authentication
- `signal` - WebRTC signaling
- `recording-consent` - Recording permission
- `leave-call` - End call

**Server → Client:**
- `match-ready` - Match found
- `signal` - Peer signaling
- `recording-approved` - Recording can start
- `peer-left` - Peer disconnected

## Development

### Running Locally

1. Start Redis: `redis-server`
2. Start backend: `cd server && npm run dev`
3. Start worker: `cd server && npm run worker`
4. Start frontend: `npm run dev`
5. Open http://localhost:5173

### Building for Production

```sh
# Frontend
npm run build

# Backend
cd server && npm run build && npm start
```

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e792fd3b-60e4-4c3e-bec3-8d4145ee3545) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database & Auth)
- Socket.IO (Real-time signaling)
- WebRTC (Video/Audio)
- Redis (Matchmaking queue)

## How can I deploy this project?

### Frontend Deployment

Simply open [Lovable](https://lovable.dev/projects/e792fd3b-60e4-4c3e-bec3-8d4145ee3545) and click on Share → Publish.

### Backend Deployment

Deploy the `server/` directory to:
- Railway
- Render
- Heroku
- AWS/GCP/Azure

Required services:
- Redis instance (Redis Cloud, AWS ElastiCache, etc.)
- TURN server for production WebRTC (coturn or Twilio)

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## License

MIT
