# SubscriptionHub Architecture Migration Guide

This document explains the architectural changes made to simplify SubscriptionHub from a monorepo to a simple frontend/backend structure.

## Overview

The project has been refactored from a complex monorepo with Docker, Redis, BullMQ, and shared packages to a simple, independent frontend/backend structure that uses Supabase for database and storage.

## Major Architectural Changes

### 1. Project Structure

**Before (Monorepo):**
```
subscriptionhub/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # NestJS backend
├── packages/
│   └── shared/           # Shared types, constants, schemas
├── docker/               # Dockerfiles
├── scripts/              # Setup scripts
├── docker-compose.yml    # Local infrastructure
├── pnpm-workspace.yaml   # Monorepo config
└── package.json          # Root package.json
```

**After (Simplified):**
```
subscriptionhub/
├── frontend/             # Independent Next.js project
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── backend/              # Independent NestJS project
│   ├── src/
│   │   ├── common/       # Shared utilities (formerly in packages/shared)
│   │   ├── modules/      # Feature modules
│   │   └── prisma/
│   └── package.json
├── docs/                 # Documentation
└── README.md
```

### 2. Package Management

**Before:**
- Used pnpm workspaces
- Shared package: `@subscriptionhub/shared`
- Monorepo scripts with filters

**After:**
- Independent npm projects
- No shared packages
- Direct dependencies in each project
- Simple npm scripts

### 3. Database Infrastructure

**Before:**
- Local PostgreSQL via Docker
- Redis for caching and queues
- Manual database management
- Connection string: `postgresql://subscriptionhub:subscriptionhub@postgres:5432/subscriptionhub`

**After:**
- Supabase PostgreSQL (managed)
- No Redis (removed caching layer)
- Direct database connection
- Connection strings:
  - `DATABASE_URL`: Supabase connection string
  - `DIRECT_URL`: Supabase direct connection string (for Prisma migrations)

### 4. Removed Infrastructure

The following components have been completely removed:

- **Docker**: All Dockerfiles and Docker Compose configurations
- **Redis**: Redis service and Redis module
- **BullMQ**: Queue system and worker processes
- **Workers**: Background job workers
- **Shared Packages**: `packages/shared` directory
- **Monorepo Config**: `pnpm-workspace.yaml`
- **Setup Scripts**: `scripts/` directory
- **Deployment Configs**: `render.yaml`, `vercel.json` (will be recreated per service)

### 5. Code Organization Changes

#### Backend

**Shared Code Migration:**
- `packages/shared/src/enums.ts` → `backend/src/common/enums/index.ts`
- `packages/shared/src/constants.ts` → `backend/src/common/constants/index.ts`
- `packages/shared/src/schemas.ts` → `backend/src/common/schemas/index.ts`
- `packages/shared/src/types.ts` → `backend/src/common/types/index.ts`
- `packages/shared/src/money.ts` → `backend/src/common/utils/money.ts`

**Removed Backend Components:**
- `src/redis/` - Redis service and module
- `src/worker.ts` - Worker entry point
- `src/worker.module.ts` - Worker module
- `src/workers/` - Worker implementations
- `Dockerfile.render` - Render Dockerfile
- `Dockerfile.worker` - Worker Dockerfile

**Updated Dependencies:**
- Removed: `bullmq`, `ioredis`, `@subscriptionhub/shared`
- Kept: All other NestJS dependencies
- Added: None (removed dependencies only)

#### Frontend

**Shared Code Migration:**
- `packages/shared/src/enums.ts` → `frontend/src/types/enums.ts`
- `packages/shared/src/types.ts` → `frontend/src/types/api.ts`
- `packages/shared/src/money.ts` → `frontend/src/utils/money.ts`
- `packages/shared/src/constants.ts` → `frontend/src/utils/constants.ts`

**New Directories:**
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `src/services/` - API service layer (for HTTP calls)
- `src/hooks/` - Custom React hooks

**Updated Dependencies:**
- Removed: `@subscriptionhub/shared`
- Added: `zod` (for validation, was in shared package)
- Kept: All other frontend dependencies

### 6. Import Path Updates

All imports from `@subscriptionhub/shared` have been updated to local paths:

