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
// import emailAuthenticationRoutes from './routes/emailAuthenticationRoutes.js';
import dataPrivacyRoutes from './routes/dataPrivacyRoutes.js';
import abTestRoutes from './routes/abTestRoutes.js';
import inboxPreviewRoutes from './routes/inboxPreviewRoutes.js';
import sendTimeOptimizationRoutes from './routes/sendTimeOptimizationRoutes.js';
import predictorRoutes from './routes/predictorRoutes.js';
import voiceRoutes from './routes/voice.js';
import schedulerRoutes from './routes/scheduler.js';
import warmupRoutes from './routes/warmup.js';
import sequenceRoutes from './routes/sequences.js';
import emailRoutes from './routes/emailRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import agenticRoutes from './routes/agenticRoutes.js';
import generativeRoutes from './routes/generativeRoutes.js';
import replyRoutes from './routes/replies.js';
import heatmapRoutes from './routes/heatmap.js';
import meetingRoutes from './routes/meetings.js';
import retentionRoutes from './routes/retention.js';
import accessibilityRoutes from './routes/accessibility.js';
import revenueRoutes from './routes/revenue.js';
import competitorRoutes from './routes/competitors.js';
import leadRoutes from './routes/leads.js';
import hygieneRoutes from './routes/hygiene.js';
import complianceRoutes from './routes/compliance.js';
import designRoutes from './routes/designRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import emojiRoutes from './routes/emojiRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import smartTriggersRoutes from './routes/smartTriggersRoutes.js';
import copilotRoutes from './routes/copilotRoutes.js';
import predictiveAnalyticsRoutes from './routes/predictiveAnalyticsRoutes.js';
import cohortRoutes from './routes/cohortRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import ecommerceRoutes from './routes/ecommerceRoutes.js';
import whiteLabelRoutes from './routes/whiteLabelRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import customReportRoutes from './routes/customReportRoutes.js';
import aiTrainingRoutes from './routes/aiTrainingRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import enrichmentRoutes from './routes/enrichment.js';
import bulkRoutes from './routes/bulkRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import slackRoutes from './routes/slackRoutes.js';
import outreachRoutes from './routes/outreachRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import transactionalRoutes from './routes/transactionalRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import attributionRoutes from './routes/attributionRoutes.js';
import inboxRotationRoutes from './routes/inboxRotationRoutes.js';
import ampRoutes from './routes/ampRoutes.js';
import visualPersonalizationRoutes from './routes/visualPersonalizationRoutes.js';
import goalAutomationRoutes from './routes/goalAutomationRoutes.js';
import clvRoutes from './routes/clvRoutes.js';
import conversationAgentsRoutes from './routes/conversationAgentsRoutes.js';
import staggeredSendRoutes from './routes/staggeredSendRoutes.js';
import liquidRoutes from './routes/liquidRoutes.js';
import crossChannelRoutes from './routes/crossChannelRoutes.js';
import zeroPartyRoutes from './routes/zeroPartyRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import envRoutes from './routes/envRoutes.js';
import aiProviderRoutes from './routes/aiProviderRoutes.js';

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
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://email-sender-three-sable.vercel.app',
    'https://email-sender-backend-theta.vercel.app',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Add headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

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

app.use('/api/health', healthRoutes);
app.use('/api/env', envRoutes);
app.use('/api/ai-providers', aiProviderRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/smtp', smtpRoutes);
// app.use('/api/emails-auth', emailAuthenticationRoutes);
app.use('/api/privacy', dataPrivacyRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/agentic', agenticRoutes);
app.use('/api/ai', generativeRoutes);
app.use('/api/predictor', predictorRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/warmup', warmupRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/sequences', sequenceRoutes);
app.use('/api/enrichment', enrichmentRoutes);
app.use('/api/replies', replyRoutes);
app.use('/api/predictive-analytics', predictiveAnalyticsRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/retention', retentionRoutes);
app.use('/api/accessibility', accessibilityRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/hygiene', hygieneRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/design', designRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/triggers', smartTriggersRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/cohort', cohortRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/ecommerce', ecommerceRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/slack', slackRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/transactional', transactionalRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/ab-test', abTestRoutes);
app.use('/api/inbox-preview', inboxPreviewRoutes);
app.use('/api/send-time-optimization', sendTimeOptimizationRoutes);
app.use('/api/privacy', dataPrivacyRoutes);
app.use('/api/white-label', whiteLabelRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/reports', customReportRoutes);
app.use('/api/ai-training', aiTrainingRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/inbox-rotation', inboxRotationRoutes);
app.use('/api/amp', ampRoutes);
app.use('/api/visual-personalization', visualPersonalizationRoutes);
app.use('/api/goal-automation', goalAutomationRoutes);
app.use('/api/clv', clvRoutes);
app.use('/api/conversation-agents', conversationAgentsRoutes);
app.use('/api/staggered-send', staggeredSendRoutes);
app.use('/api/liquid', liquidRoutes);
app.use('/api/cross-channel', crossChannelRoutes);
app.use('/api/zero-party', zeroPartyRoutes);
app.use('/api/analytics', heatmapRoutes);

// Favicon - avoid 404 noise in logs
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Minimal contacts endpoint to avoid 404s in frontend calls
// TODO: Replace with full contacts service when ready
app.get('/api/contacts', (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  res.json({ success: true, data: [] , limit });
});

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
