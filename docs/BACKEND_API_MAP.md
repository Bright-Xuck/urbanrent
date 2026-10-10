# UrbanRent backend API map

This document records the API implemented by `apps/backend` as inspected on
2026-10-09. It describes the route registrations, controllers, services,
repositories, and Prisma schema; it does not assume that a schema model or a
frontend navigation link is an implemented endpoint.

## Conventions and shared behavior

- The API prefix is `/api`; the health endpoint is `/health`.
- Protected requests use `Authorization: Bearer <accessToken>`. Access tokens
  last 15 minutes. The backend does not accept the access token in a cookie.
- Login sets the `RefreshToken` cookie (`httpOnly`, `secure`, path
  `/api/auth`, seven-day max age). Refresh and logout use that cookie; their
  requests need browser credentials enabled. In production,
  `COOKIE_SAMESITE=none` is needed for the frontend and API on separate
  domains, and CORS allows credentialed requests from `FRONTEND_ORIGIN`.
  When `FRONTEND_ORIGIN` is unset, CORS reflects the requesting origin rather
  than restricting access. The cookie is marked `secure` in all environments.
- Most errors are JSON `{ "message": "..." }`. The application has no
  validation middleware and no custom not-found handler. Multer and propagated
  errors reach a final handler that returns HTTP 400 with `{ message }`;
  unknown paths therefore use Express's default 404 response rather than the
  API's usual JSON error envelope.
- List pagination uses `offset` and `limit`, defaults to `0` and `10`, and
  returns `{ items, total, offset, limit, totalPages }`. There is no maximum
  limit. Invalid `offset < 0` or `limit < 1` is rejected, but zero and
  non-numeric values are coerced to the default by `Number(value) || default`.
- Date values in JSON are ISO strings. Optional Prisma columns are generally
  returned as `null`.
- Route role-gates are recorded below, but some write routes rely on
  ownership checks in services rather than checking a role at the route.
  Suspended accounts are blocked on most writes, not on reads.

## Enums and state transitions

Enums from `prisma/schema.prisma`:

