# 📧 Email Tracker - MERN Stack

A full-fledged email tracking tool built with the MERN stack (MongoDB, Express, React, Node.js). Send emails with detailed tracking capabilities including open rates, click tracking, read time analytics, and more.

## ✨ Features

### 🚀 Core Features
- **Email Sending**: Send emails through your own SMTP configuration
- **Open Tracking**: Track when recipients open your emails with pixel tracking
- **Click Tracking**: Monitor link clicks with automatic URL wrapping
- **Read Time Analytics**: Measure how long recipients spend reading your emails
- **Multiple Recipients**: Support for To, Cc, and Bcc fields
- **Rich Text Editor**: Compose beautiful HTML emails with React Quill
- **Real-time Analytics**: Comprehensive dashboard with charts and statistics

### 🔐 Security & Authentication
- JWT-based authentication
- Secure password hashing with bcryptjs
- Protected API routes
- CORS configuration
- Rate limiting
- Helmet security headers

### 📊 Analytics Dashboard
- Total emails sent/failed
- Open rate and click rate percentages
- Unique opens tracking
- Click-through analytics
- Interactive charts with Recharts
- Email history with detailed tracking data

### 🎙️ Voice-to-Email
- **Speech-to-Text**: Dictate emails using browser speech recognition or OpenAI Whisper
- **Voice Commands**: Hands-free email composition with natural language commands
- **Real-time Transcription**: See your words transcribed instantly
- **Smart Commands**: Say "to john@company.com" or "subject meeting tomorrow" to auto-fill fields
- **Campaign Integration**: Associate voice-composed emails with campaigns

### 📅 Smart Email Scheduler
- **AI-Powered Timing**: Automatically determines optimal send times per recipient
- **Engagement Analysis**: Analyzes past open/click patterns for best timing
- **Timezone-Aware**: Handles multiple timezones with IANA format support
- **Queue Management**: Bull/Redis queue for reliable scheduled sends
- **Multiple Suggestions**: Get 3+ AI-recommended times with confidence scores
- **Reschedule Support**: Easily update scheduled times before sending

### 🤖 AI-Powered Features
- **Performance Prediction**: AI analysis of email success rates before sending
- **Smart Optimization**: AI-generated subject lines and content improvements
- **Campaign Intelligence**: Automated segmentation and follow-up suggestions
- **Sentiment Analysis**: AI-powered tone and content analysis

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Nodemailer** - Email sending
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **React Quill** - Rich text editor
- **Recharts** - Charts and analytics

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- **Redis** (for email scheduling queue)
- SMTP credentials (Gmail, Outlook, etc.)
- **OpenAI API Key** (for voice transcription and AI features)
- **Microphone access** (for voice dictation)

## 🚀 Installation & Setup

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. MongoDB Setup

Make sure MongoDB is running locally:
```bash
mongod
```

Or use MongoDB Compass to connect to: `mongodb://localhost:27017/email-sender-tracker`

### ⚠️ Important: Email Tracking Setup

**Tracking won't work with localhost URLs!** When you open emails on other devices/clients, they can't reach `localhost:5000`.

**Quick Fix**: Use ngrok to make your backend publicly accessible:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Update backend/.env:
BACKEND_URL=https://abc123.ngrok.io

# Restart backend
npm run dev
```

📖 **See [QUICK_FIX.md](./QUICK_FIX.md) for detailed instructions**

## 🎯 Usage

### 1. Register/Login
- Navigate to `http://localhost:5173`
- Create a new account or login

### 2. Configure SMTP Settings
- Go to Settings page
- Enter your SMTP details:
  - **Gmail**: smtp.gmail.com, Port 587
  - **Outlook**: smtp-mail.outlook.com, Port 587
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)
- Test the connection before saving

### 3. Send Tracked Emails
- Navigate to "Send Email"
- Add recipients (To, Cc, Bcc)
- Write your subject and email content
- Click "Send Email"

### 4. View Analytics
- Dashboard: Overview of all email statistics
- Emails: List of sent emails with tracking data
- Analytics: Detailed charts and insights

### 🎙️ Using Voice-to-Email

1. **Enable Voice Features**: Go to Send Email page
2. **Grant Microphone Permission**: Click "Start Voice" and allow access
3. **Dictate Your Email**: Speak naturally:
   - "New email to john@company.com"
   - "Subject meeting at 3pm tomorrow"
   - "Dear John, please review the attached report"
   - "Send"
4. **Voice Commands**: Try these commands:
   - "to [email]" - Add recipient
   - "cc [email]" - Add CC recipient
   - "subject [text]" - Set subject
   - "send" - Send the email
   - "cancel" - Clear composition
5. **Hands-Free Mode**: Click "Hands-Free Mode" for overlay with command suggestions

**Note**: Voice features require OpenAI API key for full functionality.

### 📅 Using Smart Email Scheduler

1. **Compose Email**: Fill in subject, recipients, and body on Send Email page
2. **Click "Schedule"**: Opens AI scheduling modal
3. **View AI Suggestions**: See 3+ optimal send times with confidence scores
4. **Select Time**: Choose AI recommendation or set custom time
5. **Confirm Schedule**: Email queued for optimal delivery
6. **Manage Queue**: Visit `/queue` to view/reschedule/cancel scheduled emails

**Features:**
- AI analyzes recipient's past engagement (open times, response patterns)
- Automatically detects and handles timezones
- Fallback to 10am local time if insufficient data
- Reschedule anytime before sending
- Real-time queue status monitoring

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### SMTP Configuration
- `GET /api/smtp` - Get SMTP config
- `PUT /api/smtp` - Update SMTP config
- `POST /api/smtp/test` - Test SMTP connection
- `DELETE /api/smtp` - Delete SMTP config

### Emails
- `POST /api/emails/send` - Send tracked email
- `GET /api/emails` - Get all emails (paginated)
- `GET /api/emails/:id` - Get single email
- `GET /api/emails/analytics/stats` - Get email statistics
- `DELETE /api/emails/:id` - Delete email

### Tracking (Public)
- `GET /api/track/open/:trackingId` - Track email open
- `GET /api/track/click/:trackingId` - Track link click
- `POST /api/track/readtime/:trackingId` - Track read time

### Voice-to-Email
- `POST /api/voice/transcribe` - Transcribe audio to text
- `POST /api/voice/command` - Parse voice command
- `POST /api/voice/compose` - Compose email from voice
- `GET /api/voice/supported-commands` - Get voice commands list

### Smart Email Scheduler
- `POST /api/scheduler/schedule-email` - Schedule email with AI optimal time
- `GET /api/scheduler/optimal-times/:recipientEmail` - Get AI time suggestions
- `PUT /api/scheduler/reschedule/:emailId` - Reschedule queued email
- `GET /api/scheduler/queue` - Get user's scheduled emails queue

## 🚢 Deployment to Vercel

### Backend Deployment
1. Push code to GitHub
2. Import repository in Vercel
3. Select `backend` folder as root
4. Add environment variables
5. Deploy

### Frontend Deployment
1. Import repository in Vercel
2. Select `frontend` folder as root
3. Add `VITE_API_URL` environment variable
4. Deploy

## 🔧 Gmail SMTP Setup

1. Enable 2-factor authentication
2. Generate an App Password:
   - Go to Google Account → Security
   - 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in SMTP settings

## 📝 Quick Start Commands

```bash
# Terminal 1 - Start MongoDB
mongod

# Terminal 2 - Start Backend
cd backend
npm install
npm run dev

# Terminal 3 - Start Frontend
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

**Built with ❤️ using MERN Stack + Nodemailer**