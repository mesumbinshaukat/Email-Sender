# ⚡ Quick Deployment Guide

## 📋 Vercel Environment Variables

### Backend:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/email-sender-tracker
JWT_SECRET=generate-random-32-char-string-here
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend-name.vercel.app
BACKEND_URL=https://your-backend-name.vercel.app
```

### Frontend:
```
VITE_API_URL=https://your-backend-name.vercel.app/api
```

---

## 🚀 Deploy Steps

### 1. MongoDB Atlas
- Create cluster at mongodb.com/cloud/atlas
- Create user & whitelist `0.0.0.0/0`
- Copy connection string

### 2. Deploy Backend
- Vercel → Import Git Repository
- Root Directory: `backend`
- Paste environment variables above
- Deploy

### 3. Deploy Frontend  
- Vercel → Import same repository
- Root Directory: `frontend`
- Add VITE_API_URL with backend URL
- Deploy

### 4. Update URLs
- Copy actual deployed URLs
- Update FRONTEND_URL & BACKEND_URL in backend env
- Redeploy backend

---

## ✅ Done!

Your email tracker is live. Test by:
1. Register account
2. Configure SMTP
3. Send email
4. Track opens/clicks

No more localhost/ngrok issues! 🎉
