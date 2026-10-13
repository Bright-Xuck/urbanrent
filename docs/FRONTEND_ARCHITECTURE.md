# UrbanRent frontend

The frontend is a Next.js App Router app that calls the Express backend
directly. The backend defines the available data and permissions; do not add
frontend workflows for endpoints that do not exist. See
[BACKEND_API_MAP.md](./BACKEND_API_MAP.md) for the API contract.

## Routes

```text
app/
  (public)/                  Public navbar and footer
    page.tsx                  /
    properties/               /properties
    property/[id]/            /property/:id
    about-us/, contact-us/, faqs/, term-conditions/
  login/, register/           Sign-in and account creation
  tenant/                     Tenant layout and pages
  landlord/                   Landlord layout and pages
  admin/                      Admin layout and pages
  applications/[id]/          Shared application detail
  viewings/[id]/               Shared viewing detail
  profile/                     Shared account summary
```

The `(public)` group is the only route group because it gives public pages a
different layout without changing their URLs. Role folders are ordinary URL
folders with their own layout and navigation. The profile is one shared URL,
not three copies under each role. Old entry paths are redirected in
`apps/frontend/next.config.mjs`.

## Where code goes

- `app/` holds routes and layouts. Keep pages focused on rendering the view.
- `api/` holds one wrapper per backend resource and the backend's shared
  TypeScript types and enums.
- `components/ui/` holds reusable display controls; `components/layout/` holds
  the public navigation and signed-in role shell.
- `Store/useUserStore.ts` holds the signed-in user and access token in memory.
- `lib/` holds the API request helper and small formatting helpers.

Prefer an existing file or component before creating another layer. Add a
dependency only when it removes more complexity than it adds. Keep backend
field names, enum values, and response shapes accurate.

## Data loading

The app uses client-side fetching with `useEffect` and the resource wrappers.
This is straightforward for the current authenticated dashboards because the
access token exists only in browser memory. Public property pages also fetch
in the browser today, which is simpler but gives up some server-rendered SEO
and initial listing content. If SEO becomes a priority, migrate only those
public reads to server components; keep authenticated reads in the browser.

Each data view should show its loading, error, and empty states. Use the
existing API wrappers and UI controls instead of adding a data-fetching
library for simple requests.

## Authentication

The backend sets an `httpOnly` refresh cookie and returns a short-lived
access token. The browser keeps that access token only in the Zustand store;
it is never written to local storage. Next.js middleware cannot read the
backend-domain cookie, so it cannot reliably guard these routes. Frontend
checks are for navigation only: the backend still enforces every permission.

On page load, `AuthBootstrap` calls the refresh endpoint. The store's
`initialized` boolean lets public navigation wait until that first check is
done, and lets a role layout avoid showing protected content during the
check. The refresh response contains no user object, so the client reads the
minimal user ID, email, and role from the returned access-token claims. Those
claims are used for display/navigation only, not as authorization proof.

### Request, refresh, and retry

1. A resource wrapper calls `apiFetch`; it adds the current in-memory bearer
   token and includes browser credentials.
2. If the backend replies `401`, the helper sends one refresh request using
   the cookie. Concurrent `401` responses share the same refresh request.
3. The helper reads the user details from the new token and updates the store.
4. It retries the original request once. A second `401` clears the local
   session; the page handles the returned response as an API error.
5. Login, registration, refresh, and logout use direct `fetch` calls so their
   own `401` responses do not start another refresh.

Logout clears the local session even if the backend request fails. In that
case the page reports that server-side logout was not confirmed.

The deployed frontend and backend have different domains. Cross-site refresh
cookies require compatible `SameSite` and `Secure` settings; the backend
currently defaults `COOKIE_SAMESITE` to `lax`. Verify the deployed cookie
behavior rather than trying to work around it in frontend code.

## UI conventions

Tailwind v4 design tokens and global styles live in `app/globals.css`.
Prefer semantic HTML, visible focus styles, labeled controls, and keyboard
operable navigation. Use the existing image aspect ratios and loading
behavior; avoid adding large client-side libraries for small interactions.
