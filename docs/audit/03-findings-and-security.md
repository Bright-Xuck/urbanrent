# Findings, bugs, and security gaps

This is a static implementation review, not a penetration test. Priorities indicate what should be understood or addressed first; they are not exploitability ratings. Findings refer to the checked-in source. The deployment's secret values and live services were not inspected or exercised.

## High-priority implementation discrepancies

### 1. Later 401 responses do not trigger the documented refresh/retry

**Evidence:** [`AuthBootstrap.tsx`](../../apps/frontend/components/auth/AuthBootstrap.tsx) restores a session once during initial mount. Resource wrappers such as [`propertyApi.ts`](../../apps/frontend/api/propertyApi.ts) and [`applicationApi.ts`](../../apps/frontend/api/applicationApi.ts) call `fetch` directly and throw when `response.ok` is false. A frontend-wide search found no `apiFetch`, 401 branch, shared refresh promise, or retry path.

**Impact:** The access token expires after 15 minutes. A later API request receives a 401 and is surfaced as an API error; the implementation does not transparently refresh and retry. A page reload/remount may restore the session through the bootstrap, but this is not the documented per-request behavior.

**Documentation discrepancy:** [`FRONTEND_ARCHITECTURE.md`](../FRONTEND_ARCHITECTURE.md) describes a shared `apiFetch` helper, concurrent refresh sharing, one retry, and clearing the store after a second 401. No such helper exists in current source. Treat those instructions as stale until code is changed or the document is corrected.

### 2. Request validation is incomplete and not centralized

**Evidence:** No Zod, Joi, express-validator, class-validator, or equivalent runtime validation library is present. Some controllers manually validate enums, pagination, statuses, and required files; see [`propertyController.ts`](../../apps/backend/src/controllers/propertyController.ts), [`applicationController.ts`](../../apps/backend/src/controllers/applicationController.ts), [`viewingRequestController.ts`](../../apps/backend/src/controllers/viewingRequestController.ts), [`reportController.ts`](../../apps/backend/src/controllers/reportController.ts), and [`verificationController.ts`](../../apps/backend/src/controllers/verificationController.ts). Property create/update largely forward body values into service/repository paths. Register forwards the body role/password without comprehensive server-side schema or password-policy validation; the registration page's `minLength={8}` is browser-side only.

**Impact:** Direct API clients can bypass browser constraints. Invalid enum/value types may become generic server failures rather than consistent client validation responses, and business invariants can differ across endpoints.

**Boundary:** This does not mean every endpoint is unvalidated. The code has targeted manual guards, but no comprehensive request schema layer.

### Additional high-priority authorization gap: property writes lack a landlord role gate

**Evidence:** In [`propertyRoutes.ts`](../../apps/backend/src/routes/propertyRoutes.ts), `POST /`, `PATCH /:id`, `DELETE /:id`, and `POST /:id/images` use authentication/suspension middleware but do not use `requireLandlord`. The property service verifies publishing eligibility and owner identity for updates/deletes, but does not reject a `TENANT` role from creating or managing an owned listing. In [`amenityRoutes.ts`](../../apps/backend/src/routes/amenityRoutes.ts), writes likewise have no landlord role middleware; [`assertCanManageAmenities`](../../apps/backend/src/services/amenityService.ts) authorizes any non-admin owner.

**Impact:** An authenticated tenant can create a draft listing and can manage it as its owner (including its images/amenities). Frontend role-specific navigation is not a backend authorization boundary. This is a concrete exception to the otherwise-present role/ownership controls and is why the checklist's overall RBAC item is **Partly Done**.

### 3. Unhandled errors are normalized to 400 and their message is exposed

**Evidence:** The final error middleware in [`app.ts`](../../apps/backend/src/app.ts) returns status 400 and `{ message: err.message ?? "Bad request" }` for every non-Multer error that reaches it. Many controllers catch service failures and return generic 500, but any error escaping those catches reaches this handler.

**Impact:** Server faults can be mislabeled as client errors, and internal error messages can be exposed to callers. Error status and message policy is split between individual controllers and the global fallback.

**Related deferred item:** No custom error classes or centralized error-to-status mapping were found.

## Security configuration and control gaps

### 4. No Helmet/security-header middleware

**Evidence:** [`app.ts`](../../apps/backend/src/app.ts) installs JSON parsing, CORS, cookie parsing, compression, docs, and rate limiting; it does not install Helmet or explicit security-header middleware.

**Impact:** Standard HTTP security headers are not supplied by Helmet. This is distinct from authentication/RBAC, which is present.

### 5. CORS falls back to reflecting any origin when no allowlist is configured

**Evidence:** `app.ts` uses `origin: frontendOrigins && frontendOrigins.length > 0 ? frontendOrigins : true` with `credentials: true`. The code comment calls the permissive fallback local-development behavior, but the branch itself does not check the runtime environment.

