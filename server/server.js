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
