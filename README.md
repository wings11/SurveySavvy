# Survey Savvy

Professional survey platform with World ID verification, treasury-funded rewards system, and marks-based economy.

## 🌟 Features

- **🔐 World ID Authentication** - Secure OAuth-based login with unlimited verifications
- **📊 Survey Creation & Management** - Complete survey lifecycle with blockchain verification
- **💰 Treasury-Funded Rewards** - Automated withdrawals (500 marks = 5 WLD minus platform fees)
- **🛒 Integrated Shop System** - Purchase marks and points directly in-app
- **📱 Mobile-Responsive Design** - Professional UI with 5-tab navigation
- **🏆 User Ranking System** - Leaderboards and achievement tracking
- **🔒 Security-First** - Comprehensive input validation and rate limiting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- World ID Developer Account

### Installation

\\\ash
# Clone the repository
git clone https://github.com/wings11/SurveySavvy.git
cd SurveySavvy

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Configure your .env file with the required credentials

# Run the development server
pnpm dev
\\\

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration

### Required Environment Variables

\\\nv
# World ID Configuration
APP_ID=your_app_id
WLD_CLIENT_ID=your_client_id
WLD_CLIENT_SECRET=your_client_secret
DEV_PORTAL_API_KEY=your_api_key

# NextAuth Configuration
NEXTAUTH_URL=your_app_url
NEXTAUTH_SECRET=your_secret_key

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Treasury Wallet (Keep Private!)
TREASURY_PRIVATE_KEY=your_private_key
\\\

### World ID Setup

1. **Create World ID App**
   - Visit [World ID Developer Portal](https://developer.worldcoin.org/)
   - Create a new app to get your \APP_ID\
   - Get \DEV_PORTAL_API_KEY\ from API Keys section
   - Configure \
Sign
in
with
World
ID\ for \WLD_CLIENT_ID\ and \WLD_CLIENT_SECRET\

2. **Configure Actions**
   - Create action: \surveyformverification\ (for survey verification)
   - Create action: \getwalletaddress\ (for wallet address capture)

3. **Database Setup**
   - Create PostgreSQL database
   - Run database migrations (tables will be created automatically on first run)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.5.2, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL
- **Authentication**: NextAuth.js with World ID OAuth
- **Blockchain**: Ethereum (Worldcoin network)

### Key Components
- **Survey System**: Create, verify, and complete surveys
- **Marks Economy**: 500 mark minimum withdrawal, 500 mark maximum cap
- **Treasury System**: Automated WLD distribution from treasury wallet
- **Shop Integration**: Purchase marks and points
- **Admin Panel**: Survey management and user administration

## 💡 How It Works

1. **User Authentication**: Users sign in with World ID for secure verification
2. **Survey Creation**: Verified users can create surveys with customizable questions
3. **Survey Completion**: Users complete surveys and earn marks based on quality
4. **Rewards System**: 500 marks = 5 WLD (minus platform fees) automatically withdrawn
5. **Shop System**: Users can purchase additional marks and points
6. **Ranking**: Users compete on leaderboards based on survey activity

## 🔒 Security Features

- Environment variable protection
- Input sanitization and validation
- Rate limiting on sensitive endpoints
- Secure JWT token management
- Treasury wallet isolation
- Comprehensive error handling

## 📚 API Endpoints

### Authentication
- \POST /api/auth/signin\ - World ID OAuth login
- \POST /api/auth/signout\ - User logout

### Surveys
- \GET /api/surveys\ - List all surveys
- \POST /api/surveys/create\ - Create new survey
- \POST /api/surveys/complete\ - Submit survey responses
- \POST /api/surveys/verify\ - Verify survey with World ID

### Marks & Rewards
- \GET /api/marks/balance\ - Get user marks balance
- \POST /api/marks/withdraw\ - Process withdrawal request
- \GET /api/marks/history\ - Transaction history

### Shop
- \POST /api/shop/purchase-marks\ - Purchase marks
- \POST /api/shop/purchase-points\ - Purchase points

## 🛠️ Development

### Running Locally

\\\ash
# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
\\\

### Contributing

1. Fork the repository
2. Create feature branch (\git checkout -b feature/amazing-feature\)
3. Commit changes (\git commit -m 'Add amazing feature'\)
4. Push to branch (\git push origin feature/amazing-feature\)
5. Open Pull Request


## 🔗 Links

- [World ID Docs](https://docs.world.org/)
- [Developer Portal](https://developer.worldcoin.org/)
- [Security Guidelines](./SECURITY.md)
- [Live Demo](https://survey-savvy.vercel.app/)

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact: [wykyaw2001@gmail.com]

---

Built by Wai Yan Kyaw using World ID and Next.js