| Resource | Values |
|---|---|
| `Role` | `TENANT`, `LANDLORD`, `ADMIN` |
| `VerificationState` | `UNVERIFIED`, `VERIFIED` |
| `AccountState` | `ACTIVE`, `SUSPENDED` |
| `PropertyStatus` | `DRAFT`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED` |
| `PropertyType` | `APARTMENT`, `STUDIO`, `HOUSE`, `VILLA`, `COMMERCIAL`, `OTHER` |
| `ApplicationStatus` | `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `WITHDRAWN` |
| `ViewingRequestStatus` | `REQUESTED`, `CONFIRMED`, `DECLINED`, `COMPLETED`, `NO_SHOW` |
| `VerificationDocumentType` | `NATIONAL_ID`, `PROOF_OF_OWNERSHIP` |
| `VerificationDocumentStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `PropertyReportReason` | `SCAM_OR_FRAUD`, `MISLEADING_INFORMATION`, `ALREADY_RENTED`, `OTHER` |
| `PropertyReportStatus` | `OPEN`, `REVIEWED`, `DISMISSED` |

Implemented transition rules:

- Applications: `SUBMITTED` → `UNDER_REVIEW`, `APPROVED`, `REJECTED`, or
  `WITHDRAWN`; `UNDER_REVIEW` → `APPROVED`, `REJECTED`, or `WITHDRAWN`.
  Only the applicant (TENANT) may withdraw. The property owner or ADMIN may
  move an application to `UNDER_REVIEW`, `APPROVED`, or `REJECTED`. Approved,
  rejected, and withdrawn are terminal. A tenant may have at most one
  `SUBMITTED`/`UNDER_REVIEW` application per property; reapplying after a
  terminal result is allowed.
- Viewings: `REQUESTED` → `CONFIRMED` or `DECLINED`; `CONFIRMED` →
  `COMPLETED` or `NO_SHOW`. The property owner or ADMIN performs transitions.
  Confirmation requires `confirmedTime`; the repository transaction rejects
  another confirmed viewing for the same landlord within 60 minutes.
- Documents: only `PENDING` documents can be reviewed; review chooses
  `APPROVE` or `REJECT`. Approval marks the user `VERIFIED`; rejection may
  include a review note.
- Properties have a `status` enum and a publishing check (owner must be
  verified), but there is no property status transition matrix. The owner may
  update to a supplied status, subject to verification when moving to
  `PUBLISHED`.
- `PropertyReport` has schema enums and documented intended transitions, but
  no API or service implements them.

## Endpoint inventory

In the tables, “any authenticated role” means the route requires a valid access
token but has no explicit route-level role gate. “Owner” is checked against
the property or resource in the service. “Suspension blocked” means the
`blockIfSuspended` middleware returns 403 for a suspended account.

### Health and authentication

| Method and path | Auth / roles | Request | Success response | Error cases |
|---|---|---|---|---|
| `GET /health` | Public | None | `200 { ok: true, message: "Server is running" }` | No application-specific errors. |
| `POST /api/auth/register` | Public | JSON `{ email, password, role }`; service supports `TENANT` or `LANDLORD` | `201 { message, user: { id, email, role } }` | `409 { message }` if email is taken; otherwise controller returns `500 { message: "Internal server error" }`. There is no request validation; malformed input can become a 500. |
| `POST /api/auth/login` | Public | JSON `{ email, password }` | `200 { message, user: { id, email, role }, accessToken }`; sets refresh cookie | `401 { message: "Invalid email or password" }`; otherwise `500 { message: "Internal server error" }`. |
| `POST /api/auth/refresh` | Refresh cookie; no access token | No body. Reads cookie `RefreshToken`. | `200 { message, accessToken }`; response does **not** include `user` | `400 { message: "Refresh token is required" }` if cookie absent; `401 { message }` for invalid, revoked, or expired refresh token / missing user; otherwise 500. |
| `POST /api/auth/logout` | Refresh cookie; no access token | No body. Reads cookie `RefreshToken`. | `200 { message: "Logged out successfully" }`; revokes session and clears cookie | `400 { message: "Refresh token is required" }`; `401 { message: "Invalid refresh token" }`; otherwise 500. |

### Properties, images, and amenities

Property create/update fields are `title`, `description`, `propertyType`,
`bedrooms`, `bathrooms`, `sizeSqm`, `city`, `neighborhood`, `address`,
`latitude`, `longitude`, `monthlyRent`, `cautionFee`, and `status`. The owner
ID is always taken from the token. Optional numeric/string fields are not
validated in the controller.

| Method and path | Auth / roles | Request | Success response | Error cases |
|---|---|---|---|---|
| `GET /api/properties` | Public | Query: `offset`, `limit`, `propertyType`, `city`, `minRent`, `maxRent`, `minBedrooms`. City and type are exact matches. | `200 { properties, total, offset, limit, totalPages }`; published rows only, newest first; property rows include owner `{ verificationState }` | `400 { message }` for bad pagination or `minRent > maxRent`; otherwise 500. Unknown `propertyType` is silently ignored. |
| `POST /api/properties` | Any authenticated role; suspension blocked. No explicit role gate. | JSON property fields above; omitted status defaults to `DRAFT`. | `201 { message, property }` | `401` unauthenticated; `403 { message }` when publishing before owner verification; otherwise 500. |
| `GET /api/properties/mine` | LANDLORD or ADMIN | Query: `offset`, `limit` | `200 { properties, total, offset, limit, totalPages }`; caller's own properties of all statuses | `401`, `403 { message: "not authorized" }`, `400` invalid pagination, or 500. |
| `GET /api/properties/:id` | Public; optional bearer token recognizes owner/ADMIN for private listing visibility | Path `id` | `200 { property }`; row includes owner `{ verificationState }` | `400` invalid id; `404 { message: "Property not found" }` for missing or hidden property; otherwise 500. |
| `PATCH /api/properties/:id` | Any authenticated role; suspension blocked; property owner check in service. No explicit role gate. | JSON partial property fields | `200 { message, property }` | `401`; `400` invalid id; `403 { message }` for non-owner or unverified publish; `404` missing; otherwise 500. |
| `DELETE /api/properties/:id` | Any authenticated role; suspension blocked; property owner check in service. No explicit role gate. | Path `id` | `200 { message: "Property deleted successfully" }` | `401`; `400` invalid id; `403` non-owner; `404` missing; otherwise 500. |
| `POST /api/properties/:id/images` | Any authenticated role; suspension blocked; property owner check in service. No explicit role gate. | `multipart/form-data`, repeated `images` files, maximum 5 files per request; JPEG/PNG/WebP, 5 MiB each | `201 { message: "<n> image(s) uploaded successfully" }` | `401`; `400` invalid id, no files, rejected type, or Multer size/count errors; `403` non-owner; `404` missing property; otherwise 500. |
| `GET /api/properties/:id/images` | Public; optional bearer token follows property visibility | Path `id` | `200 { images: PropertyImage[] }`; images are ordered oldest first | `400` invalid id; `404` missing/hidden property; otherwise 500. |
| `GET /api/properties/:propid/amenities` | Public | Path `propid` | `200 PropertyAmenity[]`; each join row contains nested `amenity` | `400` invalid id; controller maps failures to `500 { message: "Failed to get amenity for this property" }`. |
| `POST /api/properties/:propid/amenities` | Authenticated, suspension blocked; property owner or ADMIN checked in service | JSON `{ name, pictureurl? }` | `201 { message, amenities, link }` | `401`; `400` missing/blank name or bad path id; `403` non-owner; `404` missing property; otherwise 500 (including duplicate unique amenity name). |
| `DELETE /api/properties/:propid/amenities/:id` | Authenticated, suspension blocked; property owner or ADMIN checked in service | Path `id` is the amenity ID, not the property-amenity link ID | `200 { message, deletedRes }` | `401`; `400` invalid path id; `403` non-owner; `404` missing property; otherwise 500 (including missing amenity). |

`PropertyImage` rows contain `id`, `propertyId`, `url`, `publicId`, and
`createdAt`. There is no image-delete endpoint. Images use the public Supabase
Storage bucket configured by the backend.

### Applications

| Method and path | Auth / roles | Request | Success response | Error cases |
|---|---|---|---|---|
| `POST /api/properties/:propertyId/applications` | TENANT; suspension blocked | JSON `{ note? }` | `201 { message, application }` | `401`; `403` wrong role/suspended; `400` property not accepting applications; `404` missing property; `409` existing active application; otherwise 500. |
| `GET /api/applications/mine` | Any authenticated role; result is scoped to caller as applicant | None | `200 { applications }`; each includes property, newest first | `401` or 500. A non-tenant authenticated role gets an empty own-applications list rather than role rejection. |
| `GET /api/applications/incoming` | LANDLORD or ADMIN; result is scoped to properties owned by caller | None | `200 { applications }`; each includes property and applicant `{ id, email }`, newest first | `401`, `403` wrong role, or 500. ADMIN does not receive all landlords' applications; this query is owner-scoped. |
| `GET /api/applications/:id` | Any authenticated role; applicant, property owner, or ADMIN service check | Path `id` | `200 { application }`; includes property and owner `{ id, email }` | `401`; `400` invalid id; `403` no permission; `404` missing; otherwise 500. |
| `PATCH /api/applications/:id/status` | Any authenticated role; suspension blocked; service checks actor and transition | JSON `{ status: ApplicationStatus }` | `200 { message, application }` | `401`; `400` invalid id/status or illegal transition; `403` wrong actor; `404` missing; otherwise 500. |

### Viewing requests

| Method and path | Auth / roles | Request | Success response | Error cases |
|---|---|---|---|---|
| `POST /api/properties/:propertyId/viewing-requests` | TENANT; suspension blocked | JSON `{ proposedTimes: string[] }` (ISO date-time strings expected) | `201 { message, request }` | `401`; `403` wrong role/suspended; `400` property not accepting viewings or no proposed times; `404` missing property; otherwise 500. |
| `GET /api/viewing-requests/mine` | Any authenticated role; result scoped to caller as tenant | None | `200 { requests }`; each includes property, newest first | `401` or 500. Non-tenants are not explicitly rejected and normally receive an empty list. |
| `GET /api/viewing-requests/incoming` | LANDLORD or ADMIN; result scoped to properties owned by caller | None | `200 { requests }`; each includes property and requester `{ id, email }`, newest first | `401`, `403` wrong role, or 500. ADMIN receives only requests for properties they own. |
| `GET /api/viewing-requests/:id` | Any authenticated role; tenant, property owner, or ADMIN service check | Path `id` | `200 { request }`; includes property and owner `{ id, email }` | `401`; `400` invalid id; `403` no permission; `404` missing; otherwise 500. |
| `PATCH /api/viewing-requests/:id/status` | Any authenticated role; suspension blocked; property owner or ADMIN and state transition checked in service | JSON `{ status: ViewingRequestStatus, confirmedTime? }`; confirmed time required for `CONFIRMED` | `200 { message, request }` | `401`; `400` invalid id/status, illegal transition, or missing confirmed time; `403` non-owner/non-admin; `404` missing; `409` landlord calendar overlap (within 60 minutes); otherwise 500. |

### Landlord verification and admin user management

| Method and path | Auth / roles | Request | Success response | Error cases |
|---|---|---|---|---|
| `POST /api/verification/documents` | LANDLORD; suspension blocked | `multipart/form-data`: file field `document`, text field `documentType` (`NATIONAL_ID` or `PROOF_OF_OWNERSHIP`); JPEG/PNG/WebP/PDF, up to 10 MiB | `201 { message, document }` | `401`; `403` wrong role/suspended; `400` invalid type, missing file, unsupported type, or too large; otherwise 500. |
| `GET /api/verification/documents` | LANDLORD; no suspension block | None | `200 { documents, verificationState }`; each document includes a newly generated one-hour `viewUrl` | `401`; `403` wrong role; otherwise 500. |
| `GET /api/admin/users` | ADMIN | Query: `offset`, `limit`, optional `role`, optional `accountState` | `200 { users, total, offset, limit, totalPages }`; password hash excluded | `401`; `403` wrong role; `400` invalid pagination/filter; otherwise 500. |
| `GET /api/admin/users/:id` | ADMIN | Path `id` | `200 { user }`; full user row except `passwordHash` | `401`; `403` wrong role; `400` invalid id; `404` missing; otherwise 500. |
| `PATCH /api/admin/users/:id/suspend` | ADMIN | Path `id`; no body | `200 { message, user }`; landlord suspension also unpublishes their published listings in one transaction | `401`; `403` self-suspension; `404` missing; `400` already suspended; otherwise 500. |
| `PATCH /api/admin/users/:id/reinstate` | ADMIN | Path `id`; no body | `200 { message, user }`; account becomes ACTIVE; listings remain UNPUBLISHED | `401`; `403` self-reinstatement; `404` missing; `400` already active; otherwise 500. |
| `GET /api/admin/verification/pending` | ADMIN | Query: `offset`, `limit` | `200 { documents, total, offset, limit, totalPages }`; oldest pending first, each has user `{ id, email }` and one-hour `viewUrl` | `401`; `403` wrong role; `400` invalid pagination; otherwise 500. |
| `PATCH /api/admin/verification/:documentId/review` | ADMIN | JSON `{ decision: "APPROVE" \| "REJECT", reviewNote?: string }` | `200 { message, document }`; approval also changes user verification state | `401`; `403` wrong role; `400` invalid decision, already-reviewed document; `404` missing; otherwise 500. |

## Existing frontend coverage

The current frontend API wrappers call these implemented endpoint families:

- Auth: register, login, refresh, logout.
- Properties: browse, mine, detail, create, update/status, delete, and images
  read/upload.
- Amenities: list, create/link, and delete.
- Applications: create, mine, incoming, detail, and status update.
- Viewing requests: create, mine, incoming, detail, and status update.
- Verification: landlord upload/list and admin queue/review.
- Admin users: list, suspend, and reinstate.

The current frontend does **not** call `GET /health` or `GET
/api/admin/users/:id`. No other current frontend API wrapper points to an
unmounted backend route. API base configuration is `NEXT_PUBLIC_API_URL`.

The frontend has implemented pages for public property browse/detail,
tenant-submitted applications and viewing requests, landlord listings/inboxes/
verification, and admin users/verification. Its admin overview obtains counts
by making four filtered calls to `GET /api/admin/users`; this is not a
dashboard-statistics API.

### Frontend observations from the Phase 0 review

- Frontend routes group public pages under `(public)` and signed-in pages
  under `(protected)`. The public group supplies the site layout; tenant,
  landlord, and admin layouts enforce their own roles. Shared signed-in detail
  pages use the session guard directly. Login and registration live under
  `app/` because they need no separate layout.
- Public property browse/detail pages are Client Components that fetch in
  effects after hydration. This is functional, but does not provide the
  server-rendered listing content needed for strong public-page SEO.
- API wrappers are split by resource under `apps/frontend/api/`, but share no
  fetch client: token headers, JSON parsing, and error handling are repeated.
  Some response readers use `any`, despite TypeScript strict mode. The auth
  store is a small in-memory Zustand store, but `Role` is declared separately
  in the store and API types.
- In the audited baseline, the shell/session-restore hook and `RequireAuth`
  provided a client-side loading wall. That baseline had no central 401
  refresh-and-retry client; ordinary API calls attached the current token
  directly.
- Forms use native inputs and small local components, without a shared
  validation-schema layer. Several feature pages duplicate fetch/loading/
  error state patterns; `PageHeader`, `Alert`, `Pagination`, `StatusBadge`,
  `EmptyState`, and `Loading` are existing reusable pieces.
- The legacy reference sidebar linked to `/admin/moderation`, `/admin/stats`,
  and `/admin/disputes` without pages or APIs. The new role shell removes
  those unsupported links. The FAQ also says sign-up only creates tenant
  accounts, while the register form offers LANDLORD and the backend accepts
  both TENANT and LANDLORD.
- The workspace context describes Next.js 15, but the owner approved
  preserving the installed Next.js `^16.3.4` baseline for the rewrite.
- `apps/frontend/app/globals.css` now has one Tailwind import and the initial
  UrbanRent theme tokens, but still contains a large legacy reference-theme
  block. The visual migration should replace that block incrementally as
  page slices are rebuilt.

## Backend gaps and frontend references that are not implemented

- **Listing reports and moderation:** `PropertyReport` plus its reason/status
  enums exist only in the Prisma schema. There are no report create/list/review
  routes, controllers, or services. There is no moderation UI or endpoint for
  that flow.
- **Admin statistics:** there is no aggregate dashboard endpoint. The current
  frontend's four calls to the paginated users endpoint can count accounts,
  but cannot supply property/application/activity statistics.
- **Admin statistics and disputes:** there is no statistics page/aggregate
  endpoint. Disputes have no frontend route, schema, or API.
- **Saved properties:** there is no saved/favorites model or endpoint, despite
  the proposed future tenant feature.
- **Profile editing:** there is no profile endpoint; the current profile page
  correctly displays only email/role available in the auth state. The user
  schema has no name, phone, or avatar fields.
- **Property images:** upload and read exist, but there is no image-delete or
  reorder endpoint.
- **Profile and session detail:** there is no endpoint to retrieve a user's
  current profile or verification/account state as a general-purpose account
  resource; verification state is exposed through the landlord documents
  response and admin user list.
- Leases, payments, messaging, and disputes have no implemented models or
  endpoints and must not be represented as working UI.

## Implementation inconsistencies to keep visible

1. The auth controller comments describe `{ refreshToken }` in the refresh and
   logout body, but the implementation reads only the `RefreshToken` cookie.
   Refresh comments also say it returns a user; the actual response returns
   only `accessToken`.
2. The frontend decodes `userId`, `email`, and `role` from the newly returned
   access-token payload during session restoration because refresh has no user
   envelope. This decoded value is for UI state only; backend authorization is
   still based on server-side token verification.
3. Property create/update/delete, image upload, and amenity writes do not have
   explicit route-level landlord role gates. They rely on authentication and,
   depending on the service, resource ownership. A tenant can therefore reach
   some owner-oriented handlers; the backend should clarify intended role
   policy before frontend code assumes landlord-only authorization.
4. `GET /api/properties/mine`, `/api/applications/incoming`, and
   `/api/viewing-requests/incoming` allow ADMIN at the route but scope results
   to the ADMIN's own user ID/properties rather than platform-wide data.
5. Registration has no request schema/field validation at the route. Invalid
   roles or missing/invalid fields can surface as 500 instead of a consistent
   400 validation response. Property filter parsing silently ignores unknown
   `propertyType` values; amenity duplicate and missing-resource failures may
   also become 500s.
6. Response envelopes vary: property lists and admin lists are bare
   pagination objects; detail and write routes often wrap resources under
   `property`, `application`, `request`, `document`, or `user`; amenity listing
   is a bare array; image listing wraps `{ images }`. Error bodies generally
   use `{ message }`, but the final global handler and default 404 can diverge.
7. The controller accepts any string for `confirmedTime` and passes it to
   `new Date(...)`; invalid date input is not explicitly rejected before the
   repository operation.
8. Verification approval of a single document sets the landlord to VERIFIED.
   The schema commentary describes required-document aggregation, but the
   service does not enforce a required set of document types.
9. The code reads `SUPABASE_SERIVICE_ROLE_KEY` (misspelled) and
   `.env.example` explicitly documents that spelling. Treat it as the actual
   configuration key unless the backend contract is intentionally changed.
