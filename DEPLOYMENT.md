# Deployment & Infrastructure Guide

This document shows recommended, practical steps to: claim student domain offers, deploy the frontend and backend, run a TURN server (coturn) on a small DigitalOcean droplet using GitHub Student credits, and wire DNS + environment variables. It's written to work for the current repo layout (Vite frontend in root `src/` and a Node backend in `server/`).

## Quick overview (recommended stack)
- Domain: Namecheap (use the GitHub Student offers when available)
- Frontend: Vercel (excellent Next/Vite integration) — good free tier for prototyping
- Backend / Signaling / REST: Render (always-on, small hobby instance) — more predictable long-lived services than serverless
- TURN server: coturn on a DigitalOcean droplet using GitHub Student credits
- Database & Storage: Supabase (you already have this in the repo)

## Files added
- `server/src/routes/turn.ts` — ephemeral TURN credential endpoint
- `/.env.example` — example variable names for Vite frontend and server

---

## 1) Domains & Namecheap Student offers (how to claim)
1. Sign into your GitHub Student Pack and locate the Namecheap / Name.com offers.
2. If Namecheap provides a free year on supported TLDs, claim the domain (or a discounted .com if you prefer).
3. Decide whether to use Namecheap's nameservers (recommended for ease) or manage DNS elsewhere. We'll show both flows below.

Notes: If you keep Namecheap nameservers, add the DNS records they instruct (A/CNAME) to point to Vercel/Render. If you move nameservers to Vercel/Render, follow their onboarding flow and update nameservers at Namecheap.

---

## 2) Frontend (Vite) — deploy to Vercel
1. Create a Vercel account and connect your GitHub repo.
2. Import the project and set the root to the repository root (Vite will detect automatically).
3. Build settings (Vite):
   - Framework preset: Other (Vite)
   - Build Command: `npm run build` (or `yarn build`)
   - Output Directory: `dist`
4. Add environment variables in Vercel (see `server/.env.example` names and `DEPLOYMENT.md`). For Vite, variables must be prefixed with `VITE_` to be available in the browser.
5. Add a Custom Domain in Vercel dashboard and follow the DNS instructions Vercel provides.

DNS options:
- Option A (recommended): Let Vercel handle DNS — update nameservers at Namecheap to Vercel's nameservers.
- Option B: Keep Namecheap DNS — add the A/CNAME records Vercel lists for your domain.

---

## 3) Backend / Signaling server — deploy to Render
Render is a good place for small always-on Node services.

1. In Render, create a new Web Service from your GitHub repo and point it to the `server/` directory.
2. Set the environment to Node and set the build & start commands appropriate for `server/package.json`. Example:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
3. Add secrets in Render's dashboard for:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY (or whatever server-side key you need)
   - TURN_SERVER_URL, TURN_USERNAME, TURN_PASSWORD or TURN_SHARED_SECRET (recommended)
4. Ensure the service has the ports allowed (Render handles this) and verify health checks.

Notes: If you configure `TURN_SHARED_SECRET` on Render and also configure coturn with `use-auth-secret`, the server will mint ephemeral TURN credentials for clients at `/api/webrtc/turn-credentials`.

---

## 4) TURN Server (coturn) on DigitalOcean
Why: NATs and symmetric NATs / restrictive networks sometimes prevent direct peer-to-peer WebRTC. A TURN server relays media when peers cannot connect directly.

High-level steps (manual):
1. Create a small droplet (e.g., Ubuntu 22.04) on DigitalOcean. Use GitHub Student credits to pay.
2. Reserve a floating IP or create an A record for `turn.your-domain.com` pointing to the droplet.
3. SSH into the droplet and run:

```bash
sudo apt update && sudo apt install -y coturn certbot
```

4. Obtain a TLS certificate (recommended for TLS/TCP TURN on 5349):

```bash
sudo certbot certonly --standalone -d turn.your-domain.com
# certs will usually be at /etc/letsencrypt/live/turn.your-domain.com/
```

5. Configure coturn:
 - Recommended: enable `use-auth-secret` and `static-auth-secret` in `/etc/turnserver.conf` and set a `static-auth-secret` (shared secret) — the server will use this to issue ephemeral credentials.
 - Example minimal settings to add to `/etc/turnserver.conf`:

```
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=<your-shared-secret>
realm=your-domain.com
cert=/etc/letsencrypt/live/turn.your-domain.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.your-domain.com/privkey.pem
relay-ip=<droplet-ip>
external-ip=<droplet-ip>
min-port=49152
max-port=65535
```

