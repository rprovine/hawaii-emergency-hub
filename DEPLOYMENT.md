# Hawaii Emergency Hub - Deployment Guide

## Current Deployments

- **Production Frontend**: https://web-dashboard-37ivqmhvf-rprovines-projects.vercel.app
- **Production Backend**: https://hawaii-emergency-hub.onrender.com
- **API Documentation**: https://hawaii-emergency-hub.onrender.com/docs

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- Vercel CLI installed (`npm i -g vercel`)
- GitHub repository access

### Environment Variables Required
```env
NEXT_PUBLIC_API_URL=https://hawaii-emergency-hub.onrender.com/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoicnByb3ZpbmUiLCJhIjoiY21kbnc4azRhMDdhMDJvcG14bWpuaXJkMCJ9.Sdw1pflgbSYxtBwsXAJ5HQ
```

### Deployment Steps

1. **Initial Setup**
```bash
cd web-dashboard
vercel
# Follow prompts to link project
```

2. **Production Deployment**
```bash
vercel --prod
```

3. **Environment Variables (via Vercel Dashboard)**
- Go to Project Settings > Environment Variables
- Add the variables listed above
- Redeploy for changes to take effect

### Build Settings
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## Backend Deployment (Render)

### Prerequisites
- Render account
- GitHub repository connected

### Environment Variables Required
```env
DATABASE_URL=sqlite:///./hawaii_emergency.db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=["https://web-dashboard-37ivqmhvf-rprovines-projects.vercel.app","http://localhost:3000"]
ENVIRONMENT=production
PORT=10000
```

### Deployment Configuration

1. **Service Type**: Web Service
2. **Runtime**: Python 3
3. **Build Command**: 
```bash
pip install -r requirements.txt
```
4. **Start Command**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Health Check
- Path: `/health`
- Expected Response: 200 OK

## Database Setup

### SQLite (Default)
- Automatically created on first run
- Location: `./hawaii_emergency.db`
- No additional setup required

### PostgreSQL (Production Ready)
1. Update DATABASE_URL in environment variables
2. Format: `postgresql://user:password@host:port/database`
3. Run migrations (if using Alembic):
```bash
alembic upgrade head
```

## Monitoring & Logs

### Frontend (Vercel)
- Functions tab for API route logs
- Analytics tab for traffic metrics
- Runtime logs in Vercel dashboard

### Backend (Render)
- Live logs in Render dashboard
- Metrics tab for performance monitoring
- Shell tab for debugging

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure frontend URL is in CORS_ORIGINS
   - Check API_URL in frontend env vars

2. **Database Connection Failed**
   - Backend falls back to SQLite automatically
   - Check DATABASE_URL format if using PostgreSQL

3. **Map Not Loading**
   - Verify Mapbox token is valid
   - Check browser console for errors

4. **API Connection Issues**
   - Verify NEXT_PUBLIC_API_URL is correct
   - Check backend health endpoint
   - Ensure backend is running

### Debug Commands

**Frontend**
```bash
# Check build locally
npm run build
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

**Backend**
```bash
# Test locally
uvicorn app.main:app --reload

# Check database connection
python -c "from app.core.database import engine; print(engine.url)"

# Run tests
pytest
```

## Rollback Procedures

### Vercel
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." menu > "Promote to Production"

### Render
1. Go to Events tab
2. Find previous deploy
3. Click "Rollback to this deploy"

## Performance Optimization

### Frontend
- Image optimization with Next.js Image component
- Code splitting automatic with Next.js
- Static generation where possible
- API route caching

### Backend
- Connection pooling for database
- Response caching for static data
- Rate limiting on endpoints
- Async request handling

## Security Checklist

- [ ] Environment variables properly set
- [ ] CORS origins restricted
- [ ] Secret key is strong and unique
- [ ] HTTPS enforced on all endpoints
- [ ] API rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (using ORM)
- [ ] XSS protection headers set

## Scaling Considerations

### Frontend (Vercel)
- Automatic scaling with Vercel
- Edge functions for global distribution
- CDN for static assets

### Backend (Render)
- Upgrade to paid plan for:
  - More RAM/CPU
  - Zero downtime deploys
  - Horizontal scaling
  - Custom domains

### Database
- Consider PostgreSQL for production
- Implement caching layer (Redis)
- Database backups scheduled
- Read replicas for scaling

## Maintenance Windows

Recommended maintenance schedule:
- Backend updates: Tuesday 2-4 AM HST
- Frontend updates: Can be done anytime (zero downtime)
- Database maintenance: Sunday 3-5 AM HST

## Contact & Support

- GitHub Issues: https://github.com/rprovine/hawaii-emergency-hub/issues
- Backend Logs: Render Dashboard
- Frontend Logs: Vercel Dashboard
- API Status: https://hawaii-emergency-hub.onrender.com/health