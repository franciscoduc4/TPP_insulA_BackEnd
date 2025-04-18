import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { specs, swaggerUi } from './config/swagger';

// Routes
import userRoutes from './routes/user.routes';
import glucoseRoutes from './routes/glucose.routes';
import activityRoutes from './routes/activity.routes';
import insulinRoutes from './routes/insulin.routes';

// Middleware
import { errorHandler, notFound } from './middleware/error.middleware';

// Config
dotenv.config();
const app: Express = express();

// Initialize PrismaClient
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});

// Middleware
// Configure body parsing before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(helmet());
app.use(morgan('dev'));

// Add request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  if (req.body) console.log('Request Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/glucose', glucoseRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/insulin', insulinRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;

// Start server
if (require.main === module) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`⚡️[server]: Server is running on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database connection established');
  });

  // Handle graceful shutdown
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