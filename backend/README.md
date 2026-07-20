# SubscriptionHub Backend

NestJS backend API for SubscriptionHub - a personal financial copilot for subscriptions and recurring expenses.

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: JWT + OAuth (Google, Apple, Microsoft)
- **AI**: OpenAI GPT-4
- **Logging**: Pino

## Project Structure

```
src/
├── common/           # Shared utilities, guards, decorators
│   ├── constants/   # Application constants
│   ├── enums/       # Enum definitions
│   ├── schemas/     # Zod validation schemas
│   ├── types/       # TypeScript types
│   ├── utils/       # Utility functions
│   ├── guards/      # Auth guards
│   ├── decorators/  # Custom decorators
│   ├── filters/     # Exception filters
│   ├── interceptors/# Response interceptors
│   └── crypto/      # Encryption utilities
├── modules/         # Feature modules
│   ├── auth/        # Authentication & authorization
│   ├── users/       # User management
│   ├── subscriptions/ # Subscription management
│   ├── charges/     # Charge tracking
│   ├── categories/  # Category management
│   ├── payment-methods/ # Payment methods
│   ├── dashboard/   # Dashboard analytics
│   ├── reports/     # Report generation
│   ├── goals/       # Financial goals
│   ├── notifications/ # Notifications
│   ├── integrations/ # Third-party integrations
│   ├── ai/          # AI assistant
│   ├── detection/   # Subscription detection
│   ├── audit/       # Audit logging
│   └── health/      # Health checks
├── prisma/          # Prisma client
└── main.ts          # Application entry point
```

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm run test
npm run test:integration
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
ENCRYPTION_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
OPENAI_API_KEY=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASSWORD=...
```

## Database

This project uses Supabase PostgreSQL. To set up:

1. Create a Supabase project at https://supabase.com
2. Get your database connection strings
3. Set `DATABASE_URL` and `DIRECT_URL` in `.env`
4. Run migrations: `npm run db:migrate`

## API Documentation

API endpoints follow REST conventions. Swagger documentation is available at `/api` when running in development.

## Deployment

Deploy to Render:

1. Connect your GitHub repository
2. Configure environment variables
3. Deploy as a web service

The backend is designed to run without Docker, using Node.js directly on Render.
