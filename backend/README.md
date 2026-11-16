# CRM Backend API

Express + Prisma + PostgreSQL backend for authentication, companies, contacts, and deals.

## Setup

```bash
npm install
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET
npx prisma generate
npx prisma migrate dev --name init_crm
npm run dev
```

The API runs on `http://localhost:5000` by default.

## Authentication

### Register an organization and owner

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "organizationName": "Acme Corporation",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@acme.example",
  "password": "a-long-password-at-least-10-chars"
}
```

Registration creates the organization, its first owner user, and default deal pipeline stages. It returns a JWT access token.

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "jane.smith@acme.example",
  "password": "a-long-password-at-least-10-chars"
}
```

If the same email belongs to multiple organizations, include the organization slug:

```json
{
  "email": "jane.smith@example.com",
  "password": "a-long-password-at-least-10-chars",
  "organizationSlug": "acme-corporation"
}
```

### Current user

```http
GET /api/auth/me
Authorization: Bearer <jwt>
```

All CRM routes use the same bearer token:

```http
Authorization: Bearer <jwt-token>
```

The JWT contains the user ID, organization ID, and role. The authentication middleware verifies the signature and `HS256` algorithm, then checks that the user still exists, is active, and belongs to the token's organization. The backend uses the organization ID from the verified token to scope every CRM query.

## Endpoints

### Companies

- `GET /api/companies?page=1&pageSize=25&search=acme&status=ACTIVE`
- `POST /api/companies`
- `GET /api/companies/:id`
- `PATCH /api/companies/:id`
- `DELETE /api/companies/:id`

### Contacts

- `GET /api/contacts?page=1&pageSize=25&search=john&companyId=<id>&status=CUSTOMER`
- `POST /api/contacts`
- `GET /api/contacts/:id`
- `PATCH /api/contacts/:id`
- `DELETE /api/contacts/:id`

### Deals

- `GET /api/deals?page=1&pageSize=25&search=website&stageId=<id>&status=OPEN`
- `POST /api/deals`
- `GET /api/deals/:id`
- `PATCH /api/deals/:id`
- `DELETE /api/deals/:id`

## Example company request

```json
{
  "name": "Acme Corporation",
  "website": "https://acme.example",
  "industry": "Technology",
  "status": "PROSPECT"
}
```

## Example contact request

```json
{
  "companyId": "ckexamplecompanyid123456789",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "jobTitle": "Operations Manager"
}
```

## Example deal request

```json
{
  "companyId": "ckexamplecompanyid123456789",
  "contactId": "ckexamplecontactid123456789",
  "stageId": "ckexamplestageid123456789",
  "title": "CRM implementation",
  "value": 15000,
  "currency": "USD",
  "expectedCloseAt": "2026-12-31T00:00:00.000Z"
}
```

## Role-based access control

All company, contact, and deal routes require both:

1. A valid JWT with an active database user.
2. The permission required by the route.

| Role | Read | Create | Update | Delete |
|---|---:|---:|---:|---:|
| `OWNER` | Yes | Yes | Yes | Yes |
| `ADMIN` | Yes | Yes | Yes | Yes |
| `SALES_MANAGER` | Yes | Yes | Yes | Yes |
| `SALES_REP` | Yes | Yes | Yes | No |
| `VIEWER` | Yes | No | No | No |

Permissions use resource-action keys such as `companies:read`, `contacts:update`, and `deals:delete`. The matrix is defined in `src/middleware/permissions.js`.

Example of a protected route:

```js
router.delete(
  "/companies/:id",
  requirePermission("companies:delete"),
  asyncHandler(companyController.deleteCompany),
);
```

The route-level middleware runs after `requireAuth`, so `req.user.role` comes from the verified, active database user rather than from an untrusted request body.
