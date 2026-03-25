# 🏌️ Golf Charity Backend - Comprehensive Documentation

A production-ready Express.js backend for a golf-tournament fundraising platform. This backend manages user authentication, charity fundraising, golf draws, scoring, and subscription payments integrated with Stripe.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Installation & Setup](#installation--setup)
5. [Environment Configuration](#environment-configuration)
6. [Database Models](#database-models)
7. [API Routes & Endpoints](#api-routes--endpoints)
8. [Authentication & Authorization](#authentication--authorization)
9. [Key Features](#key-features)
10. [Project Structure](#project-structure)
11. [Running & Development](#running--development)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

The Golf Charity Backend is a RESTful API service that powers the frontend application for:
- **User Management**: Registration, login, profile updates, password changes
- **Authentication**: JWT-based token authentication with role-based access control
- **Charity Management**: Browse, select, and support multiple charities
- **Golf Draws**: Management of tournament draws with participant tracking
- **Scoring System**: Track golf scores for participants, store historical scores
- **Subscription Management**: Stripe integration for monthly/yearly payment plans
- **Admin Dashboard**: Administrative controls for users, charities, draws, and winners
- **Email Notifications**: Automated emails via Nodemailer for important events

### Key Concepts
- **Subscribers**: Users with active subscriptions who can participate in draws
- **Charities**: Organizations that benefit from subscription revenue
- **Draws**: Tournament rounds where subscribers compete for prizes
- **Scores**: Individual golf scores tracked per subscriber
- **Social Impact**: A percentage of subscription revenue goes to selected charities

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 22.13.1 | JavaScript runtime |
| **Framework** | Express.js | 4.18.2 | HTTP server & routing |
| **Database** | MongoDB | Latest (Mongoose 8.0.3) | Document-based data storage |
| **Authentication** | JWT | 9.0.2 | Stateless authentication tokens |
| **Encryption** | bcryptjs | 2.4.3 | Password hashing & security |
| **Payment** | Stripe | 14.9.0 | Subscription & payment processing |
| **Email** | Nodemailer | 8.0.4 | Email sending service |
| **Security** | Helmet | 7.1.0 | HTTP headers security |
| **Rate Limiting** | express-rate-limit | 7.1.5 | API request throttling |
| **CORS** | cors | 2.8.5 | Cross-origin resource sharing |
| **Logging** | Morgan | 1.10.0 | HTTP request logging |
| **File Upload** | Multer | 1.4.5-lts.1 | Multipart form data handling |
| **Validation** | express-validator | 7.0.1 | Request data validation |
| **Dev Tool** | Nodemon | 3.0.2 | Auto-restart on file changes |

---

## 🏗️ Architecture

### Request Flow

```
Client Request
    ↓
Express Middleware (CORS, Security, Logging)
    ↓
Rate Limiter
    ↓
Route Handler
    ↓
Authentication Middleware (JWT verify)
    ↓
Authorization Middleware (Role/Subscription check)
    ↓
Controller Logic → Model Operations → MongoDB
    ↓
Response
```

### Layer Breakdown

**Server Layer** (`server.js`)
- Initializes Express application
- Configures middleware (CORS, helmet, morgan, rate-limiting)
- Connects to MongoDB
- Registers API routes
- Error handling & health check endpoint

**Route Layer** (`routes/`)
- Defines API endpoints and HTTP methods
- Maps routes to controllers
- Applies route-specific middleware

**Controller Layer** (`controllers/`)
- Business logic implementation
- Request validation & data transformation
- Model interaction
- Response formatting

**Model Layer** (`models/`)
- MongoDB schema definitions
- Data validation rules
- Database indexes
- Pre/post hooks for data consistency

**Middleware Layer** (`middleware/`)
- JWT authentication & token verification
- Role-based access control (RBAC)
- Request validation

**Utility Layer** (`utils/`)
- Helper functions
- Database seeding script

**Configuration Layer** (`config/`)
- Environment-specific settings
- MongoDB connection

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js** 18.x or higher (22.13.1 recommended)
- **npm** 9.x or higher
- **MongoDB Atlas** account (cloud) or MongoDB local instance
- **Stripe Account** for payment processing
- **Git** for version control

### Quick Start

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd golf-charity/backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create Environment File**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Connect to MongoDB**
   - Create a MongoDB Atlas cluster
   - Update `MONGO_URI` in `.env`
   - Ensure IP whitelist includes your machine (or use 0.0.0.0/0)

5. **Configure Stripe**
   - Create Stripe account at stripe.com
   - Find your API keys in Dashboard → Developers → API Keys
   - Update `STRIPE_SECRET_KEY` in `.env`

6. **Seed Database** (Optional)
   ```bash
   npm run seed
   ```
   Populates MongoDB with test data:
   - Admin user: `admin@golfcharity.com` / `Admin@123456`
   - Test subscriber: `test@golfcharity.com` / `Test@123456`
   - 5 sample charities
   - 10 sample draws

7. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:5000`

---

## 🔐 Environment Configuration

### `.env` File Structure

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/golf-charity

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_password_not_regular_password

# Frontend URL (for CORS & redirects)
CLIENT_URL=http://localhost:3000

# Server Environment
NODE_ENV=development
PORT=5000
```

### Environment Best Practices

- **Never commit `.env`** to version control (use `.env.example` template)
- **Use `.env.example`** as a template for developers
- **Generate strong JWT_SECRET**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Use Gmail App Password**, not regular password
- **Rotate secrets** regularly in production
- **Use environment variables** on Render, Vercel, or other platforms

---

## 📊 Database Models

### User Model

**Purpose**: Stores user account information, authentication credentials, subscription status, and golf statistics.

**Schema**:
```javascript
{
  // Personal Information
  name: String,           // Full name
  email: String,          // Unique email, used for login
  password: String,       // Hashed with bcryptjs
  role: String,           // 'subscriber' or 'admin'
  avatar: String,         // Profile picture URL

  // Subscription Status
  subscription: {
    status: String,           // 'active', 'inactive', 'cancelled', 'lapsed'
    plan: String,             // 'monthly' or 'yearly'
    stripeCustomerId: String, // Stripe customer identifier
    stripeSubscriptionId: String, // Active subscription ID in Stripe
    currentPeriodStart: Date, // Billing period start
    currentPeriodEnd: Date,   // Billing period end
    cancelAtPeriodEnd: Boolean, // Flag for cancellation
  },

  // Golf Scores
  scores: [{
    score: Number,      // Score value (1-45)
    date: Date,         // When score was recorded
    addedAt: Date       // Timestamp when added to system
  }],

  // Charity Selection
  selectedCharity: ObjectId, // Reference to selected Charity
  charityPercentage: Number, // 10-100% of subscription goes to charity

  // Statistics
  totalWon: Number,      // Total prize money won
  drawsEntered: Number,  // Number of draws participated

  // Password Recovery
  passwordResetToken: String,
  passwordResetExpire: Date,

  // Metadata
  timestamps: true     // createdAt, updatedAt
}
```

**Key Features**:
- Password automatically hashed before saving via `bcryptjs`
- Email validation and lowercasing for consistency
- Unique constraint on email
- Password selected: false (not returned in queries by default)
- Score tracking with date history

### Charity Model

**Purpose**: Represents organizations that receive donations from subscription revenue.

**Schema**:
```javascript
{
  name: String,          // Charity name
  description: String,   // Mission & details
  image: String,         // Logo/image URL
  slug: String,          // URL-friendly identifier (unique)
  category: String,      // Type of charity
  impact: String,        // How money is used
  donationCount: Number, // Total subscribers supporting this charity
  totalDonations: Number // Total amount raised
}
```

**Key Features**:
- Slug used for URL routing and unique identification
- Track donor count and total funds raised
- Image URL for display on frontend

### Draw Model

**Purpose**: Represents golf tournament draws/competitions.

**Schema**:
```javascript
{
  name: String,          // Draw name/tournament name
  description: String,   // Rules and details
  scheduledDate: Date,   // When the draw occurs
  status: String,        // 'upcoming', 'active', 'completed'
  participants: [ObjectId], // Array of User references
  prizePool: Number,     // Total prize money
  rules: String,         // Draw rules & eligibility
  results: [{
    participant: ObjectId, // User reference
    result: String,       // 'won', 'participated'
    prizeWon: Number      // Amount won
  }]
}
```

**Key Features**:
- Tracks participant list
- Records results with prize amounts
- Status management (upcoming → active → completed)

### Score Model

**Purpose**: Individual golf score records (embedded in User model).

**Schema**:
```javascript
{
  score: Number,      // Score 1-45
  date: Date,         // When score was achieved
  addedAt: Date       // When added to system
}
```

### Model Relationships

```
User
├── scores[] (embedded)
├── selectedCharity (references Charity)
└── subscription (embedded)

Charity
└── referenced by User.selectedCharity

Draw
└── participants[] (references User)
    └── results[] (embedded)
```

---

## 🔌 API Routes & Endpoints

### Authentication Routes (`/api/auth`)

#### Register New User
- **Method**: `POST /api/auth/register`
- **Requires**: None (public)
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Validation**: Name not empty, valid email, password ≥6 characters
- **Response**: `{ success: true, token: "jwt_token", user: {...} }`

#### Login User
- **Method**: `POST /api/auth/login`
- **Requires**: None (public)
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response**: `{ success: true, token: "jwt_token", user: {...} }`

#### Get Current User Profile
- **Method**: `GET /api/auth/me`
- **Requires**: JWT token (Bearer header)
- **Response**: Current user object with full details

#### Update Profile
- **Method**: `PUT /api/auth/update-profile`
- **Requires**: JWT token
- **Body**: Any user fields to update (name, avatar, charityPercentage, etc.)
- **Response**: Updated user object

#### Change Password
- **Method**: `PUT /api/auth/change-password`
- **Requires**: JWT token
- **Body**:
  ```json
  {
    "currentPassword": "oldPassword",
    "newPassword": "newPassword123"
  }
  ```
- **Response**: Success message or error

### Charity Routes (`/api/charities`)

#### Get All Charities
- **Method**: `GET /api/charities`
- **Requires**: None (public)
- **Query**: `?limit=10&page=1`
- **Response**: Array of charity objects

#### Get Single Charity
- **Method**: `GET /api/charities/:id`
- **Requires**: None (public)
- **Response**: Single charity object with details

#### Create Charity (Admin Only)
- **Method**: `POST /api/charities`
- **Requires**: JWT token + admin role
- **Body**:
  ```json
  {
    "name": "Save the Whales",
    "description": "...",
    "slug": "save-the-whales",
    "category": "Environment",
    "image": "url_to_image"
  }
  ```
- **Response**: Created charity object

#### Update Charity (Admin Only)
- **Method**: `PUT /api/charities/:id`
- **Requires**: JWT token + admin role
- **Body**: Fields to update
- **Response**: Updated charity object

#### Delete Charity (Admin Only)
- **Method**: `DELETE /api/charities/:id`
- **Requires**: JWT token + admin role
- **Response**: Success message

### Draw Routes (`/api/draws`)

#### Get All Draws
- **Method**: `GET /api/draws`
- **Requires**: None (public)
- **Response**: Array of draws, optionally filtered by status

#### Get Single Draw
- **Method**: `GET /api/draws/:id`
- **Requires**: None (public)
- **Response**: Draw details with participants and results

#### Create Draw (Admin Only)
- **Method**: `POST /api/draws`
- **Requires**: JWT token + admin role
- **Body**:
  ```json
  {
    "name": "Spring Championship",
    "description": "Annual spring tournament",
    "scheduledDate": "2026-04-15",
    "prizePool": 5000,
    "rules": "..."
  }
  ```

#### Add Participant to Draw (Subscriber Only)
- **Method**: `POST /api/draws/:drawId/join`
- **Requires**: JWT token + active subscription
- **Response**: Success with updated draw

#### Update Draw Results (Admin Only)
- **Method**: `PUT /api/draws/:id/results`
- **Requires**: JWT token + admin role
- **Body**:
  ```json
  {
    "results": [{
      "participant": "userId",
      "result": "won",
      "prizeWon": 500
    }]
  }
  ```

### Scoring Routes (`/api/scores`)

#### Add Score (Subscriber Only)
- **Method**: `POST /api/scores`
- **Requires**: JWT token + active subscription
- **Body**:
  ```json
  {
    "score": 38,
    "date": "2026-03-20"
  }
  ```
- **Validation**: Score must be 1-45
- **Response**: Updated user with new score array

#### Get User Scores
- **Method**: `GET /api/scores`
- **Requires**: JWT token
- **Response**: Array of user's scores with dates

#### Get Leaderboard
- **Method**: `GET /api/scores/leaderboard`
- **Requires**: None (public)
- **Response**: Top scoring users ranked

### Subscription Routes (`/api/subscription`)

#### Create Subscription
- **Method**: `POST /api/subscription/create-checkout-session`
- **Requires**: JWT token
- **Body**:
  ```json
  {
    "priceId": "price_xxx",
    "planType": "monthly" or "yearly"
  }
  ```
- **Response**: Stripe checkout session URL

#### Get Subscription Status
- **Method**: `GET /api/subscription/status`
- **Requires**: JWT token
- **Response**: Current subscription details

#### Cancel Subscription
- **Method**: `POST /api/subscription/cancel`
- **Requires**: JWT token + active subscription
- **Response**: Cancellation confirmation

#### Stripe Webhook
- **Method**: `POST /api/subscription/webhook`
- **Requires**: Stripe signature in headers
- **Purpose**: Handle Stripe events (payment success, renewal, cancellation)
- **Webhook Events Handled**:
  - `customer.subscription.updated` - Update subscription status
  - `customer.subscription.deleted` - Mark subscription as cancelled
  - `charge.failed` - Handle failed payments

### Admin Routes (`/api/admin`)

#### Get All Users
- **Method**: `GET /api/admin/users`
- **Requires**: JWT token + admin role
- **Query**: `?role=subscriber&subscription=active`
- **Response**: Array of all users with filters

#### Get Dashboard Stats
- **Method**: `GET /api/admin/stats`
- **Requires**: JWT token + admin role
- **Response**:
  ```json
  {
    "totalUsers": 150,
    "activeSubscribers": 85,
    "totalRevenue": 5000,
    "charities": 5,
    "upcomingDraws": 3
  }
  ```

#### View User Details (Admin Only)
- **Method**: `GET /api/admin/users/:userId`
- **Requires**: JWT token + admin role
- **Response**: Full user profile with subscription details

#### Update User Role (Admin Only)
- **Method**: `PUT /api/admin/users/:userId/role`
- **Requires**: JWT token + admin role
- **Body**: `{ "role": "admin" or "subscriber" }`
- **Response**: Updated user

#### View Winners
- **Method**: `GET /api/admin/winners`
- **Requires**: JWT token + admin role
- **Response**: All draw winners and prizes awarded

---

## 🔐 Authentication & Authorization

### JWT Token Flow

1. **Login/Register**
   - User provides email and password
   - Backend validates credentials
   - `bcryptjs` compares hashed password
   - JWT token generated containing user ID

2. **Token Structure**
   ```javascript
   // Payload
   { 
     id: "userId",
     iat: 1234567890,     // issued at
     exp: 1234567890 + 7d // expiry in 7 days
   }
   ```

3. **Token Storage (Frontend)**
   - Stored in browser localStorage
   - Automatically attached to all API requests
   - Format: `Authorization: Bearer <token>`

4. **Token Verification (Backend)**
   - `middleware/auth.js` intercepts requests
   - Extracts token from Authorization header
   - Verifies signature using JWT_SECRET
   - Prevents token tampering/forgery

### Role-Based Access Control (RBAC)

**Admin Role**
- Create/update/delete charities
- Manage all draws
- Update draw results
- View all users and admin stats
- Modify user roles

**Subscriber Role**
- Add golf scores
- Join draws
- Subscribe to charity fund
- View personal profile
- Update payment method

**Public (No Auth Required)**
- View charities list
- View draws list
- View leaderboards
- Register/login

### Middleware Stack

```javascript
// protect: Verifies JWT token
// requireSubscription: Ensures active subscription
// adminOnly: Restricts to admin role
// Error Handling: Catches and formats errors
```

---

## ⭐ Key Features

### 1. User Authentication & Authorization
- JWT-based stateless authentication
- Password hashed with bcryptjs (10 salt rounds)
- Role-based access control (admin/subscriber)
- Protected endpoints with middleware
- 7-day token expiry

### 2. Stripe Payment Integration
- Monthly and yearly subscription plans
- Webhook handling for payment events
- Automatic subscription status updates
- Customer management via Stripe API
- Secure payment processing

### 3. Golf Score Management
- Add/track personal golf scores
- Leaderboard ranking system
- Score date tracking
- Historical score records
- Score validation (1-45 range)

### 4. Charity Selection & Donations
- Multiple charities to choose from
- Percentage of subscription to donate (10-100%)
- Automatically split revenue to selected charity
- Donation tracking per charity
- Impact metrics display

### 5. Golf Draws & Tournaments
- Create and manage tournament draws
- Participant tracking
- Winner selection and prize allocation
- Draw status management
- Results recording

### 6. Admin Dashboard
- User management and statistics
- Revenue analytics
- Draw management interface
- Winner tracking
- System health monitoring

### 7. Security Features
- CORS protection (whitelisted origins)
- Helmet.js for HTTP headers security
- Rate limiting (200 requests per 15 min)
- Password validation & hashing
- JWT token verification
- Input validation with express-validator

### 8. Logging & Monitoring
- Morgan middleware logs all HTTP requests
- Error logging with stack traces
- Health check endpoint (`/api/health`)
- Timestamp tracking on all data

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection setup
├── controllers/
│   ├── authController.js     # Login, register, profile
│   ├── charityController.js  # Charity CRUD operations
│   ├── drawController.js     # Draw management
│   ├── scoreController.js    # Score tracking
│   ├── subscriptionController.js # Stripe webhooks/payments
│   └── adminController.js    # Admin dashboard & stats
├── middleware/
│   └── auth.js               # JWT verification & RBAC
├── models/
│   ├── User.js               # User schema & methods
│   ├── Charity.js            # Charity schema
│   ├── Draw.js               # Draw schema
│   └── (Score model embedded in User)
├── routes/
│   ├── auth.js               # /api/auth routes
│   ├── charities.js          # /api/charities routes
│   ├── draws.js              # /api/draws routes
│   ├── scores.js             # /api/scores routes
│   ├── subscription.js       # /api/subscription routes
│   └── admin.js              # /api/admin routes
├── utils/
│   ├── seeder.js             # Database seeding script
│   └── drawEngine.js         # Draw logic utilities
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies & scripts
├── package-lock.json         # Locked dependency versions
└── server.js                 # Express app initialization
```

### File Purpose Guide

| File | Purpose | Key Functions |
|------|---------|----------------|
| `server.js` | App entry point | Express setup, middleware config, routes registration |
| `config/db.js` | Database connection | MongoDB Atlas connection |
| `middleware/auth.js` | Authentication | JWT verify, role check, subscription check |
| `controllers/*` | Business logic | Request handling, validation, model operations |
| `models/*` | Data schema | MongoDB schema definition, validations |
| `routes/*` | Endpoint mapping | URL paths to controller functions |
| `utils/seeder.js` | Test data | Populate DB with users, charities, draws |
| `.env` | Configuration | Secrets and environment variables |

---

## 🚀 Running & Development

### Development Server
```bash
# Start with auto-reload
npm run dev

# Output:
# 🚀 Server running on port 5000
# ✅ MongoDB Connected: cluster0.mongodb.net
```

### Production Server
```bash
# Start without auto-reload
npm start

# Set NODE_ENV
NODE_ENV=production npm start
```

### Testing Endpoints
Use **Postman**, **Insomnia**, or **curl**:

```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Test authenticated request (use token from login)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Database Seeding

```bash
# Populate sample data
npm run seed

# Creates:
# - 2 test users (admin & subscriber)
# - 5 charities
# - 10 draws
# - Sample scores
```

### Debugging

Enable detailed logging:
```bash
# View all MongoDB queries
DEBUG=* npm run dev

# View HTTP requests with Morgan
NODE_ENV=development npm run dev
```

---

## 🌐 Deployment

### Render Deployment

**Current Production URL**: `https://golf-backend-i2s3.onrender.com`

#### Pre-Deployment Checklist
- ✅ Ensure all dependencies in `package.json`
- ✅ Add `"type": "commonjs"` for Node.js compatibility
- ✅ Create `.env` with all required variables (don't commit)
- ✅ Test locally: `npm start` and `npm run dev`
- ✅ Seed database before deployment

#### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. **Create Render Service**
   - Connect GitHub repo
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables in Render dashboard

3. **Environment Variables on Render**
   - `MONGO_URI`: MongoDB Atlas connection string
   - `JWT_SECRET`: Secret for token signing
   - `STRIPE_SECRET_KEY`: Stripe API key
   - `STRIPE_MONTHLY_PRICE_ID`: Stripe pricing
   - `STRIPE_YEARLY_PRICE_ID`: Stripe pricing
   - `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
   - `CLIENT_URL`: Frontend URL (e.g., Vercel)
   - `NODE_ENV`: Set to `production`

4. **Database Setup**
   - MongoDB Atlas cluster must whitelist Render IP
   - Typically: 0.0.0.0/0 for development
   - Seed database if needed

5. **Monitoring**
   - Render provides logs accessible in dashboard
   - Health check: `GET https://golf-backend-i2s3.onrender.com/api/health`
   - Expected response: `{ status: "OK", timestamp: "..." }`

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t golf-backend .
docker run -p 5000:5000 --env-file .env golf-backend
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Port 5000 Already in Use
```bash
# Windows PowerShell
Stop-Process -Force (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# macOS/Linux
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

#### 2. MongoDB Connection Failed
- **Symptom**: `❌ MongoDB: connect ECONNREFUSED`
- **Fix**: 
  - Verify `MONGO_URI` in `.env`
  - Check MongoDB Atlas is running
  - Verify IP whitelist includes your IP (or 0.0.0.0/0)
  - Test connection: `mongodb://user:password@host/db`

#### 3. JWT Token Issues
- **Symptom**: `401 Not authorized`
- **Solution**:
  - Ensure token is included: `Authorization: Bearer <token>`
  - Check token hasn't expired (7 days)
  - Generate new token: re-login
  - Verify `JWT_SECRET` matches

#### 4. Stripe Webhook Failures
- **Symptom**: Subscription status not updating
- **Fix**:
  - Verify `STRIPE_WEBHOOK_SECRET` is correct
  - Check webhook is registered in Stripe dashboard
  - Monitor webhook logs in Stripe
  - Ensure backend route is accessible: `POST /api/subscription/webhook`

#### 5. CORS Errors
- **Symptom**: `headers.origin not in CORS allowlist`
- **Fix**: Update CORS origins in `server.js`:
  ```javascript
  app.use(cors({ 
    origin: [
      'http://localhost:3000',
      'https://your-frontend-url.vercel.app',
      process.env.CLIENT_URL
    ].filter(Boolean), 
    credentials: true 
  }));
  ```

#### 6. Email Not Sending
- **Symptom**: Nodemailer errors
- **Fix**:
  - Use Gmail App Password (not regular password)
  - Enable "Less secure apps" if using regular password
  - Check SMTP credentials in `.env`
  - Test with: `npm test-email`

#### 7. Rate Limiting Issues
- **Symptom**: `429 Too Many Requests`
- **Solution**: Adjust rate limiter in `server.js`:
  ```javascript
  const limiter = rateLimit({ 
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 200                     // requests per window
  });
  ```

### Performance Optimization

**Database Indexing**
- Email indexed for fast lookups
- Charity slug indexed
- Score date indexed

**Caching Strategy**
- Consider Redis for charity list
- Cache leaderboard updates

**Query Optimization**
- Use `.select()` to exclude sensitive fields
- Implement pagination for user lists
- Use `lean()` for read-only queries

---

## 📞 Support & Contact

For issues or questions:
1. Check MongoDB Atlas dashboard
2. Review Stripe webhook logs
3. Check Render application logs
4. Test endpoints with Postman/Insomnia
5. Review error messages in terminal

---

## 📄 License

This project is part of the Golf Charity fundraising platform.

---

## 🎯 Next Steps

- [ ] Implement email notifications
- [ ] Add more detailed admin analytics
- [ ] Set up automated backups
- [ ] Implement caching layer
- [ ] Add API documentation (Swagger)
- [ ] Set up monitoring & alerting
- [ ] Implement 2FA for admin accounts
- [ ] Add payment receipt emails

---

**Last Updated**: March 25, 2026
**Version**: 1.0.0
**Maintainer**: Golf Charity Team
