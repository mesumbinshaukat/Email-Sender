# Database Seeding & API Testing Scripts

## Overview
This directory contains scripts to seed your MongoDB database with demo data and test all API endpoints.

## Prerequisites

1. **MongoDB Connection**: Ensure `MONGO_URI` is set in your `.env` file
2. **Server Running**: For API tests, the server should be running on `http://localhost:5000` (or set `API_URL` env variable)

## Scripts

### 1. Database Seeding (`seedDatabase.js`)

Seeds the database with demo data for user ID: `68def68a016de8f1bf0c189e`

**What it seeds:**
- ✅ 2 AI Providers (OpenRouter as default, OpenAI as secondary)
- ✅ 3 Campaigns (Active, Completed, Draft)
- ✅ 20 Emails with various statuses (sent, delivered, opened, clicked, bounced)

**Run:**
```bash
npm run seed
```

**Output:**
```
🌱 Starting database seeding...
✅ Connected to MongoDB Atlas
✅ User found: demo@example.com
🗑️  Cleaning existing data...
✅ Existing data cleaned
🤖 Seeding AI Providers...
✅ Seeded 2 AI providers
📧 Seeding Campaigns...
✅ Seeded 3 campaigns
✉️  Seeding Emails...
✅ Seeded 20 emails

📊 Seeding Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 User ID: 68def68a016de8f1bf0c189e
🤖 AI Providers: 2
📧 Campaigns: 3
✉️  Emails: 20
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Database seeding completed successfully!
```

### 2. API Testing (`testAPIs.js`)

Tests all API endpoints to verify they're properly registered and responding.

**What it tests:**
- ✅ Health Check endpoints (3 tests)
- ✅ Email endpoints (5 tests)
- ✅ Warmup endpoints (4 tests)
- ✅ Voice endpoints (2 tests)
- ✅ AI Provider endpoints (3 tests)
- ✅ Advanced Feature endpoints (8 tests)
- ✅ Tracking endpoints (2 tests)
- ✅ Environment endpoints (2 tests)

**Total: 29+ endpoint tests**

**Run:**
```bash
# Make sure server is running first
npm start

# In another terminal
npm run test:api
```

**Output:**
```
╔════════════════════════════════════════════════════╗
║     Email Tracker API Test Suite                  ║
╚════════════════════════════════════════════════════╝

🧪 API Testing Suite

Base URL: http://localhost:5000
User ID: 68def68a016de8f1bf0c189e

==================================================
1. Health Check Endpoints
==================================================
✅ GET /api/health - Status: 200
✅ GET /api/health/test-endpoints - Status: 200
✅ GET /api/health/system - Status: 200

==================================================
2. Email Endpoints (Testing Route Registration)
==================================================
ℹ️  Route exists (401 = needs auth, which is correct)
ℹ️  Route exists (401 = needs auth, which is correct)

... (more tests)

==================================================
Test Results Summary
==================================================

Total Tests: 29
✅ Passed: 29
❌ Failed: 0
⏭️  Skipped: 0

📊 Success Rate: 100.00%

🎉 All tests passed! All routes are properly registered.

Note: 401 errors are expected for protected routes without authentication.
This confirms the routes exist and authentication is working correctly.
```

## Usage Flow

### Complete Testing Flow:

```bash
# 1. Ensure MongoDB URI is set in .env
echo $MONGO_URI  # or check .env file

# 2. Seed the database
npm run seed

# 3. Start the server
npm start

# 4. In another terminal, run API tests
npm run test:api
```

## Environment Variables Required

```env
# Required for seeding
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Optional for API testing (defaults to http://localhost:5000)
API_URL=http://localhost:5000
PORT=5000
```

## Seeded Data Details

### AI Providers
1. **OpenRouter** (Default)
   - Provider: `openrouter`
   - Model: `openai/gpt-3.5-turbo`
   - Status: Active
   - Usage: 150 requests, 45,000 tokens

2. **OpenAI GPT-4**
   - Provider: `openai`
   - Model: `gpt-4`
   - Status: Active
   - Usage: 75 requests, 30,000 tokens

### Campaigns
1. **Welcome Series 2024**
   - Status: Active
   - Recipients: 3
   - Stats: 150 sent, 98 opened, 45 clicked

2. **Product Launch Announcement**
   - Status: Completed
   - Recipients: 2
   - Stats: 500 sent, 320 opened, 156 clicked

3. **Monthly Newsletter - January**
   - Status: Draft
   - Recipients: 0
   - Stats: All zeros

### Emails
- 20 emails with random:
  - Recipients (5 different email addresses)
  - Statuses (sent, delivered, opened, clicked, bounced)
  - Dates (spread over last 30 days)
  - Open/click counts
  - Linked to campaigns

## Troubleshooting

### Seeding Issues

**Error: `MongooseError: The 'uri' parameter to 'openUri()' must be a string`**
- Solution: Set `MONGO_URI` in your `.env` file

**Error: `User not found`**
- Solution: The script will create a demo user automatically

**Error: `E11000 duplicate key error`**
- Solution: The script cleans existing data before seeding

### API Testing Issues

**Error: `ECONNREFUSED`**
- Solution: Make sure the server is running (`npm start`)

**All tests return 404**
- Solution: Check if routes are properly registered in `server.js`

**All tests return 401**
- This is EXPECTED for protected routes without authentication
- It confirms routes exist and auth middleware is working

## Manual Testing with cURL

After seeding, you can test endpoints manually:

```bash
# Health check
curl http://localhost:5000/api/health

# Test endpoints list
curl http://localhost:5000/api/health/test-endpoints

# System info
curl http://localhost:5000/api/health/system
```

## Notes

- The seeding script is **idempotent** - you can run it multiple times safely
- It cleans existing data for the user before seeding
- All seeded data uses the user ID: `68def68a016de8f1bf0c189e`
- API tests expect 401 errors for protected routes (this is correct behavior)
- Tests verify route registration, not full functionality (auth required for that)

## Next Steps

After successful seeding and testing:

1. ✅ Deploy backend to production
2. ✅ Update frontend to use production API URL
3. ✅ Test dashboard data fetching
4. ✅ Verify all features work with seeded data
