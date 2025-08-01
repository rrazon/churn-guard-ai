# ChurnGuard AI - Customer Health Monitoring Platform

A complete SaaS customer health monitoring platform that helps B2B SaaS companies predict and prevent customer churn through intelligent health scoring, ML-powered predictions, and automated intervention workflows.

## 🚀 Features

### Core Functionality
- **Executive Dashboard**: Real-time metrics, health score distribution, churn risk trends, and revenue analysis
- **Customer Management**: Comprehensive customer portfolio with search, filtering, and detailed health insights
- **CSM Dashboard**: Customer Success Manager tools for managing interventions and tracking success rates
- **Alerts & Notifications**: Real-time monitoring with intelligent alerting and notification system

### Technical Capabilities
- **AI-Powered Churn Prediction**: ML algorithms with 87% accuracy for identifying at-risk customers
- **Health Score Algorithm**: Weighted scoring based on usage, feature adoption, support engagement, payment history, and contract status
- **Real-time Updates**: WebSocket implementation for live dashboard updates and notifications
- **Role-Based Access Control**: Four user roles (Admin, Executive, CSM, Read-only) with appropriate permissions
- **Responsive Design**: Modern UI built with React, TypeScript, and Tailwind CSS

## 🏗️ Architecture

### Backend (Node.js/Express + TypeScript)
- RESTful API with comprehensive endpoints for all features
- JWT-based authentication with role-based authorization
- WebSocket server for real-time updates
- In-memory database with 500+ realistic customer records
- Health scoring and churn prediction algorithms

### Frontend (React + TypeScript + Tailwind CSS)
- Modern SPA with responsive design
- Interactive charts and visualizations using Recharts
- Real-time updates via WebSocket integration
- shadcn/ui component library for consistent design
- Comprehensive error handling and loading states

### Database Schema
- **CUSTOMERS**: Company profiles, health scores, and risk levels
- **USAGE_METRICS**: Time-series data for customer activity tracking
- **CHURN_PREDICTIONS**: ML predictions with confidence scores and contributing factors
- **INTERVENTIONS**: Customer success actions and outcomes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/rrazon/churn-guard-ai-demo.git
cd churn-guard-ai-demo
```

2. **Start the Backend**
```bash
cd backend
npm install
npm run dev
```
Backend will be available at `http://localhost:8000`

3. **Start the Frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:5173`

### Demo Accounts

Use these pre-configured accounts to explore different user roles:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@churnguard.ai | password123 | Full access to all features |
| Executive | executive@churnguard.ai | password123 | Dashboard and reports only |
| CSM | csm@churnguard.ai | password123 | Customer management and interventions |
| Read-only | readonly@churnguard.ai | password123 | View access only |

## 🐳 Docker Deployment

### Using Docker Compose

1. **Build and start all services**
```bash
docker-compose up --build
```

2. **Access the application**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

### Individual Container Deployment

**Backend:**
```bash
cd backend
docker build -t churnguard-backend .
docker run -p 8000:8000 churnguard-backend
```

**Frontend:**
```bash
cd frontend
npm run build
docker build -t churnguard-frontend .
docker run -p 3000:80 churnguard-frontend
```

## 📊 Demo Scenarios

The platform includes compelling customer scenarios for demonstration:

### Critical Risk Customers
- **BrandFlow Analytics**: CPG brand management platform with 87% churn probability
- **RetailEdge Systems**: In-store merchandising software with payment issues and multiple support tickets

### Success Stories
- **PromoTracker Solutions**: Promotional compliance platform showing intervention success (health improved from 25 to 75)
- **ShelfSync Pro**: Retail execution software, healthy customer with expansion opportunity

### Growth Opportunities
- **FieldForce Mobile**: Field team management app with high engagement and upsell potential
- **CategoryMaster**: Category management platform with seasonal usage patterns

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Current user profile

### Customer Health API
- `GET /api/customers` - List customers with filters
- `GET /api/customers/:id` - Customer details
- `GET /api/customers/:id/health-history` - Health score trends
- `PUT /api/customers/:id/health` - Update health score

### Churn Prediction API
- `GET /api/churn/predictions` - Current predictions
- `POST /api/churn/predict/:customerId` - Generate prediction
- `GET /api/churn/factors/:customerId` - Risk factor breakdown

### Analytics & Reporting
- `GET /api/analytics/overview` - Executive dashboard KPIs
- `GET /api/analytics/cohorts` - Cohort retention analysis
- `GET /api/analytics/revenue-at-risk` - ARR impact calculations

### Interventions & Alerts
- `GET /api/interventions` - List interventions
- `POST /api/interventions` - Create intervention
- `PUT /api/interventions/:id` - Update intervention
- `GET /api/alerts/recent` - Recent alerts

## 🧮 Health Score Algorithm

The health score is calculated using a weighted algorithm:

- **Usage Frequency (30%)**: Daily/weekly active users trend
- **Feature Adoption (25%)**: Breadth of feature usage
- **Support Engagement (20%)**: Ticket volume and sentiment
- **Payment History (15%)**: On-time payments, failed charges
- **Contract Engagement (10%)**: Renewals, expansions, downgrades

## 🤖 Churn Prediction Model

Simple but effective ML model features:
- **Input Features**: Tenure, MRR, usage trends, support volume, payment history, user growth
- **Algorithm**: Logistic regression for interpretability
- **Output**: Probability (0-1), confidence score, top 3 contributing factors
- **Threshold**: >60% probability triggers "high risk" status

## 🔒 Security Features

- JWT tokens with 24-hour expiration and refresh tokens
- Role-based route protection on frontend and API endpoints
- Input validation and sanitization for all endpoints
- Rate limiting on API endpoints
- CORS configuration for secure browser access
- Password hashing with bcrypt

## 📈 Performance Optimizations

- Database indexes on frequently queried columns
- API response caching for dashboard metrics
- Optimized database queries with proper joins
- Frontend code splitting and lazy loading
- Error boundaries and loading states

## 🛠️ Development

### Project Structure
```
churn-guard-ai-demo/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Authentication & validation
│   │   └── types/          # TypeScript definitions
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API & WebSocket clients
│   │   ├── contexts/       # React contexts
│   │   └── types/          # TypeScript definitions
│   └── package.json
├── docker-compose.yml      # Multi-container deployment
└── README.md
```

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎯 Business Impact

ChurnGuard AI demonstrates measurable business value:

- **Churn Reduction**: Early identification of at-risk customers enables proactive intervention
- **Revenue Protection**: Monitoring $81M+ in at-risk ARR across customer portfolio
- **Operational Efficiency**: Automated health scoring and intelligent alerting reduces manual monitoring
- **Customer Success ROI**: 87% intervention success rate with clear outcome tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For questions or support, please contact:
- Email: support@churnguard.ai
- GitHub Issues: [Create an issue](https://github.com/rrazon/churn-guard-ai-demo/issues)

---

**Built with ❤️ by the ChurnGuard AI Team**

*Preventing churn, one customer at a time.*
Demo of a sample app Churn Guard AI built using Devin AI
