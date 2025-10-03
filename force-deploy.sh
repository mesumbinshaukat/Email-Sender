#!/bin/bash

# Force Vercel Deployment with Cache Clear
# This script forces a fresh deployment without using cached builds

echo "🚀 Force deploying to Vercel..."
echo ""

# Navigate to backend
cd backend

echo "📦 Deploying backend with --force flag..."
vercel --prod --force

echo ""
echo "✅ Deployment triggered!"
echo ""
echo "⏳ Please wait 1-2 minutes for deployment to complete"
echo "📊 Check status at: https://vercel.com/dashboard"
echo ""
echo "🔍 After deployment, verify the fix:"
echo "   - No more 'email_scheduling is not a valid enum' errors"
echo "   - Scheduler endpoints should work correctly"
