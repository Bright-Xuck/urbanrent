# Architecture and implementation map

## Repository shape

- Root workspace: pnpm workspace in [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml), with `apps/*`.
- Backend: Express 5 + TypeScript, Prisma 7/PostgreSQL, Redis, and Supabase Storage under [`apps/backend`](../../apps/backend).
- Frontend: Next.js App Router + React + TypeScript + Zustand under [`apps/frontend`](../../apps/frontend).
- Deployment config: [`render.yaml`](../../render.yaml) configures the backend service; checked-in documentation describes separate frontend hosting.
- Domain/design reference: [`ERD.md`](../../ERD.md). This is broader than the currently implemented Prisma schema.

## Backend request path

```text
apps/backend/src/server.ts
  -> app.ts middleware (JSON, CORS, cookies, compression)
  -> /health and public Swagger routes
  -> global /api Redis rate limiter
  -> mounted route module
  -> authentication / suspension / role / upload middleware
  -> controller (HTTP parsing, response status)
  -> service (business rules, ownership, state transitions)
  -> repository (Prisma reads/writes and transactions)
  -> PostgreSQL / Redis / Supabase Storage
```

The server composition is in [`app.ts`](../../apps/backend/src/app.ts) and [`server.ts`](../../apps/backend/src/server.ts). The backend follows the stated route → controller → service → repository layering for implemented domains, though some service modules also directly orchestrate configuration/service clients (for example storage/cache).

### Middleware and cross-cutting behavior

- [`authenticate.ts`](../../apps/backend/src/middleware/authenticate.ts): verifies bearer access tokens and attaches `req.user`; `optionalAuthenticate` permits public property/image reads to identify owners/admins.
- [`RBAC.ts`](../../apps/backend/src/middleware/RBAC.ts): role-specific checks for tenant, landlord, admin, and landlord-or-admin.
- [`blockIfSuspended.ts`](../../apps/backend/src/middleware/blockIfSuspended.ts): DB-checks the current account and blocks selected mutations; GET paths are intentionally allowed.
- [`rateLimit.ts`](../../apps/backend/src/middleware/rateLimit.ts): defines Redis-backed limiters; `app.ts` mounts the global one; auth/upload routes mount narrower limits.
- [`upload.ts`](../../apps/backend/src/middleware/upload.ts): Multer memory storage; property image files are capped at 5 MiB and 5 per request in the route; verification documents are capped at 10 MiB.
- Final error middleware in [`app.ts`](../../apps/backend/src/app.ts): maps Multer and otherwise-unhandled errors to JSON, but maps all those errors to 400.

## Backend route-to-domain map

