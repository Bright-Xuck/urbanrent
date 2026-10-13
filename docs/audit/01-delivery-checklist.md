# Delivery checklist and evidence-based status

## Source checklist (verbatim)

The following is the project owner's checklist, retained as the source of truth for scope and wording. Status corrections based on implementation follow it; the source itself is not edited.

> ### Done
>
> - **Auth:** access/refresh tokens, hashed sessions table, httpOnly cookies, logout
> - **RBAC and ownership checks:** role middleware plus service-layer ownership
> - **Schema design and indexes:** full ERD subset modelled in Prisma
> - **File uploads and cloud storage:** Multer to Supabase, for property images and verification documents
> - **Layered architecture:** routes, controllers, services, repositories
> - **Pagination and filtering:** offset-based, with the public vs `/mine` split
> - **Zustand:** thin auth store with a separate API layer
> - **Admin:** suspension, verification gate, reports and moderation, dashboard
>
> ### Partly done (be honest with yourself on these)
>
> - **REST API integration and form validation:** you had AI wire these, so you haven't hand-built them. Make sure you can explain how your 401 handling and form validation work.
> - **API security:** RBAC and ownership are in, but there's no rate limiting, no helmet, and no input validation library.
> - **Transactions:** if your suspension cascade isn't wrapped in `$transaction`, you haven't practised them yet.
>
> ### Not started
>
> - **Rate limiting and Redis**, **Swagger/OpenAPI**, **testing (Jest/Supertest)**, **Nodemailer**
> - **Socket.IO** (messaging/notifications), **Docker**, **CI/CD**
> - **OWASP audit**, **performance work**, **shadcn/ui** (unclear if it's in your rewrite), **accessibility pass**
> - **MongoDB and GraphQL** (comparison only, so low priority)
>
> ### Deferred items to close out
>
> - Custom error classes, plus the error handler returning 400 for everything
> - Refresh token reuse detection
> - The row-lock concurrency exercise in viewing confirmation
> - The RBAC factory: your agreed trigger was the third near-duplicate middleware. An admin-only one is probably that third, so the closure idea is due.
> - The `RealPress` page title still needs changing to UrbanRent
>
> ### Backend modules still missing
>
> - Leases, rent schedule, caution fee
> - Payments (MTN MoMo / Orange Money)
> - Messaging, notifications, audit logs, disputes

## Status summary

| Checklist item | Status | Code evidence and qualification |
|---|---|---|
| Auth: access/refresh tokens, hashed sessions table, httpOnly cookies, logout | **Done** | JWT access/refresh signing and SHA-256 refresh-token hashes are wired through [`userService.ts`](../../apps/backend/src/services/userService.ts) (`loginUser`, `refreshAccessToken`, `logoutUser`), [`sessionRepository.ts`](../../apps/backend/src/repositories/sessionRepository.ts), [`authController.ts`](../../apps/backend/src/controllers/authController.ts), and [`authRoutes.ts`](../../apps/backend/src/routes/authRoutes.ts). Refresh-token rotation/reuse detection is a separate deferred gap; refresh currently returns only an access token. |
| RBAC and ownership checks: role middleware plus service-layer ownership | **Partly Done** | [`RBAC.ts`](../../apps/backend/src/middleware/RBAC.ts) provides role checks and several services enforce ownership/party access; admin routes apply `requireAdmin`. However, property create/update/delete/image routes do not require `LANDLORD`, and owner-based amenity management does not reject a non-landlord owner. This is not a centralized RBAC factory. |
| Schema design and indexes: full ERD subset modelled in Prisma | **Done** | [`schema.prisma`](../../apps/backend/prisma/schema.prisma) models the implemented subset (users, sessions, properties, amenities, images, applications, viewing requests, verification documents, reports) and includes indexes/constraints. It does not implement the full conceptual [`ERD.md`](../../ERD.md). |
| File uploads and cloud storage: Multer to Supabase, for property images and verification documents | **Done** | [`upload.ts`](../../apps/backend/src/middleware/upload.ts), [`imageService.ts`](../../apps/backend/src/services/imageService.ts), and [`verificationService.ts`](../../apps/backend/src/services/verificationService.ts) wire memory uploads, type/size limits, storage upload, DB persistence, cleanup, public image URLs, and signed verification-document URLs. |
| Layered architecture: routes, controllers, services, repositories | **Done** | The route modules in [`src/routes`](../../apps/backend/src/routes), controller modules in [`src/controllers`](../../apps/backend/src/controllers), services in [`src/services`](../../apps/backend/src/services), and repositories in [`src/repositories`](../../apps/backend/src/repositories) implement this pattern for the current domains. |
| Pagination and filtering: offset-based, with the public vs `/mine` split | **Done** | [`pagination.ts`](../../apps/backend/src/utils/pagination.ts) applies a 50-row cap and defaults; property public browse and owner `/mine` are separate in [`propertyRoutes.ts`](../../apps/backend/src/routes/propertyRoutes.ts), [`propertyController.ts`](../../apps/backend/src/controllers/propertyController.ts), and [`propertyRepository.ts`](../../apps/backend/src/repositories/propertyRepository.ts). Admin users, reports, and verification queues also use offset/limit. |
| Zustand: thin auth store with a separate API layer | **Done** | [`useUserStore.ts`](../../apps/frontend/Store/useUserStore.ts) holds user/token/initialization state; resource-specific wrappers live in [`apps/frontend/api`](../../apps/frontend/api). The actual wrappers are separate raw `fetch` calls; there is no shared `apiFetch` implementation. |
| Admin: suspension, verification gate, reports and moderation, dashboard | **Done** | Admin endpoints in [`adminRoutes.ts`](../../apps/backend/src/routes/adminRoutes.ts) and user/verification/report controllers are guarded by `authenticate` + `requireAdmin`. UI routes exist under [`apps/frontend/app/admin`](../../apps/frontend/app/admin). Suspension unpublishes landlord listings transactionally; publication requires a verified landlord. |
| REST API integration and form validation: AI wired; explain 401 handling | **Partly Done** | API wrappers and forms call the backend, and HTML-native required/type/minLength checks plus some manual checks exist. There is **no shared 401 refresh-and-retry path** in the current frontend source despite that behavior being described in [`FRONTEND_ARCHITECTURE.md`](../FRONTEND_ARCHITECTURE.md). Server-side validation is manual and incomplete; no validation library is present. User reports AI assistance; authorship cannot be proved from source. |
| API security: RBAC/ownership, rate limiting, Helmet, input validation | **Partly Done** | RBAC and ownership checks are present; Redis-backed global/auth/upload limiters are present and wired. Helmet and a schema-validation library are absent. Manual validation does not cover every body field. See [findings](./03-findings-and-security.md). |
| Transactions | **Done (implementation evidence)** | Contrary to the conditional wording in the source checklist, `$transaction` is used for landlord suspension/listing cascade in [`userRepository.ts`](../../apps/backend/src/repositories/userRepository.ts), viewing confirmation with a `FOR UPDATE` lock in [`viewingRequestRepository.ts`](../../apps/backend/src/repositories/viewingRequestRepository.ts), and approval/verification state in [`verificationRepository.ts`](../../apps/backend/src/repositories/verificationRepository.ts). No tests or live concurrency exercise were found, so runtime correctness is **Unverified**. |
| Rate limiting and Redis | **Done (implementation evidence)** | [`rateLimit.ts`](../../apps/backend/src/middleware/rateLimit.ts) defines Redis-backed global, login, registration, refresh, and upload limiters. [`app.ts`](../../apps/backend/src/app.ts) mounts the global limiter and auth/upload routes mount specialized ones. [`redis.ts`](../../apps/backend/src/config/redis.ts) connects at module load and requires `REDIS_URL`. Not runtime-tested. |
| Swagger/OpenAPI | **Done (implementation evidence)** | [`openapi.ts`](../../apps/backend/src/config/openapi.ts) builds a Swagger JSDoc specification from route files; [`app.ts`](../../apps/backend/src/app.ts) serves `/api/docs` and `/api/docs.json`. Specification accuracy/completeness has not been machine-validated. |
| Testing (Jest/Supertest) | **Not Started** | Root and backend `test` scripts are placeholders that exit with “no test specified”; no test files or Jest/Supertest dependency were found. |
| Nodemailer | **Not Started** | No mail provider/service/routes or Nodemailer dependency were found. |
| Socket.IO (messaging/notifications) | **Not Started** | No Socket.IO dependency, connection/server setup, messaging model, or notification model was found. |
| Docker | **Not Started** | No Dockerfile or Compose configuration was found. |
| CI/CD | **Partly Done** | [`render.yaml`](../../render.yaml) is a Render Blueprint with `autoDeploy: true`, but there is no checked-in CI workflow, Docker path, or test pipeline. Frontend hosting is described as separate Vercel deployment, but no pipeline is present in this repository. |
| OWASP audit | **Not Started (formal audit)** | This document is a source-code delivery audit, not a comprehensive OWASP control-by-control assessment or penetration test. Security gaps observed here are listed in [03](./03-findings-and-security.md). |
| Performance work | **Partly Done** | Redis property caching, cache invalidation, response compression, a status/created-at browse index, and pagination caps exist in [`propertyCache.ts`](../../apps/backend/src/services/propertyCache.ts), [`app.ts`](../../apps/backend/src/app.ts), [`schema.prisma`](../../apps/backend/prisma/schema.prisma), and [`pagination.ts`](../../apps/backend/src/utils/pagination.ts). No reproducible benchmark suite, production telemetry, or broad performance pass was verified. |
| shadcn/ui | **Not Started** | UI elements are local components in [`components/ui`](../../apps/frontend/components/ui); frontend dependencies show Tailwind/React and no shadcn/ui package or generated shadcn component setup. |
| Accessibility pass | **Not Started / Unverified** | Some controls use labels and semantic elements, but no completed accessibility audit, WCAG checklist, or automated accessibility tests were found. |
| MongoDB and GraphQL (comparison only) | **Not Started** | [`ERD.md`](../../ERD.md) explicitly keeps MongoDB out of the live architecture, but no standalone MongoDB comparison deliverable or GraphQL implementation/comparison was found. |
| Custom error classes, plus the error handler returning 400 for everything | **Not Started (known deferred bug)** | No custom domain-error hierarchy was found. The final handler in [`app.ts`](../../apps/backend/src/app.ts) returns 400 for every otherwise-unhandled error and sends `err.message`; individual controllers sometimes map known failures first. |
| Refresh token reuse detection | **Not Started** | Refresh does not rotate/revoke the old refresh token or detect reuse. [`refreshAccessToken`](../../apps/backend/src/services/userService.ts) only validates the existing session and returns a new access JWT. |
| Row-lock concurrency exercise in viewing confirmation | **Done (implementation present; execution unverified)** | [`confirmViewingWithoutConflicts`](../../apps/backend/src/repositories/viewingRequestRepository.ts) locks the landlord row with `SELECT ... FOR UPDATE`, re-reads status, checks conflicts, and writes inside `$transaction`. No concurrency test exists. |
| RBAC factory closure | **Not Started** | [`RBAC.ts`](../../apps/backend/src/middleware/RBAC.ts) still repeats role-specific functions and includes `requireLandordadmin`; no role middleware factory was found. |
| `RealPress` page title → UrbanRent | **Done in current source** | Root metadata in [`layout.tsx`](../../apps/frontend/app/layout.tsx) says “UrbanRent | Find a home in Cameroon”; login/register also brand as UrbanRent. Remaining “RealPress” matches are CSS comments describing an inspiration/reference style, not a page title. |
| Leases | **Not Started** | No Prisma model, route, controller, service, or repository. |
| Rent schedule | **Not Started** | No Prisma model or runtime module. |
| Caution fee | **Not Started as a lifecycle/module** | `Property.cautionFee` is a scalar listing field only; there is no lease-linked caution-fee model/workflow. |
| Payments (MTN MoMo / Orange Money) | **Not Started** | No payment models, provider adapters, routes, services, webhook handlers, or provider dependencies. |
| Messaging | **Not Started** | No conversation/message models or API module. |
| Notifications | **Not Started** | No notification model, delivery service, or API module. |
| Audit logs | **Not Started** | No audit-log model or append-only logging workflow. |
| Disputes | **Not Started** | No dispute model, route, or service. |

## Supplied AI-assistance note

The user's statement that API integration and form validation were AI-wired is recorded as user-provided context, not as a claim established by repository evidence. No commit attribution, generation metadata, or source annotation can reliably determine which lines were authored by AI. The code facts are:

- Resource API functions read the token from Zustand, call `fetch`, parse JSON, and throw an `Error` on non-2xx responses.
- `AuthBootstrap` makes one refresh call during app initialization and reads display identity claims from the access-token payload.
- There is no common frontend request function that refreshes/retries a later 401.
- Browser-native constraints and scattered controller/service checks exist; there is no shared server schema validator.
