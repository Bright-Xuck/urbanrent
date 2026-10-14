# UrbanRent frontend

Next.js App Router frontend for the UrbanRent rental platform. It calls the
Express backend directly through `NEXT_PUBLIC_API_URL`.

## Run it

Install dependencies from the repository root, then run:

```bash
pnpm --filter @urbanrent/frontend dev
```

Set `NEXT_PUBLIC_API_URL` to the backend URL including `/api`, for example
`http://localhost:5000/api`. The backend must be running for API-backed pages.

## Google sign-in

Create a Google OAuth **Web application** client ID in Google Cloud Console and
add the frontend origins that will show the Google button (for local
development, `http://localhost:3000`; add the deployed frontend origin too).
Use the same client ID for `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in this app and
`GOOGLE_CLIENT_ID` on the backend. The backend verifies the ID token's
signature, audience, and verified email before creating or linking an account.
No Google client secret is used by this flow.

Useful checks:

```bash
pnpm --filter @urbanrent/frontend lint
pnpm --filter @urbanrent/frontend exec tsc --noEmit
pnpm --filter @urbanrent/frontend build
```

## Routes

- Public: `/`, `/properties`, `/property/[id]`, `/about-us`, `/contact-us`,
  `/faqs`, `/term-conditions`
- Authentication: `/login`, `/register`
- Tenant: `/tenant`, `/tenant/applications`, `/tenant/viewings`
- Landlord: `/landlord`, `/landlord/properties`,
  `/landlord/properties/new`, `/landlord/properties/[id]/edit`,
  `/landlord/applications`, `/landlord/viewings`,
  `/landlord/verification`
- Admin: `/admin`, `/admin/users`, `/admin/verification`
- Shared signed-in pages: `/applications/[id]`, `/viewings/[id]`, `/profile`

The public route group applies the site shell. Tenant, landlord, and admin
layouts check the signed-in role before showing their pages. Resource-detail
pages rely on the backend's access checks and display API errors. See
[`../../docs/FRONTEND_ARCHITECTURE.md`](../../docs/FRONTEND_ARCHITECTURE.md)
for the auth flow and code placement conventions. The backend API contract
and known gaps are listed in
[`../../docs/BACKEND_API_MAP.md`](../../docs/BACKEND_API_MAP.md).
