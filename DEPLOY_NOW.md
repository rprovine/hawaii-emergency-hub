# 🚀 Deploy Hawaii Emergency Hub - Quick Guide

Your app is ready to deploy! Frontend is already live on Vercel.

## Backend Deployment Options:

### Option 1: Deploy on Render (Recommended - FREE)
1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect GitHub and select: `rprovine/hawaii-emergency-hub`
4. Configure:
   - **Name**: hawaii-emergency-backend
   - **Root Directory**: backend
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `./start.sh`
5. Add Environment Variables:
   ```
   ENVIRONMENT=production
   SECRET_KEY=<click-generate>
   JWT_SECRET=<click-generate>
   DATABASE_URL=<will-be-auto-added-if-using-render-postgres>
   CORS_ORIGINS=https://web-dashboard-bg4hntyxe-rprovines-projects.vercel.app
   ```
6. Click "Create Web Service"

### Option 2: Deploy on Railway
1. Go to https://railway.app/
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `rprovine/hawaii-emergency-hub`
4. Railway will auto-detect the configuration

### Option 3: Deploy on Heroku
1. Install Heroku CLI
2. Run:
   ```bash
   cd backend
   heroku create hawaii-emergency-backend
   heroku addons:create heroku-postgresql:mini
   git push heroku main
   ```

## After Backend Deployment:

1. Get your backend URL (e.g., `https://hawaii-emergency-backend.onrender.com`)

2. Update Vercel frontend:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter: https://your-backend-url.onrender.com/api/v1
   vercel --prod
   ```

## URLs:
- **Frontend (Live)**: https://web-dashboard-bg4hntyxe-rprovines-projects.vercel.app
- **Backend (After Deploy)**: Your chosen service URL
- **API Docs**: `<backend-url>/docs`

## Test Credentials:
- Email: test@example.com
- Password: testpass123

That's it! Your emergency hub will be fully operational in minutes.