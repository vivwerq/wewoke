#!/usr/bin/env node
/*
  Simple smoke test for the TURN credentials endpoint behavior.
  This script will:
  - Start a small Express app that mounts a handler equivalent to /turn-credentials
  - Test static mode (TURN_USERNAME/TURN_PASSWORD)
  - Test ephemeral mode (TURN_SHARED_SECRET)

  Usage:
    node scripts/smoke_test_turn.js
*/

import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';

function makeHandler() {
  const router = express.Router();
  router.get('/turn-credentials', (req, res) => {
    const TURN_URL = process.env.TURN_SERVER_URL || 'turn.example:3478';
    const sharedSecret = process.env.TURN_SHARED_SECRET;
    const staticUser = process.env.TURN_USERNAME;
    const staticPass = process.env.TURN_PASSWORD;

    if (sharedSecret) {
      const ttl = Number(process.env.TURN_EPHEMERAL_TTL || 300);
      const expiry = Math.floor(Date.now() / 1000) + ttl;
      const username = String(expiry) + ':' + (req.query.userId || 'anon');
      const hmac = crypto.createHmac('sha1', sharedSecret).update(username).digest('base64');
      return res.json({ username, credential: hmac, ttl, urls: [
        `turn:${TURN_URL}?transport=udp`,
        `turn:${TURN_URL}?transport=tcp`
      ]});
    }

    if (staticUser && staticPass) {
      return res.json({ username: staticUser, credential: staticPass, ttl: null, urls: [
        `turn:${TURN_URL}?transport=udp`,
        `turn:${TURN_URL}?transport=tcp`
      ]});
    }

    return res.status(403).json({ error: 'No TURN credential configuration found' });
  });
  return router;
}

async function run() {
  const app = express();
  app.use('/', makeHandler());

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const base = `http://127.0.0.1:${port}`;
    console.log('Test server running at', base);

    // Test 1: static mode
    process.env.TURN_USERNAME = 'testuser';
    process.env.TURN_PASSWORD = 'testpass';
    delete process.env.TURN_SHARED_SECRET;

    try {
      const r1 = await fetch(`${base}/turn-credentials`);
      const j1 = await r1.json();
      console.log('Static mode response:', j1);
      if (j1.username !== 'testuser' || j1.credential !== 'testpass') {
        throw new Error('Static mode response mismatch');
      }
    } catch (err) {
      console.error('Static mode test failed:', err);
      process.exitCode = 2;
      server.close();
      return;
    }

    // Test 2: ephemeral
    delete process.env.TURN_USERNAME;
    delete process.env.TURN_PASSWORD;
    process.env.TURN_SHARED_SECRET = crypto.randomBytes(18).toString('base64');
    process.env.TURN_EPHEMERAL_TTL = '60';

    try {
      const r2 = await fetch(`${base}/turn-credentials?userId=alice`);
      const j2 = await r2.json();
      console.log('Ephemeral mode response:', j2);
      if (!j2.username || !j2.credential || j2.ttl !== 60) {
        throw new Error('Ephemeral mode response mismatch');
      }
    } catch (err) {
      console.error('Ephemeral mode test failed:', err);
      process.exitCode = 3;
      server.close();
      return;
    }

    console.log('All tests passed.');
    server.close();
  });
}

run().catch(err => {
  console.error('Smoke test fatal error', err);
  process.exit(1);
});
