# Deferred tasks and missing backend modules

## Deferred items from the owner's checklist

| Item | Source status | Evidence-based status | Notes |
|---|---|---|---|
| Custom error classes | Deferred | **Not Started** | No domain error class hierarchy was found. |
| Error handler returning 400 for everything | Deferred | **Present as a bug** | The final unhandled-error middleware in [`app.ts`](../../apps/backend/src/app.ts) maps every non-Multer error it receives to 400 and returns its message. Several controllers pre-handle errors, so not every thrown service error reaches this path. |
| Refresh token reuse detection | Deferred | **Not Started** | Current refresh keeps the existing refresh token/session; no rotation, family tracking, or reuse response. |
| Row-lock concurrency exercise in viewing confirmation | Deferred | **Implementation present; exercise unverified** | [`confirmViewingWithoutConflicts`](../../apps/backend/src/repositories/viewingRequestRepository.ts) uses `$transaction` and `SELECT ... FOR UPDATE` on the landlord row, then re-reads, checks confirmed time conflicts, and updates. No concurrent test exists. |
| RBAC factory after the third near-duplicate middleware | Deferred | **Not Started** | [`RBAC.ts`](../../apps/backend/src/middleware/RBAC.ts) still has four individual role-specific functions; combined helper is named `requireLandordadmin`. |
| `RealPress` page title → UrbanRent | Deferred | **Already reflected in current source** | Root metadata and auth branding say UrbanRent. Current `RealPress` references found are styling comments in `globals.css`, not a page title. |

## Missing backend product modules

The current Prisma schema contains ten implemented models: `User`, `Session`, `Property`, `Amenity`, `PropertyAmenity`, `PropertyImage`, `Application`, `ViewingRequest`, `VerificationDocument`, and `PropertyReport`. There are no corresponding route/controller/service/repository paths for the following checklist modules:

| Module | Status | What is absent in inspected source |
|---|---|---|
| Leases | **Not Started** | No lease model/state machine, API routes, controller, service, or repository. |
| Rent schedule | **Not Started** | No schedule model, due-date/overdue process, or API module. |
| Caution fee | **Not Started as a separate module** | `Property.cautionFee` exists as a listing amount, but no lease-level collection/holding/refund/application workflow or separate caution-fee entity exists. |
| Payments (MTN MoMo / Orange Money) | **Not Started** | No payment intent/payment/transaction/refund records, provider integration, webhook verification/idempotency, or payment API. |
| Messaging | **Not Started** | No conversation/membership/message schema or message API; no Socket.IO implementation. |
| Notifications | **Not Started** | No notification schema, delivery service, polling endpoint, or realtime events. |
| Audit logs | **Not Started** | No append-only audit model/service or mutation audit workflow. |
| Disputes | **Not Started** | No dispute schema or workflow. |

## Additional conceptual ERD items not implemented

[`ERD.md`](../../ERD.md) is a broader design reference than the live Prisma schema. The current schema also does not contain separate models for `Favorite`, `Review`, `ApplicationDocument`, `LeaseParty`, `LeaseDocument`, `PaymentIntent`, `Payment`, `Transaction`, `Refund`, `WebhookEvent`, `Conversation`, `ConversationMember`, `Message`, or `Notification`. Some conceptual entities depend on the missing product modules above. The audit does not treat an ERD diagram/table name as an implementation.

The Prisma `Property.cautionFee` scalar does not satisfy the separate caution-fee model described in the ERD. Likewise, existing application/viewing status fields are not substitutes for a lease or payment lifecycle.

## Other not-started checklist work

- **Refresh session hardening:** rotate refresh tokens and implement reuse detection; consider defining revocation behavior for account suspension and other security events.
- **Validation:** establish server-side request schemas and consistent validation/error responses; do not rely on browser-only constraints.
- **Security headers:** add a reviewed security-header policy (Helmet was explicitly in the checklist).
- **Error model:** use typed application errors and map them centrally without returning unexpected internal exception messages.
- **Testing:** add focused service/repository/controller tests and API-level tests for auth, authorization/ownership, status transitions, storage cleanup, and transactional/concurrent operations.
- **Formal security review:** OWASP-oriented threat/control assessment and runtime testing remain separate deliverables.
- **Accessibility:** complete a keyboard/screen-reader/contrast/forms pass and retain its findings.
- **MongoDB/GraphQL comparison:** the ERD excludes MongoDB from live architecture; a separate comparison deliverable was not found.
- **shadcn/ui:** present UI is a bespoke component set; no shadcn installation or generated component inventory was found.

## Operational/deployment follow-up

- Reconcile Node `24.x` in package engines with Node `22` in [`render.yaml`](../../render.yaml).
- Verify whether Render's `npm install` command is intentionally used in this pnpm workspace, and make dependency installation reproducible.
- Confirm required environment variables and external PostgreSQL/Redis/Supabase connectivity in a safe deployment environment. This audit did not inspect `.env` contents or connect to external services.
- Verify deployed cross-site refresh cookie behavior with the configured frontend/backend origins, `Secure`, and `SameSite` policy. The code configures it; browser behavior was not tested.
- Keep runtime configuration and generated API documentation aligned with actual endpoints.

## Ownership and completeness boundary

This document distinguishes code presence from personal understanding. The user specifically reports AI assistance for API integration and validation. Repository artifacts do not identify authorship, so future maintainers should verify they can explain the direct-fetch wrappers, token bootstrap, browser-native form constraints, and server-side checks rather than interpreting source presence as proof of hands-on practice.
