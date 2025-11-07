import express from 'express';
// Use the global fetch available in Node 18+. If running older Node, install 'node-fetch' or run with a polyfill.
const fetch = (globalThis as any).fetch;
import turnRouter from '../src/routes/turn';

// A small test harness to run the real turn router in-process and exercise endpoints.
(async () => {
  const app = express();
  app.use('/', turnRouter as any);

  const server = app.listen(0, async () => {
    const port = (server.address() as any).port;
    const base = `http://127.0.0.1:${port}`;
    console.log('Test server listening at', base);

    // Test static mode
    process.env.TURN_SERVER_URL = 'turn.example:3478';
    process.env.TURN_USERNAME = 'stest';
    process.env.TURN_PASSWORD = 'spass';
    delete process.env.TURN_SHARED_SECRET;

    try {
      const r = await fetch(`${base}/turn-credentials`);
      const j = await r.json();
      console.log('Static result:', j);
      if (j.username !== process.env.TURN_USERNAME) throw new Error('Static username mismatch');
    } catch (err) {
      console.error('Static test failed', err);
      process.exit(2);
    }

    // Test ephemeral mode
    delete process.env.TURN_USERNAME;
    delete process.env.TURN_PASSWORD;
    process.env.TURN_SHARED_SECRET = 'test-secret';
    process.env.TURN_EPHEMERAL_TTL = '120';

    try {
      const r2 = await fetch(`${base}/turn-credentials?userId=unit`);
      const j2 = await r2.json();
      console.log('Ephemeral result:', j2);
      if (!j2.username || !j2.credential) throw new Error('Ephemeral missing fields');
    } catch (err) {
      console.error('Ephemeral test failed', err);
      process.exit(3);
    }

    console.log('All tests passed');
    server.close();
    process.exit(0);
  });
})();
