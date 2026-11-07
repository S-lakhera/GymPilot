import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import { ApiResponse } from './utils/apiResponse.js';
import testRoutes from './routes/testRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import trainerRoutes from './routes/trainerRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import planRoutes from './routes/planRoutes.js';

const app = express();

// 1. Cross-Origin Resource Sharing (CORS) with credentials support
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);

// 2. Request Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.cookieSecret));

// 3. API Documentation (Swagger UI)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'GymPilot API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Swagger JSON endpoint for clients/tools
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 4. Health Check Endpoint
app.get('/api/health', (req, res) => {
  return ApiResponse.success(res, {
    environment: env.nodeEnv,
    timezone: env.db.timezone,
    timestamp: new Date().toISOString(),
  }, 'GymPilot API is healthy and running.');
});

// 5. Core Application Routes (Milestones 4.1 & 4.2)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/plans', planRoutes);

// 6. Dev Foundation Test Routes (only enabled in non-production)
if (env.nodeEnv !== 'production') {
  app.use('/api/test', testRoutes);
}

// 7. 404 Route Handler
app.use((req, res) => {
  return res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// 8. Global Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
