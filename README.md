# 🚨 Hawaii Emergency Hub

<div align="center">
  <p align="center">
    <strong>A comprehensive real-time emergency management platform for Hawaii residents</strong>
  </p>
  
  <p align="center">
    <a href="https://web-dashboard-37ivqmhvf-rprovines-projects.vercel.app">Live Demo</a> •
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#api-documentation">API Docs</a>
  </p>
  
  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  </p>
</div>

## 🌐 Live Deployment

- **Production Site**: [https://web-dashboard-37ivqmhvf-rprovines-projects.vercel.app](https://web-dashboard-37ivqmhvf-rprovines-projects.vercel.app)
- **Backend API**: [https://hawaii-emergency-hub.onrender.com](https://hawaii-emergency-hub.onrender.com)
- **API Documentation**: [https://hawaii-emergency-hub.onrender.com/docs](https://hawaii-emergency-hub.onrender.com/docs)

## 🎯 Overview

The Hawaii Emergency Hub provides instant alerts for natural disasters, crime incidents, and safety information to protect Hawaii's residents and visitors. With real-time data integration from official government sources and an intuitive interface, users stay informed about tsunamis, hurricanes, volcanic activity, earthquakes, and more.

### Key Features
- **Multi-Hazard Monitoring**: Comprehensive coverage of all emergency types
- **Real-Time Updates**: Sub-minute alert delivery from official sources
- **Interactive Mapping**: Visual tracking with Mapbox integration
- **Crime Tracking**: Local incident reports and safety scores
- **Family Safety**: Check-in system during emergencies
- **Offline Capabilities**: Critical information cached locally

## ✨ Features

### 🚨 Emergency Monitoring
- **Natural Disasters**: Tsunamis, hurricanes, volcanic activity, earthquakes, floods
- **Weather Alerts**: Severe storms, high winds, flash floods, high surf
- **Crime Incidents**: Real-time tracking with location mapping
- **Ocean Conditions**: Surf heights, tide charts, marine hazards
- **Traffic Cameras**: Live DOT camera feeds

### 🗺️ Interactive Dashboard
- **Landing Page**: Professional overview of features and capabilities
- **Alert Map**: Real-time visualization of all active emergencies
- **Overview Tab**: Key metrics and system status at a glance
- **Weather Tab**: Detailed forecasts and marine conditions
- **Crime Tab**: Local incidents with severity indicators
- **Family Safety**: Emergency contact management
- **Evacuation Routes**: Pre-planned routes by district
- **Emergency Resources**: Shelter locations and supplies checklist

### 📊 Data Integration
Real-time integration with official sources:
- National Weather Service (NWS)
- USGS Earthquake Monitoring
- Hawaii Volcano Observatory (HVO)
- Pacific Tsunami Warning Center (PTWC)
- Honolulu Police Department
- Hawaii Department of Transportation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/rprovine/hawaii-emergency-hub.git
cd hawaii-emergency-hub
```

2. **Setup Frontend**
```bash
cd web-dashboard
npm install
cp .env.example .env.local
# Edit .env.local with your Mapbox token
npm run dev
```

3. **Setup Backend**
```bash
cd ../backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
uvicorn app.main:app --reload
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: Shadcn/ui + Tailwind CSS
- **Mapping**: Mapbox GL JS
- **Charts**: Recharts
- **Deployment**: Vercel

#### Backend
- **Framework**: FastAPI
- **Language**: Python 3.10+
- **Database**: SQLite (PostgreSQL ready)
- **Authentication**: JWT tokens
- **Deployment**: Render

### Project Structure
```
hawaii-emergency-hub/
├── web-dashboard/              # Next.js frontend application
│   ├── src/
│   │   ├── app/               # App router pages
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   └── api/           # API routes
│   │   ├── components/        # React components
│   │   │   ├── alerts/        # Alert components
│   │   │   ├── maps/          # Map components
│   │   │   ├── crime/         # Crime tracking
│   │   │   ├── weather/       # Weather widgets
│   │   │   └── ui/            # UI components
│   │   └── lib/               # Utilities and helpers
│   ├── public/                # Static assets
│   └── package.json
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   ├── alerts.py
│   │   │   ├── weather.py
│   │   │   ├── crime.py
│   │   │   └── auth.py
│   │   ├── core/              # Core functionality
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   └── main.py            # Application entry
│   └── requirements.txt
└── docs/                       # Documentation
```

## 🚢 Deployment

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
cd web-dashboard
vercel --prod
```

3. **Environment Variables**
Set in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

### Backend Deployment (Render)

1. **Connect GitHub repository**
2. **Configure build settings**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Set environment variables**:
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `CORS_ORIGINS`

## 📊 API Documentation

### Base URL
```
Production: https://hawaii-emergency-hub.onrender.com/api/v1
Development: http://localhost:8000/api/v1
```

### Key Endpoints

#### Alerts
```http
GET /alerts              # Get active alerts
GET /alerts/nearby       # Get alerts near location
GET /alerts/statistics   # Alert statistics
```

#### Weather
```http
GET /weather/current     # Current conditions
GET /weather/forecast    # 7-day forecast
GET /weather/marine      # Marine conditions
```

#### Crime
```http
GET /crime/incidents     # Recent incidents
GET /crime/statistics    # Crime statistics
GET /crime/safety-score  # Location safety score
```

#### Emergency Resources
```http
GET /shelters           # Emergency shelters
GET /evacuation/routes  # Evacuation routes
GET /emergency/contacts # Emergency contacts
```

Full interactive API documentation: [https://hawaii-emergency-hub.onrender.com/docs](https://hawaii-emergency-hub.onrender.com/docs)

## 🔧 Development

### Frontend Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Run production build
npm run lint       # Run linter
npm run type-check # TypeScript checking
```

### Backend Commands
```bash
uvicorn app.main:app --reload  # Development server
pytest                          # Run tests
alembic upgrade head           # Run migrations
```

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

#### Backend (.env)
```env
DATABASE_URL=sqlite:///./hawaii_emergency.db
SECRET_KEY=your-secret-key
CORS_ORIGINS=["http://localhost:3000"]
ENVIRONMENT=development
```

## 🔒 Security

- JWT-based authentication
- CORS protection
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure WebSocket connections
- Environment variable management

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📱 Roadmap

- [ ] Native mobile apps (iOS/Android)
- [ ] SMS alert system
- [ ] Multi-language support
- [ ] AI-powered threat assessment
- [ ] Community reporting features
- [ ] Offline map downloads
- [ ] WebSocket real-time updates
- [ ] PWA enhancements

## 🐛 Known Issues

- Crime data currently uses mock data (HPD integration pending)
- Some weather stations may be temporarily offline
- Camera feeds dependent on DOT availability

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- National Weather Service Hawaii
- USGS Hawaiian Volcano Observatory
- Pacific Tsunami Warning Center
- Honolulu Police Department
- Hawaii Department of Transportation
- Hawaii Emergency Management Agency

## 🚨 Emergency Contacts

**Life-Threatening Emergency**: 911  
**Tsunami Warning Center**: 1-808-725-6382  
**Red Cross Hawaii**: 1-808-734-2101  
**Hawaii Emergency Management**: 1-808-733-4300  

---

Built with ❤️ for Hawaii's safety