| Mounted API surface | Route/controller/service/repository path | Main behavior |
|---|---|---|
| `/api/auth/*` | [`authRoutes.ts`](../../apps/backend/src/routes/authRoutes.ts) → [`authController.ts`](../../apps/backend/src/controllers/authController.ts) → [`userService.ts`](../../apps/backend/src/services/userService.ts) → [`userRepository.ts`](../../apps/backend/src/repositories/userRepository.ts), [`sessionRepository.ts`](../../apps/backend/src/repositories/sessionRepository.ts) | Registration, login, refresh, logout; JWTs, password hash, hashed refresh-token session. |
| `/api/properties/*` | [`propertyRoutes.ts`](../../apps/backend/src/routes/propertyRoutes.ts) → [`propertyController.ts`](../../apps/backend/src/controllers/propertyController.ts) → [`propertyService.ts`](../../apps/backend/src/services/propertyService.ts) → [`propertyRepository.ts`](../../apps/backend/src/repositories/propertyRepository.ts) | Public published browse/filter, owner `/mine`, detail visibility, create/edit/delete, verification gate, moderation support. |
| `/api/properties/:propid/amenities/*` | [`amenityRoutes.ts`](../../apps/backend/src/routes/amenityRoutes.ts) → [`amenityController.ts`](../../apps/backend/src/controllers/amenityController.ts) → [`amenityService.ts`](../../apps/backend/src/services/amenityService.ts) → [`amenityRepository.ts`](../../apps/backend/src/repositories/amenityRepository.ts) | Amenity catalog and property links. The nested mount is wired in `app.ts`. |
| `/api/properties/:propertyId/applications` and `/api/applications/*` | [`propertyApplicationRoutes.ts`](../../apps/backend/src/routes/propertyApplicationRoutes.ts), [`applicationRoutes.ts`](../../apps/backend/src/routes/applicationRoutes.ts) → [`applicationController.ts`](../../apps/backend/src/controllers/applicationController.ts) → [`applicationService.ts`](../../apps/backend/src/services/applicationService.ts) → [`applicationRepository.ts`](../../apps/backend/src/repositories/applicationRepository.ts) | Tenant submission, own/incoming lists, party visibility, role-based status transitions. |
| `/api/properties/:propertyId/viewing-requests` and `/api/viewing-requests/*` | [`propertyViewingRequestRoutes.ts`](../../apps/backend/src/routes/propertyViewingRequestRoutes.ts), [`viewingRequestRoutes.ts`](../../apps/backend/src/routes/viewingRequestRoutes.ts) → [`viewingRequestController.ts`](../../apps/backend/src/controllers/viewingRequestController.ts) → [`viewingRequestService.ts`](../../apps/backend/src/services/viewingRequestService.ts) → [`viewingRequestRepository.ts`](../../apps/backend/src/repositories/viewingRequestRepository.ts) | Tenant requests, party access, status transitions, confirmed-time overlap rejection, row-lock transaction. |
| `/api/properties/:id/images` | `propertyRoutes.ts` → [`imageController.ts`](../../apps/backend/src/controllers/imageController.ts) → [`imageService.ts`](../../apps/backend/src/services/imageService.ts) → [`imageRepository.ts`](../../apps/backend/src/repositories/imageRepository.ts) → [`supabase.ts`](../../apps/backend/src/config/supabase.ts) | Owner-only property image upload to Supabase and visible-image reads. |
| `/api/verification/documents` | [`verificationRoutes.ts`](../../apps/backend/src/routes/verificationRoutes.ts) → [`verificationController.ts`](../../apps/backend/src/controllers/verificationController.ts) → [`verificationService.ts`](../../apps/backend/src/services/verificationService.ts) → [`verificationRepository.ts`](../../apps/backend/src/repositories/verificationRepository.ts) | Landlord document upload/listing, signed view URLs, admin review, verification-state update. |
| `/api/properties/:propertyId/reports` and `/api/admin/reports*` | [`propertyReportRoutes.ts`](../../apps/backend/src/routes/propertyReportRoutes.ts), `adminRoutes.ts` → [`reportController.ts`](../../apps/backend/src/controllers/reportController.ts) → [`reportService.ts`](../../apps/backend/src/services/reportService.ts) → [`reportRepository.ts`](../../apps/backend/src/repositories/reportRepository.ts) | Tenant property reporting and admin queue/review. |
| `/api/admin/users*`, `/api/admin/verification*`, `/api/admin/properties/:id/moderate` | [`adminRoutes.ts`](../../apps/backend/src/routes/adminRoutes.ts) → [`adminController.ts`](../../apps/backend/src/controllers/adminController.ts), `verificationController.ts`, `reportController.ts` → corresponding services/repositories | Admin user listing, suspension/reinstatement, verification review, report review, property moderation. |

## Frontend request and state flow

```text
Next.js page/layout
  -> UI component / form
  -> resource wrapper in apps/frontend/api
  -> fetch(NEXT_PUBLIC_API_URL + route)
  -> bearer token read from useAuthStore (when needed)
  -> backend endpoint
```

- The root [`layout.tsx`](../../apps/frontend/app/layout.tsx) wraps the app in [`AuthBootstrap`](../../apps/frontend/components/auth/AuthBootstrap.tsx).
- `AuthBootstrap` calls `refreshSession()` once at mount, derives display/navigation user claims from the access JWT, stores user and token in [`useUserStore.ts`](../../apps/frontend/Store/useUserStore.ts), and marks initialization complete.
- Resource wrappers are separate modules: [`propertyApi.ts`](../../apps/frontend/api/propertyApi.ts), [`applicationApi.ts`](../../apps/frontend/api/applicationApi.ts), [`viewingRequestApi.ts`](../../apps/frontend/api/viewingRequestApi.ts), [`verificationApi.ts`](../../apps/frontend/api/verificationApi.ts), [`reportApi.ts`](../../apps/frontend/api/reportApi.ts), [`admin.ts`](../../apps/frontend/api/admin.ts), and others.
- These wrappers use direct `fetch`, generally read the bearer token from Zustand, parse JSON, and throw on non-OK responses. `userApi.ts` uses `credentials: "include"` for authentication cookie flows.
- There is no actual `apiFetch` helper or general 401 retry logic in the frontend source. The existing [`FRONTEND_ARCHITECTURE.md`](../FRONTEND_ARCHITECTURE.md) describes a shared helper and retry behavior that are not reflected in current implementation.
- Forms use HTML constraints and local event handlers: see [`PropertyForm.tsx`](../../apps/frontend/components/properties/PropertyForm.tsx), [`ApplyForm.tsx`](../../apps/frontend/components/applications/ApplyForm.tsx), login/register pages, and other forms. The browser constraints are not a substitute for server-side validation.

