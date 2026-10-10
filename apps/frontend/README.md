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
- Tenant: `/tenant`, `/tenant/applications`, `/tenant/viewings`,
  `/tenant/profile`
- Landlord: `/landlord`, `/landlord/properties`,
  `/landlord/properties/new`, `/landlord/properties/[id]/edit`,
  `/landlord/applications`, `/landlord/viewings`,
  `/landlord/verification`, `/landlord/profile`
- Admin: `/admin`, `/admin/users`, `/admin/verification`, `/admin/profile`
- Shared signed-in details: `/applications/[id]`, `/viewings/[id]`, `/profile`

The public route group applies the site shell. Tenant, landlord, and admin
layouts enforce their respective roles; shared signed-in pages use the session
guard. See
[`../../docs/FRONTEND_ARCHITECTURE.md`](../../docs/FRONTEND_ARCHITECTURE.md)
for the auth flow and code placement conventions. The backend API contract and
known gaps are listed in
[`../../docs/BACKEND_API_MAP.md`](../../docs/BACKEND_API_MAP.md).
