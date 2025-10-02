# 🚀 Quick Fix: Use localtunnel Instead of ngrok

## The Problem with ngrok Free Tier

ngrok's free tier shows a warning page that breaks email tracking.
**localtunnel** is a free alternative with NO warning pages!

---

## ⚡ 3-Minute Setup

### Step 1: Install localtunnel

```bash
npm install -g localtunnel
```

### Step 2: Start localtunnel

```bash
lt --port 5000
```

You'll see something like:
```
your url is: https://funny-cat-12.loca.lt
```

**IMPORTANT**: The first time you visit a localtunnel URL in a browser, it will ask you to enter a tunnel password. This is a one-time thing for browsers, but **email clients don't see this page** - they load images directly!

### Step 3: Test the URL

Visit the URL in your browser: `https://funny-cat-12.loca.lt`

If it asks for a password:
- Click "Click to Continue"
- Or enter the IP shown

**This only happens in browsers, NOT in email clients!**

### Step 4: Update backend/.env

```env
BACKEND_URL=https://funny-cat-12.loca.lt
```

(Use YOUR localtunnel URL, not this example)

### Step 5: Restart Backend

```bash
cd backend
# Stop with Ctrl+C
npm run dev
```

### Step 6: Send Test Email

1. Go to dashboard
2. Send a new email
3. Check backend console - should show:
   ```
   🔗 Backend URL for tracking: https://funny-cat-12.loca.lt
   ```

### Step 7: Open Email

Open the email on any device/client and check backend logs!

---

## 🎯 Alternative: Use Subdomain

For a cleaner URL:

```bash
lt --port 5000 --subdomain myemailtracker
```

This gives you: `https://myemailtracker.loca.lt`

**Note**: Subdomains might be taken, try different names.

---

## ✅ Verify It's Working

### Test the tracking pixel:

```bash
# Visit in browser:
https://your-subdomain.loca.lt/api/track/open/test123
```

Should download a tiny GIF image (not show a warning page).

---

## 📊 Comparison

| Feature | ngrok Free | localtunnel | Vercel |
|---------|-----------|-------------|--------|
| Warning Page | ❌ Yes | ✅ No | ✅ No |
| Cost | Free | Free | Free |
| URL Changes | Yes | Yes | No |
| Best For | Quick tests | Development | Production |

---

## 🚨 Important Notes

- **localtunnel URL changes** each time you restart (unless using --subdomain)
- **Update BACKEND_URL** in .env if URL changes
- **Restart backend** after changing .env
- **Send new emails** to test (old emails have old URLs)

---

## 🎉 That's It!

localtunnel should work perfectly for email tracking without any warning pages!

If you still have issues, the problem might be:
1. Email client blocking external images
2. HTML not being sent in email
3. Backend not restarted after .env change

Check backend console logs for debugging info!
