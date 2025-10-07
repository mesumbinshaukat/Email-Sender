# 📚 Complete Setup, Deployment & Tracking Guide

This comprehensive guide covers everything from setup to deployment and troubleshooting.

---

## 🚀 Quick Start

### 1. **Clone & Install**
```bash
git clone <your-repo>
cd email-tracker-mern

# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### 2. **Configure Environment**

**Backend `.env`:**
```env
MONGODB_URI=your_mongodb_connection
PORT=5000
BACKEND_URL=http://localhost:5000
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_key
REDIS_URL=redis://127.0.0.1:6379
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. **Run**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 📧 Email Read Time Tracking - How It Works

### **New Pixel-Based Approach**

Since most email clients block JavaScript, we use **multiple tracking pixels** that load at different times:

```
Email opened → Pixels load progressively:
├─ 5 seconds  → /api/track/readtime/ID?t=5
├─ 10 seconds → /api/track/readtime/ID?t=10
├─ 15 seconds → /api/track/readtime/ID?t=15
├─ 20 seconds → /api/track/readtime/ID?t=20
├─ 30 seconds → /api/track/readtime/ID?t=30
├─ 45 seconds → /api/track/readtime/ID?t=45
└─ 60 seconds → /api/track/readtime/ID?t=60

Last loaded pixel = Estimated read time
```

### **Backend Logs You'll See:**

**When sending email:**
```
✅ Tracking pixel injected (with 7 read-time pixels)
🔗 Read time pixels: /api/track/readtime/ID?t=[5,10,15,20,30,45,60]
✅ VERIFIED: Read time tracking pixels are in HTML
```

**When email is opened:**
```
📧 Email open tracked: abc123...
✅ Email open saved. Total opens: 1

⏱️  READ TIME PIXEL LOADED: { trackingId: "abc123", timeMarker: "5s", method: "PIXEL" }
✅ READ TIME SAVED: { sessionDuration: "5 seconds", totalReadTime: "5 seconds" }

⏱️  READ TIME PIXEL LOADED: { trackingId: "abc123", timeMarker: "10s", method: "PIXEL" }
✅ READ TIME SAVED: { sessionDuration: "10 seconds", totalReadTime: "10 seconds" }

⏱️  READ TIME PIXEL LOADED: { trackingId: "abc123", timeMarker: "30s", method: "PIXEL" }
✅ READ TIME SAVED: { sessionDuration: "30 seconds", totalReadTime: "30 seconds" }
```

---

## 🌐 Deployment

### **Vercel Deployment**

1. **Push to GitHub**
2. **Deploy Backend:**
   - Import repo in Vercel
   - Root: `backend`
   - Add all env variables
   - **Important:** Set `BACKEND_URL` to your Vercel backend URL
3. **Deploy Frontend:**
   - Import repo again
   - Root: `frontend`
   - Set `VITE_API_URL` to backend URL + `/api`

### **Local Testing with Tunnel**

```bash
# Install localtunnel
npm install -g localtunnel

# Start backend
cd backend
npm run dev

# In new terminal
lt --port 5000

# Copy the URL and update BACKEND_URL in .env
# Restart backend
```

---

## 🧪 Testing

### **Test Read Time Tracking:**

1. Send email to yourself
2. Check backend logs - should see pixels injected
3. Open email
4. Watch backend logs - pixels load progressively
5. Check database:
   ```javascript
   db.emails.findOne({ trackingId: "..." })
   // tracking.totalReadTime should show seconds
   // tracking.readSessions should have entries
   ```

---

## 🐛 Troubleshooting

### **Read Time Not Showing:**

1. **Check backend logs** - Are pixels injected?
2. **Check email HTML** - View source, look for `<img src="...readtime...?t=5"`
3. **Test endpoint:** `curl https://your-backend/api/track/readtime/test?t=5`
4. **Email client** - Gmail may block images, click "Display images"

### **No Logs Appearing:**

- Ensure `BACKEND_URL` is publicly accessible
- Check firewall/CORS settings
- Verify MongoDB connection

---

**Last Updated:** October 7, 2025
