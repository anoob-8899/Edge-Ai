# OptiTrain.ai / Edge AI

**Enterprise AI-powered staff training and sales coaching platform tailored for premium optical retail boutiques.**

---

## 🌟 Key Application Features

1. **OptiCoach AI Simulation Arena**: Real-time sales conversation roleplay using Google Gemini (`gemini-2.5-flash` / `@google/genai`) with customer personas (e.g. progressive lens hesitation, polarization objections, premium brand comparisons), in-character responses, live whisper coaching notes, and 6-criterion competency scoring.
2. **Optical Learning Library**: Structured optical curriculum (Frame Materials, Prescription Lenses, Coatings & Treatments, Ocular Anatomy, Progressive Lenses, Lensometry, Branded Sunglasses) with full-text search, practical dispensing applications, interactive quizzes, and persistent progress tracking.
3. **Branded Sunglasses Catalogue**: 12 premier brands (Ray-Ban, Oakley, Gucci, Prada, Tom Ford, Carrera, Police, etc.) with technical specification tracking, official model codes, verification badges, and owner review/approval workflows.
4. **Strict Zero-Price Content Rule**: Complete absence of retail prices, discounts, MSRPs, or checkout funnels across learning and catalogue surfaces to preserve educational purity and dispensing professionalism.
5. **Practice Owner & Manager Dashboard**: Practice-wide staff progress analytics, individual and group assignment dispatch, custom weekly challenge creation, staff status management, and audit log history.
6. **Gamification & Points Engine**: Idempotent point rewards with database-level race condition prevention (PostgreSQL transaction + compound unique constraint) and auditable ledger parity.
7. **Role-Based Access Control (RBAC)**: Cryptographically signed JOSE HS256 JWT cookies (`edge_ai_auth_token`), server-side middleware protection, and confidential staff record isolation.

---

## 🚀 Environment Variables

Copy `.env.example` to `.env` (or configure in your cloud host's Environment Variables dashboard):

```bash
# Application Environment ('production' | 'development' | 'test')
NODE_ENV="production"

# Public URL of the deployed application
NEXT_PUBLIC_APP_URL="https://optitrain.yourclinic.com"

# PostgreSQL connection string (supports Neon, Supabase, AWS RDS, Railway)
# Format: postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require&schema=public
DATABASE_URL="postgresql://postgres:password@localhost:5432/optitrain_db?schema=public"

# Cryptographic signing secret for JWT sessions (minimum 32 characters)
# Generate with: openssl rand -base64 32
JWT_SECRET="replace_with_a_secure_random_string_at_least_32_chars_long"

# Google Gemini AI API Configuration (https://aistudio.google.com/)
GEMINI_API_KEY="your_google_gemini_api_key_here"

# Gemini Model Identifier
GEMINI_MODEL="gemini-2.5-flash"

# Initial Practice Owner Provisioning (used by seed script)
INITIAL_OWNER_EMAIL="owner@apex-optics.com"
INITIAL_OWNER_PASSWORD="ReplaceWithStrongPassword123!"
INITIAL_OWNER_NAME="Dr. Sarah Lin (Practice Owner)"
```

> **Security Note:** Never commit `.env` or print secret keys. `.gitignore` is pre-configured to exclude all `.env*` files except `.env.example`.

---

## 🗄️ Database Provisioning & Migrations

The platform utilizes Prisma ORM with the PostgreSQL adapter (`@prisma/adapter-pg`).

### 1. Apply Schema Migrations to Production Database
Run the standard Prisma deploy command on your target PostgreSQL instance:
```bash
npx prisma migrate deploy
```
*(Alternatively, in rapid preview environments, run `npx prisma db push`)*

### 2. Verify Database Migration Status
```bash
npx prisma migrate status
```

### 3. Provision Initial Practice Owner Account
Run the secure CLI bootstrap script:
```bash
npm run seed:owner
```
*Note: The platform includes a hard safety lock in both the CLI and web bootstrap API—once any user with the `OWNER` role exists in the database, re-bootstrapping is permanently disabled to eliminate takeover risks.*

---

## 🧪 Automated Testing & Verification Suites

The codebase includes comprehensive unit, integration, RBAC, AI simulation, and Playwright browser tests:

```bash
# Run linting check
npm run lint

# Run TypeScript compilation checks
npm run typecheck

# Run Auth & Role-Based Access Control tests (32 assertions)
npm run test:auth

# Run Branded Sunglasses Catalogue test suite (8 test suites)
npm run test:catalogue

# Run Optical Learning Library test suite (7 test suites)
npm run test:library

# Run OptiCoach AI & Gemini integration test suite (35 assertions)
npm run test:opticoach

# Run OptiCoach Assessment & retry test suite (91 assertions)
npm run test:assessment

# Run Owner Dashboard & assignments test suite (9 test suites)
npm run test:owner

# Run Points & Weekly Challenges engine test suite (6 test suites)
npm run test:points

# Run Playwright End-to-End Browser test suite (22 browser assertions across Desktop, Tablet, Mobile)
npm run test:e2e
```

---

## 🌐 Production Deployment Guidelines

Compatible with Vercel, Railway, Render, AWS ECS, or Dockerized VPS instances with an external PostgreSQL provider (Neon, Supabase, AWS RDS, Railway Postgres).

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm run start
```

### Recommended Production Settings
1. **SSL/TLS**: Ensure `sslmode=require` is present on the PostgreSQL connection string in production environments.
2. **Session Cookies**: In production (`NODE_ENV=production`), session cookies are automatically stamped with `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/`.
3. **Database Connection Pool**: The Prisma pg adapter uses a connection pool with connection timeouts and idle reclamation. Adjust `max` in `src/lib/prisma.ts` if running on serverless functions with a connection pooler (e.g. PgBouncer / Neon Pooling on port 6543).