**Impact:** If a deployed environment omits `FRONTEND_ORIGIN`, CORS becomes permissive for credentialed requests. The checked-in Render Blueprint defines the variable as `sync: false`; whether it is populated in a live service was not checked.

### 6. Upload MIME type is taken from the multipart header

**Evidence:** [`upload.ts`](../../apps/backend/src/middleware/upload.ts) accepts files by `file.mimetype`, which is supplied as multipart metadata. File size/count caps and allow-lists exist, but no magic-byte/content inspection is present in that middleware/service path.

**Impact:** The allow-list alone does not prove the uploaded bytes are actually an image/PDF. Treat it as type filtering, not content validation.

### 7. Refresh-token reuse detection and rotation are absent

**Evidence:** [`refreshAccessToken`](../../apps/backend/src/services/userService.ts) verifies a supplied refresh JWT and session, then returns a new access token only. It does not issue a replacement refresh token, revoke the old session, or record token-family/reuse state.

**Impact:** A stolen refresh token remains usable until expiry or logout/session revocation. This is an acknowledged deferred item.

## Correctness and business-rule items to verify

### 8. Verification state is set by approval of one document

**Evidence:** [`reviewDocument`](../../apps/backend/src/services/verificationService.ts) sends any approved document to [`approveDocumentAndVerifyUser`](../../apps/backend/src/repositories/verificationRepository.ts), which marks that document approved and sets the user's `verificationState` to `VERIFIED` in one transaction. The schema allows multiple `VerificationDocumentType` values.

**Question for product owner:** If both national ID and proof of ownership are required, current code does not establish that all required document types have been approved before setting the aggregate state. The checklist says a verification gate exists; the actual required-document policy is not explicit enough here to label this a confirmed bug.

### 9. Suspension transaction exists, but no automated verification exists

**Evidence:** [`suspendUserWithCascade`](../../apps/backend/src/repositories/userRepository.ts) updates the account state and unpublishes landlord properties in one transaction. [`confirmViewingWithoutConflicts`](../../apps/backend/src/repositories/viewingRequestRepository.ts) performs the row lock and conflict check in a transaction. [`approveDocumentAndVerifyUser`](../../apps/backend/src/repositories/verificationRepository.ts) is transactional as well.

**Unverified:** There are no tests or scripted concurrent requests demonstrating rollback/locking behavior against PostgreSQL. The code implementation is present; operational correctness under load has not been established.

### 10. Role gate naming/duplication remains

**Evidence:** [`RBAC.ts`](../../apps/backend/src/middleware/RBAC.ts) defines separate `requireTenant`, `requireLandlord`, `requireAdmin`, and `requireLandordadmin` middleware. There is no role-policy factory; the combined helper is misspelled and is repeated across routes.

**Impact:** This is the explicitly deferred refactor, not evidence that route role checks are absent.

## Configuration and delivery risks

### 11. Deployment Node version disagrees with package engine

**Evidence:** [`apps/backend/package.json`](../../apps/backend/package.json) declares Node `24.x`; [`render.yaml`](../../render.yaml) sets `NODE_VERSION` to `22`.

**Impact:** The deployed runtime may not match the package's declared/tested runtime. Build/start compatibility was not verified.

### 12. Render command/package-manager consistency is unverified

**Evidence:** The repository is a pnpm workspace (`pnpm-workspace.yaml` and root `pnpm-lock.yaml`), while `render.yaml` runs `npm install` inside `apps/backend`. There is no backend-specific npm lockfile shown in the source inventory.

**Impact:** Dependency resolution may not be reproducible from the deployment config. This is a configuration risk; no deploy was run to prove a failure.

### 13. Backend startup depends on external service configuration

**Evidence:** [`config/redis.ts`](../../apps/backend/src/config/redis.ts) throws when `REDIS_URL` is absent and connects at module import. [`config/supabase.ts`](../../apps/backend/src/config/supabase.ts) throws if the Supabase URL/service-role variable is absent. [`utils/token.ts`](../../apps/backend/src/utils/token.ts) requires both token secrets. Prisma configuration requires `DATABASE_URL`.

**Impact:** Backend startup requires the relevant environment to be provisioned before importing routes/services. This is intentional fail-fast behavior in code; actual production values/connectivity were not checked. No secret values are reproduced here.

## Tests and verification limits

- Root and backend `test` scripts are placeholders that exit non-zero with “no test specified.”
- No Jest/Supertest or other test files were found in the application source.
- No app build/typecheck, test, deployment, database migration status, live API request, Redis probe, Supabase upload, or browser session was executed for this audit.
- Therefore all “Done” labels refer to code paths present, not tested service behavior.
- A formal OWASP audit, penetration test, dependency vulnerability report, and accessibility evaluation remain outstanding.
