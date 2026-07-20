# SubscriptionHub Frontend

Next.js frontend for SubscriptionHub - a personal financial copilot for subscriptions and recurring expenses.

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Authentication**: NextAuth.js

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── services/         # API service layer
├── stores/           # Zustand state stores
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── lib/              # Third-party library configurations
```

## Development

```bash
# Install dependencies
npm install

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
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## API Communication

The frontend communicates with the backend via HTTP REST APIs. All API calls are made through the services layer in `src/services/`.

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Environment variables must be configured in Vercel dashboard.
