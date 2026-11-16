# CRM Production Starter

This ZIP contains a complete React + Express + Prisma CRM monorepo.

```text
crm-production/
├── backend/       Express API, Prisma schema, JWT auth, RBAC
└── frontend/      React/Vite app, login, registration, dashboard, companies, contacts
```

## Before you start

Install:

- Node.js 20 LTS or newer
- npm
- Git
- A Neon PostgreSQL database
- Render account

## Run locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
JWT_SECRET="generate-a-random-secret-at-least-32-characters-long"
JWT_EXPIRES_IN="1d"
FRONTEND_URL="http://localhost:5173"
PORT=5000
```

Run the database migration and generate Prisma Client:

```bash
npx prisma generate
npx prisma migrate dev --name init_crm
npm run dev
```

The API runs at `http://localhost:5000`.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

The frontend runs at `http://localhost:5173`.

Set `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Neon database

1. Create a Neon project and database.
2. Copy the pooled or direct connection string from Neon.
3. Put it in `backend/.env` as `DATABASE_URL`.
4. Run `npx prisma migrate dev --name init_crm` locally.
5. For production deployment, run `npx prisma migrate deploy` from the backend build/deploy process.

Do not commit `.env` files or Neon credentials.

## Deploy the backend to Render manually

Create a Render **Web Service** from this repository:

- Root directory: `backend`
- Environment: Node
- Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start command: `npm start`
- Health check path: `/health`

Add Render environment variables:

```env
DATABASE_URL=<Neon connection string>
JWT_SECRET=<long random production secret>
JWT_EXPIRES_IN=1d
FRONTEND_URL=https://your-frontend.onrender.com
```

Render supplies `PORT` automatically.

After deploy, verify:

```text
https://your-backend.onrender.com/health
```

Expected response:

```json
{"status":"ok"}
```

## Deploy the frontend to Render manually

Create a Render **Static Site** from the same repository:

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

Add this environment variable:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

The `frontend/_redirects` file enables React Router routes on static hosting.

After deployment, update the backend's `FRONTEND_URL` to the exact frontend URL and redeploy the backend if necessary.

## Production checklist

- Use a strong unique `JWT_SECRET`.
- Keep Neon and Render secrets in platform environment variables only.
- Use HTTPS URLs in production.
- Confirm `FRONTEND_URL` exactly matches the deployed frontend origin.
- Run `npx prisma migrate deploy`, not `migrate dev`, in production.
- Review the RBAC matrix in `backend/src/middleware/permissions.js`.
- Configure a custom domain and backups in Render/Neon as appropriate.
- Replace localStorage JWT storage with secure HTTP-only cookies before handling highly sensitive data.

## Main API routes

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET|POST|PATCH|DELETE /api/companies
GET|POST|PATCH|DELETE /api/contacts
GET|POST|PATCH|DELETE /api/deals
```