Then enable coturn and restart:

```bash
sudo sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn || true
sudo systemctl restart coturn
```

6. Firewall: allow UDP/TCP 3478 and 5349 and the relay port range (49152-65535 UDP):

```bash
sudo ufw allow 22/tcp
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp
sudo ufw enable
```

Security & credential rotation:
- Use a strong randomly generated shared secret and store it in Render/Vercel secrets as `TURN_SHARED_SECRET`.
- The server endpoint `/api/webrtc/turn-credentials` will return short-lived credentials (HMAC-SHA1) that coturn accepts when `use-auth-secret` is enabled.

Client usage (browser): request ephemeral creds from your server and then create RTCPeerConnection with the returned credentials.

---

## 5) Supabase notes
- Keep your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend.
- Store your server-side service role key as a secret in Render (do not put it in client code).
- If you need larger upload/recording storage, move heavy assets to an S3-compatible bucket or Supabase bucket and add lifecycle rules.

---

## 6) Environment variables (how to map to providers)
The `server/.env.example` contains the complete list of server-side variables. For Vite front-end variables must start with `VITE_`.

- In Vercel: set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURN_URL` (if used client-side)
- In Render (service): set `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `TURN_SERVER_URL`, and either `TURN_USERNAME`/`TURN_PASSWORD` (static) or `TURN_SHARED_SECRET` (recommended)

Security note: ephemeral TURN credentials are safer. Configure coturn with `use-auth-secret` and set the same `static-auth-secret` value as `TURN_SHARED_SECRET` in Render.

---

## 7) Checklist before going live
- [ ] Domain purchased & DNS pointing to host
- [ ] Frontend deployed on Vercel and custom domain attached
- [ ] Backend deployed on Render with required env vars
- [ ] coturn running on DigitalOcean with TLS and correct ports open
- [ ] TURN and Supabase secrets stored in provider dashboards (Vercel/Render)
- [ ] Test WebRTC sessions across different networks (home, mobile, NATed office)

---

## 8) Next steps I can help with
- Provide a shell script that automates coturn install + certbot on an Ubuntu droplet
- Create a GitHub Actions workflow to deploy to Render and Vercel automatically
- Add a small server endpoint to produce ephemeral TURN credentials (already added)

Added artifacts in this repo by the assistant:
... (see DO_DROPLET.md for a one-click droplet guide)

Added artifacts in this repo by the assistant:
- `scripts/setup_coturn.sh` — opinionated installer for coturn + certbot on Ubuntu droplets. Use with `sudo` on a fresh droplet. The script will try to obtain TLS certs and configure coturn with `static-auth-secret` (shared secret).
- `server/src/routes/turn.ts` — endpoint available at `/api/webrtc/turn-credentials` that returns ephemeral HMAC credentials when `TURN_SHARED_SECRET` is configured. Falls back to static `TURN_USERNAME`/`TURN_PASSWORD` if present.
- `server/src/middleware/requireAuth.ts` — optional middleware that, when `TURN_REQUIRE_AUTH=true`, requires an Authorization Bearer token and validates it against Supabase's `/auth/v1/user` endpoint.
- `.github/workflows/deploy.yml` — CI job that builds frontend + server and triggers deploy hooks for Vercel/Render when `VERCEL_DEPLOY_HOOK` and `RENDER_DEPLOY_HOOK` are set as repository secrets.

How to use the repo artifacts
- Coturn script:
   - Copy the droplet domain and a secure shared secret to the droplet (or pass as args):
      ```bash
      sudo bash scripts/setup_coturn.sh turn.your-domain.com "$(openssl rand -base64 24)"
      ```
   - After the script completes, put the same shared secret into Render/Vercel as `TURN_SHARED_SECRET`.

- To protect the TURN endpoint with Supabase JWTs, set `TURN_REQUIRE_AUTH=true` in your server's env and deploy. Clients must send `Authorization: Bearer <access_token>` when requesting ephemeral credentials.

- CI deploy hooks:
   - Add the webhook URLs (deploy hooks) returned by Vercel / Render into repository secrets `VERCEL_DEPLOY_HOOK` and `RENDER_DEPLOY_HOOK` respectively.
   - Push to `main` to trigger the workflow.

If you'd like, I can add any of the above (script, GH Action, additional tests). Which one should I do next?
