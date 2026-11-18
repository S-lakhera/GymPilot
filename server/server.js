import app from './src/app.js';
import { env } from './src/config/env.js';
import { testConnection } from './src/config/db.js';

async function startServer() {
  try {
    // Verify database connectivity on startup
    await testConnection();

    const server = app.listen(env.port, env.host, () => {
      console.log(`=========================================`);
      console.log(`🏋️  GymPilot Server running on http://${env.host === '0.0.0.0' ? 'localhost' : env.host}:${env.port}`);
      console.log(`⚡  Environment: ${env.nodeEnv}`);
      console.log(`🕒  Timezone: ${env.db.timezone}`);
      console.log(`=========================================`);
    });

    // Milestone 6.4: Automated background expiration & notification reconciliation runner
    // Runs on boot (after 5s grace period) and recurs every 12 hours
    if (env.nodeEnv !== 'test') {
      setTimeout(async () => {
        try {
          const { subscriptionService } = await import('./src/services/subscriptionService.js');
          const stats = await subscriptionService.syncStatuses();
          console.log('🔄  [Background Runner] Initial membership expiration sync completed:', stats);
        } catch (err) {
          console.error('⚠️   [Background Runner] Initial expiration sync failed:', err.message);
        }
      }, 5000);

      const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
      const syncTimer = setInterval(async () => {
        try {
          const { subscriptionService } = await import('./src/services/subscriptionService.js');
          await subscriptionService.syncStatuses();
          console.log('🔄  [Background Runner] Recurring membership expiration sync completed.');
        } catch (err) {
          console.error('⚠️   [Background Runner] Recurring expiration sync failed:', err.message);
        }
      }, SYNC_INTERVAL_MS);
      syncTimer.unref();
    }

    // Graceful shutdown handling
    const shutdown = (signal) => {
      console.log(`\n${signal} signal received: closing HTTP server`);
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal: Server startup aborted due to database connection failure.');
    process.exit(1);
  }
}

startServer();
