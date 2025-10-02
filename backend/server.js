import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import smtpRoutes from './routes/smtpRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import agenticRoutes from './routes/agenticRoutes.js';
import generativeRoutes from './routes/generativeRoutes.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Trust proxy (important for Vercel deployment)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Email Tracker API is running',
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/smtp', smtpRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/agentic', agenticRoutes);
app.use('/api/ai', generativeRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Email Tracker Server Running                    ║
║                                                       ║
║   📍 Port: ${PORT}                                    ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}              ║
║   📧 Ready to send and track emails!                 ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});

export default app;
