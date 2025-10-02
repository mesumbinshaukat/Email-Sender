# 🔍 Email Tracking Setup & Troubleshooting

## ⚠️ Important: Localhost Limitation

**The tracking won't work with `localhost` URLs when testing emails on different devices or email clients!**

### Why Tracking Isn't Working

When you send an email from `localhost:5000`, the tracking URLs embedded in the email look like:
```
http://localhost:5000/api/track/open/abc123
```

When you open this email on:
- Another computer
- Your phone
- A different email client
- Gmail web interface

These devices **cannot reach** `http://localhost:5000` because localhost only refers to the local machine.

## ✅ Solutions

### Option 1: Use ngrok (Recommended for Local Testing)

ngrok creates a public URL that tunnels to your localhost.

#### Setup Steps:

1. **Install ngrok**
   ```bash
   # Download from https://ngrok.com/download
   # Or use chocolatey on Windows:
   choco install ngrok
   ```

2. **Start your backend**
   ```bash
   cd backend
   npm run dev
   # Backend running on http://localhost:5000
   ```

3. **Start ngrok tunnel**
   ```bash
   ngrok http 5000
   ```

4. **Copy the ngrok URL**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:5000
   ```

5. **Update backend .env**
   ```env
   BACKEND_URL=https://abc123.ngrok.io
   ```

6. **Restart backend**
   ```bash
   # Stop and restart the backend server
   npm run dev
   ```

7. **Send a test email**
   - The tracking URLs will now use `https://abc123.ngrok.io`
   - These URLs are accessible from anywhere!

### Option 2: Deploy to Production (Vercel)

For permanent solution, deploy your backend to Vercel:

1. Push code to GitHub
2. Deploy backend to Vercel
3. Get your backend URL (e.g., `https://your-app.vercel.app`)
4. Update `BACKEND_URL` in Vercel environment variables
5. Redeploy

### Option 3: Use Local Network IP (Same Network Only)

If testing on devices on the same WiFi:

1. **Find your local IP**
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. **Update backend .env**
   ```env
   BACKEND_URL=http://192.168.1.100:5000
   ```

3. **Update frontend .env**
   ```env
   VITE_API_URL=http://192.168.1.100:5000/api
   ```

4. **Restart both servers**

5. **Access frontend from other devices**
   ```
   http://192.168.1.100:5173
   ```

**Note**: This only works for devices on the same WiFi network.

## 🧪 Testing Tracking

### Check if Tracking URLs are Correct

1. **Send a test email**
2. **Check the email source/raw content**
   - In Gmail: Click "..." → "Show original"
   - Look for the tracking pixel:
     ```html
     <img src="http://YOUR_BACKEND_URL/api/track/open/TRACKING_ID" width="1" height="1" style="display:none;" alt="" />
     ```
   - Check link URLs:
     ```html
     <a href="http://YOUR_BACKEND_URL/api/track/click/TRACKING_ID?url=...">
     ```

3. **Verify the URL is accessible**
   - Copy the tracking pixel URL
   - Paste it in a browser
   - You should see a tiny transparent image (or download a .gif file)

### Check Backend Logs

With the debugging I added, you'll see console logs:

```bash
📧 Sending email with tracking ID: abc123def456
🔗 Backend URL for tracking: http://localhost:5000
✅ Email sent successfully. Message ID: <...>

# When email is opened:
📧 Email open tracked: abc123def456
✅ Email open saved. Total opens: 1

# When link is clicked:
🖱️ Email click tracked: abc123def456 URL: https://example.com
✅ Email click saved. Total clicks: 1
```

If you don't see these logs, the tracking requests aren't reaching your backend.

## 🔧 Quick Fix Checklist

- [ ] Backend is running on port 5000
- [ ] `BACKEND_URL` in `.env` is set correctly
- [ ] If using ngrok, the tunnel is active
- [ ] Email was sent AFTER updating `BACKEND_URL`
- [ ] Email client allows images (tracking pixel)
- [ ] Check backend console for tracking logs

## 📧 Email Client Considerations

### Gmail
- ✅ Usually allows tracking pixels
- ✅ Caches images (may show multiple opens as one)
- ⚠️ May block external images if sender is not trusted

### Outlook
- ✅ Allows tracking pixels
- ⚠️ May require "Download pictures" permission

### Apple Mail
- ✅ Usually loads images automatically
- ✅ Good for tracking

### Privacy-Focused Clients
- ❌ ProtonMail blocks tracking pixels
- ❌ Some clients have "block remote content" enabled

## 🎯 Recommended Testing Flow

1. **Setup ngrok** (easiest for testing)
   ```bash
   ngrok http 5000
   ```

2. **Update backend .env with ngrok URL**
   ```env
   BACKEND_URL=https://your-ngrok-url.ngrok.io
   ```

3. **Restart backend**
   ```bash
   cd backend
   npm run dev
   ```

4. **Send test email to yourself**

5. **Open email on different device/client**

6. **Check backend console for logs**

7. **Refresh dashboard to see updated stats**

## 🐛 Common Issues

### Issue: "Email not found for tracking ID"
**Solution**: The tracking ID doesn't exist in database. Email might not have been saved properly.

### Issue: No logs in backend console
**Solution**: Tracking requests aren't reaching your backend. Check `BACKEND_URL` and network accessibility.

### Issue: Tracking pixel URL shows 404
**Solution**: Backend route might not be set up correctly or backend is not running.

### Issue: Dashboard not updating
**Solution**: 
- Refresh the page manually
- Check if tracking logs appear in backend console
- Verify email was opened with images enabled

## 📊 Verifying Tracking Works

### Test Open Tracking:
1. Send email to yourself
2. Open email in Gmail/Outlook
3. Check backend console for: `📧 Email open tracked`
4. Refresh dashboard - should show 1 open

### Test Click Tracking:
1. Send email with a link
2. Click the link in the email
3. Check backend console for: `🖱️ Email click tracked`
4. Should redirect to the original URL
5. Refresh dashboard - should show 1 click

## 💡 Pro Tips

1. **Use ngrok for development** - It's free and works perfectly for testing
2. **Check email source** - Always verify tracking URLs are correct
3. **Test with multiple email clients** - Different clients behave differently
4. **Enable images** - Tracking pixels require images to be loaded
5. **Use production URLs for real campaigns** - Deploy to Vercel for actual use

## 🚀 Production Setup

For production use:

1. **Deploy backend to Vercel**
2. **Set environment variables in Vercel**:
   ```
   BACKEND_URL=https://your-backend.vercel.app
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=strong-random-string
   NODE_ENV=production
   ```
3. **Deploy frontend to Vercel**
4. **Test thoroughly before sending to real recipients**

---

**Need Help?** Check the backend console logs - they'll tell you exactly what's happening with tracking requests!
