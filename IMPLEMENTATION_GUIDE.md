# CRM implementation and operating guide

## Local setup

Use Node.js 20 or newer. From `backend`, run `npm ci`, copy `.env.example` to `.env`, provide a PostgreSQL `DATABASE_URL`, and set a random `JWT_SECRET` of at least 32 characters. Then run `npx prisma generate`, `npx prisma migrate deploy` for an existing database, and `npm run dev`. From `frontend`, run `npm ci`, copy `.env.example` to `.env.local`, set `VITE_API_URL=http://localhost:5000/api`, and run `npm run dev`.

## Database migration safety

The implementation adds two forward-only migrations. Migration 0002 adds contact birthday/profile preferences with safe defaults and an index for birthday lookup. Migration 0003 adds `WHATSAPP` to the existing activity enum. Review these SQL files before applying them to production. Do not run `prisma migrate reset`; use `npx prisma migrate deploy` against the intended PostgreSQL database after taking the normal backup.

## Render deployment

For the backend service, keep the root directory `backend`, build with `npm install && npx prisma generate && npx prisma migrate deploy`, start with `npm start`, and use `/health` as the health check. Set `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=1d`, and the exact deployed frontend origin in `FRONTEND_URL`. For the static frontend service, keep root directory `frontend`, build with `npm install && npm run build`, publish `dist`, and set `VITE_API_URL` to the deployed backend `/api` URL.

## Messaging integrations

The current release intentionally does not send real messages. Before implementing live birthday dispatch, create and verify a Meta WhatsApp Business Platform account and approved message templates, an email service/SMTP account, and an SMS provider that supports Nigerian numbers such as Termii. Store credentials only in backend environment variables or a secrets manager. The next implementation phase should add integration settings, provider adapters, delivery logs, retries, webhook handling, duplicate-send locks, approval status, and a Lagos-timezone worker. Test with provider sandbox/test numbers first and never enable automatic sending without an explicit business-owner setting.

## Test status

The frontend production build, backend syntax checks, Prisma schema validation, and Prisma Client generation pass. Endpoint integration tests, authentication tests against PostgreSQL, and provider tests remain blocked until a test database and provider sandbox credentials are supplied. No real customer communication was attempted.