**Backend Examples:**
```typescript
// Before
import { ACCESS_TOKEN_TTL_SECONDS } from '@subscriptionhub/shared';

// After
import { ACCESS_TOKEN_TTL_SECONDS } from '../../common/constants';
```

**Frontend Examples:**
```typescript
// Before
import { formatMoney } from '@subscriptionhub/shared';

// After
import { formatMoney } from '../utils/money';
```

### 7. Database Configuration

**Prisma Schema Update:**
```prisma
// Before
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// After
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Added for Supabase
}
```

### 8. Environment Variables

**Backend (.env.example):**
- Added: `DIRECT_URL` (Supabase direct connection)
- Removed: `REDIS_URL` (no longer needed)
- Kept: All other environment variables

**Frontend (.env.example):**
- Simplified to essential variables only
- Kept: `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`

### 9. Module Updates

**Dashboard Module:**
- Removed Redis caching dependency
- Simplified to direct database queries only

**Other Modules:**
- No functional changes
- Only import path updates for shared code

### 10. Deployment Architecture

**Before:**
- Docker Compose for local development
- Docker containers for deployment
- Complex orchestration

**After:**
- **Frontend**: Vercel (serverless Next.js)
- **Backend**: Render (Node.js service)
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Supabase Storage (managed file storage)

No Docker required for deployment.

## Migration Steps for Existing Code

### Step 1: Update Local Environment

1. Create a Supabase project at https://supabase.com
2. Get your connection strings from Supabase dashboard
3. Update `backend/.env` with Supabase credentials
4. Update `frontend/.env.local` with API URL

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 3: Setup Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### Step 4: Update Import Paths

Search and replace all imports from `@subscriptionhub/shared`:

**Backend:**
```bash
# Find all files with old imports
grep -r "@subscriptionhub/shared" src/

# Replace with local paths
# Manual replacement required based on file location
```

**Frontend:**
```bash
# Find all files with old imports
grep -r "@subscriptionhub/shared" src/

# Replace with local paths
# Manual replacement required based on file location
```

### Step 5: Test Locally

```bash
# Start backend (terminal 1)
cd backend
npm run dev

# Start frontend (terminal 2)
cd frontend
npm run dev
```

### Step 6: Deploy to Production

**Backend (Render):**
1. Connect GitHub repository to Render
2. Create new web service
3. Configure environment variables
4. Deploy

**Frontend (Vercel):**
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy

## Breaking Changes

### 1. Package Manager
- **Before**: pnpm with workspaces
- **After**: npm (independent projects)
- **Impact**: Need to use `npm` instead of `pnpm`

### 2. Shared Package
- **Before**: `@subscriptionhub/shared` package
- **After**: Local files in each project
- **Impact**: All import paths need updating

### 3. Redis Caching
- **Before**: Redis for dashboard caching
- **After**: No caching (direct database queries)
- **Impact**: Slightly slower dashboard loads (acceptable trade-off)

### 4. Worker Processes
- **Before**: Separate worker processes for background jobs
- **After**: No workers (all synchronous)
- **Impact**: Report generation is now inline (acceptable for MVP)

### 5. Development Setup
- **Before**: Docker Compose for infrastructure
- **After**: Supabase for database, no local infrastructure
- **Impact**: Need Supabase account for development

## Benefits of New Architecture

1. **Simplicity**: No Docker, no Redis, no workers
2. **Cost**: Lower infrastructure costs (no Redis, no worker servers)
3. **Maintenance**: Easier to understand and maintain
4. **Deployment**: Simpler deployment process
5. **Development**: Faster local development (no Docker)
6. **Scalability**: Serverless architecture scales automatically
7. **Database**: Managed database with backups and monitoring

## Rollback Plan

If needed, you can rollback by:

1. Restore from git: `git checkout <commit-before-migration>`
2. Restart Docker Compose: `docker-compose up -d`
3. Reinstall pnpm: `pnpm install`
4. Run migrations: `pnpm db:migrate`

## Support

For issues or questions about this migration:
1. Check this guide first
2. Review individual project READMEs (frontend/README.md, backend/README.md)
3. Consult existing documentation in docs/ directory
