# 🚀 Vercel Deployment Guide

## Backend Deployment

### Environment Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/email-sender-tracker
JWT_SECRET=your-super-secret-random-string-min-32-chars
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-backend.vercel.app
```

### Build Settings:
- **Framework Preset**: Other
- **Root Directory**: `backend`
- **Build Command**: (leave empty)
- **Output Directory**: (leave empty)
- **Install Command**: `npm install`

---

## Frontend Deployment

### Environment Variables:
```
VITE_API_URL=https://your-backend.vercel.app/api
```

### Build Settings:
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

## MongoDB Atlas Setup (Required)

1. Go to mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Whitelist all IPs: `0.0.0.0/0`
5. Get connection string
6. Replace in MONGODB_URI

---

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Production-ready email tracker with Vercel config"
git push origin main
```

### 2. Deploy Backend
- Import repo in Vercel
- Root: `backend`
- Add environment variables
- Deploy

### 3. Deploy Frontend
- Import same repo again
- Root: `frontend`
- Add VITE_API_URL with backend URL
- Deploy

### 4. Update Backend FRONTEND_URL
- Go to backend project settings
- Update FRONTEND_URL with actual frontend URL
- Redeploy

Done! 🎉
