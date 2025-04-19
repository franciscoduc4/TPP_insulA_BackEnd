import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { specs, swaggerUi, swaggerUiOptions } from './config/swagger';
import http from 'http';

// Routes
import userRoutes from './routes/user.routes';
import glucoseRoutes from './routes/glucose.routes';
import activityRoutes from './routes/activity.routes';
import insulinRoutes from './routes/insulin.routes';
import foodRoutes from './routes/food.routes';
import debugRoutes from './routes/debug.routes';

// Middleware
import { errorHandler, notFound } from './middleware/error.middleware';

// Config
dotenv.config();
const app: Express = express();

// Initialize PrismaClient
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Basic middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  maxAge: 86400,
}));

// Configure Helmet (before routes)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log('=== Request Details ===');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Request Path:', req.path);
  console.log('Base URL:', req.baseUrl);
  console.log('Original URL:', req.originalUrl);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('=== End Request Details ===');
  next();
});

// Health check endpoint (before api routes)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Swagger documentation (before api routes)
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(specs, {
  ...swaggerUiOptions,
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Mount debug routes first
app.use('/api/debug', debugRoutes);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/glucose', glucoseRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/insulin', insulinRoutes);
app.use('/api/food', foodRoutes);

// Root path redirect to API docs
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api/docs');
});

// Error handling middleware (must be last)
app.use(notFound);
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('=== Error Details ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Body:', req.body);
  console.error('=== End Error Details ===');

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Server setup
const port = Number(process.env.PORT) || 3000;

if (require.main === module) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`⚡️[server]: Server is running on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database connection established');
  });

  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;