## Authentication sequence

1. Login accepts email/password at `/api/auth/login`.
2. The service verifies bcrypt hash, issues 15-minute access and 7-day refresh JWTs, hashes the refresh token, and creates a session row.
3. The controller returns the access token and sets `RefreshToken` as a Secure, HttpOnly cookie scoped to `/api/auth`; CORS credentials and `COOKIE_SAMESITE` are configured in `app.ts`/`authController.ts`.
4. The client keeps the access token in memory in Zustand. The refresh cookie is sent to the refresh endpoint by browser credentials.
5. Refresh validates JWT/session hash/revocation/expiry and returns a new access JWT. It does **not** rotate the refresh token or revoke its session.
6. Logout revokes the stored session and clears the cookie.

Relevant code: [`token.ts`](../../apps/backend/src/utils/token.ts), [`userService.ts`](../../apps/backend/src/services/userService.ts), [`authController.ts`](../../apps/backend/src/controllers/authController.ts), [`sessionRepository.ts`](../../apps/backend/src/repositories/sessionRepository.ts), [`userApi.ts`](../../apps/frontend/api/userApi.ts), [`AuthBootstrap.tsx`](../../apps/frontend/components/auth/AuthBootstrap.tsx).

## Database and infrastructure

### Implemented Prisma models

The current Prisma schema has ten models: `User`, `Session`, `Property`, `Amenity`, `PropertyAmenity`, `PropertyImage`, `Application`, `ViewingRequest`, `VerificationDocument`, and `PropertyReport`. It also has enums for roles, account/verification state, property, application, viewing, document, and report status/reason.

Important implemented constraints/indexes include unique user email, unique session token hash, unique amenity name, unique property/amenity pair, foreign keys with explicit delete behavior, owner/tenant/property/status indexes, and the `properties(status, created_at)` browse index migration.

The larger conceptual ERD contains entities not present in Prisma. See [04](./04-deferred-and-missing-modules.md).

### Configuration clients

- PostgreSQL/Prisma: [`config/prisma.ts`](../../apps/backend/src/config/prisma.ts), requires `DATABASE_URL`.
- Redis: [`config/redis.ts`](../../apps/backend/src/config/redis.ts), requires `REDIS_URL`, connects during module import; used by limiters and property cache.
- Supabase Storage: [`config/supabase.ts`](../../apps/backend/src/config/supabase.ts), requires `SUPABASE_URL` and the service-role-key environment variable name referenced in code.
- JWT: [`utils/token.ts`](../../apps/backend/src/utils/token.ts), requires `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.
- Frontend API origin: `NEXT_PUBLIC_API_URL`; backend CORS/deployment values include `FRONTEND_ORIGIN`, `COOKIE_SAMESITE`, and `API_BASE_URL`.

The tagged `.env` files were intentionally not opened. See [03](./03-findings-and-security.md) for non-secret configuration consistency observations.

## OpenAPI, rate limiting, and performance paths

- OpenAPI configuration: [`openapi.ts`](../../apps/backend/src/config/openapi.ts), route JSDoc definitions, and `/api/docs` plus `/api/docs.json` in [`app.ts`](../../apps/backend/src/app.ts).
- Global/API and specialized Redis limiters: [`rateLimit.ts`](../../apps/backend/src/middleware/rateLimit.ts), mounted in app/auth/property/verification route files.
- Property browse cache: [`propertyCache.ts`](../../apps/backend/src/services/propertyCache.ts), Redis TTL plus version-based invalidation on property mutations.
- Response compression: `compression()` middleware in `app.ts`.
- Bounded pagination: [`pagination.ts`](../../apps/backend/src/utils/pagination.ts).
- Browse index: `@@index([status, createdAt])` in Prisma and [`add_property_browse_index/migration.sql`](../../apps/backend/prisma/migrations/20261013030323_add_property_browse_index/migration.sql).

These features are present in source. No runtime benchmark, Redis outage test, OpenAPI validator, or load test was run.
