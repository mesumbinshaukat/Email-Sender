# 🚀 Email Tracker - Complete Setup Guide

## 📦 What's Included

This project includes:
- ✅ **Backend API** - Full REST API with Express.js
- ✅ **Frontend Dashboard** - React + TypeScript + Vite
### Step 3: Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# ✅ Backend running on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev
# ✅ Frontend running on http://localhost:5173
```

## 🌐 Access the Application

Open your browser and navigate to: **http://localhost:5173**

## 👤 First Time Setup

### 1. Create an Account
- Click "Sign up" on the login page
- Enter your name, email, and password
- Click "Create Account"

### 2. Configure SMTP Settings
- After login, go to **Settings** (gear icon in navbar)
- Enter your SMTP details

#### Gmail Example:
```
Host: smtp.gmail.com
Port: 587
Secure: No (TLS/STARTTLS)
Email: your-email@gmail.com
Password: [Your App Password]
```

**Important for Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Google Account → Security
   - 2-Step Verification → App passwords
   - Select "Mail" and generate
3. Use the 16-character password (not your regular password)

#### Other Providers:
- **Outlook**: smtp-mail.outlook.com, Port 587
- **Yahoo**: smtp.mail.yahoo.com, Port 587
- **Custom SMTP**: Use your provider's settings

### 3. Test SMTP Connection
- Click "Test Connection" button
- Wait for success message
- Click "Save Configuration"

## 📧 Sending Your First Email

1. Navigate to **Send Email** in the sidebar
2. Add recipient email(s)
3. Write a subject
4. Compose your email using the rich text editor
5. Click **Send Email**
6. Check the **Dashboard** or **Emails** page to see tracking data

## 📊 Viewing Analytics

### Dashboard
- Overview of all email statistics
- Recent emails list
- Key metrics (opens, clicks, rates)

### Emails Page
- List of all sent emails
- Search functionality
- Click any email to view detailed tracking

### Analytics Page
- Interactive charts
- Performance summary
- Engagement metrics

## 🔧 Configuration Files

### Backend (.env)
Located at `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/email-sender-tracker
JWT_SECRET=your_jwt_secret_key_change_this_in_production_use_strong_random_string
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### Frontend (.env)
Located at `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🎨 Features Overview

### Email Tracking
- **Open Tracking**: 1x1 pixel image tracks when email is opened
- **Click Tracking**: All links are wrapped with tracking URLs
- **Read Time**: Measures how long recipient views the email
- **Multiple Opens**: Tracks each time email is opened
- **User Agent**: Records device/browser information

### Security
- Passwords hashed with bcrypt
- JWT token authentication
- Protected API routes
- CORS enabled
- Rate limiting (100 requests per 15 minutes)
- Helmet security headers

### UI Features
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Smooth animations
- Toast notifications
- Loading states
- Error handling

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
mongod --version

# Check if port 5000 is available
netstat -ano | findstr :5000

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend won't start
```bash
# Check if port 5173 is available
netstat -ano | findstr :5173

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### SMTP Connection Failed
- Verify SMTP host and port
- For Gmail, ensure you're using App Password
- Check if 2FA is enabled
- Try with secure: false for port 587
- Check firewall settings

### MongoDB Connection Error
```bash
# Start MongoDB service
net start MongoDB

# Or run mongod manually
mongod --dbpath "C:\data\db"
```

### Emails not tracking
- Ensure recipient opens email with images enabled
- Check if tracking pixel is in HTML
- Verify BACKEND_URL is accessible
- Check email client (some block tracking pixels)

## 📱 Testing Locally

### Send Test Email
1. Configure SMTP with your email
2. Send email to yourself
3. Open email in different email client
4. Click links in the email
5. Check dashboard for tracking data

### Test Different Scenarios
- Send to multiple recipients
- Use Cc and Bcc
- Test with HTML formatting
- Include images and links
- Test on mobile devices

## 🚀 Production Deployment

### Vercel Deployment

#### Backend:
1. Push code to GitHub
2. Vercel → New Project → Import Repository
3. Root Directory: `backend`
4. Environment Variables:
   - MONGODB_URI (use MongoDB Atlas)
   - JWT_SECRET (generate strong random string)
   - FRONTEND_URL (your frontend URL)
   - BACKEND_URL (your backend URL)
   - NODE_ENV=production

#### Frontend:
1. Vercel → New Project → Import Repository
2. Root Directory: `frontend`
3. Environment Variables:
   - VITE_API_URL (your backend API URL)

### MongoDB Atlas Setup
1. Create account at mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Create database user
4. Whitelist IP (0.0.0.0/0 for all IPs)
5. Get connection string
6. Update MONGODB_URI in backend env

## 📚 API Documentation

### Base URL
```
Local: http://localhost:5000/api
Production: https://your-backend.vercel.app/api
```

### Authentication Endpoints
```
POST /auth/register - Register new user
POST /auth/login - Login user
GET /auth/me - Get current user (requires auth)
PUT /auth/profile - Update profile (requires auth)
```

### Email Endpoints
```
POST /emails/send - Send tracked email (requires auth)
GET /emails - Get all emails (requires auth)
GET /emails/:id - Get single email (requires auth)
GET /emails/analytics/stats - Get statistics (requires auth)
DELETE /emails/:id - Delete email (requires auth)
```

### SMTP Endpoints
```
GET /smtp - Get SMTP config (requires auth)
PUT /smtp - Update SMTP config (requires auth)
POST /smtp/test - Test SMTP connection (requires auth)
DELETE /smtp - Delete SMTP config (requires auth)
```

### Tracking Endpoints (Public)
```
GET /track/open/:trackingId - Track email open
GET /track/click/:trackingId - Track link click
POST /track/readtime/:trackingId - Track read time
```

## 🎓 Advanced Usage

### Custom Email Templates
Edit the HTML in the rich text editor to create custom templates.

### Bulk Email Sending
Add multiple recipients in the "To" field by clicking "Add recipient".

### Email Analytics Export
Use the API to fetch email data and export to CSV/Excel.

### Webhook Integration
Extend tracking endpoints to send webhooks on email events.

## 📞 Support

For issues:
1. Check this guide first
2. Review error messages in console
3. Check MongoDB and server logs
4. Verify environment variables
5. Test SMTP connection separately

## 🎉 You're All Set!

Your email tracking tool is now ready to use. Start sending tracked emails and monitor your engagement metrics!

---

**Happy Tracking! 📧✨**
