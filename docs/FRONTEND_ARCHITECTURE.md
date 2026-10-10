# UrbanRent frontend architecture

This guide describes the frontend foundation and the conventions for the next
implementation slices. The API contract is documented in
[BACKEND_API_MAP.md](./BACKEND_API_MAP.md); the backend remains authoritative.

## Routes and layouts

Next.js route groups organize layouts without adding names to URLs:

```text
app/
  (public)/                 Public navbar + footer
    page.tsx                /
    properties/page.tsx     /properties
    property/[id]/page.tsx  /property/:id
  (auth)/                   Login and registration
  (protected)/              Signed-in session gate
    tenant/                 Tenant shell and tenant pages
      profile/page.tsx      /tenant/profile
    landlord/               Landlord shell and landlord pages
      profile/page.tsx      /landlord/profile
    admin/                  Admin shell and admin pages
      profile/page.tsx      /admin/profile
    applications/[id]/      Shared application detail
    viewings/[id]/          Shared viewing detail
    profile/page.tsx        Shared account summary
```

Role-specific route prefixes keep tenant and landlord workflows distinct. A
detail route is shared when both parties are allowed to see and act on the same
backend resource. The role shell is defined once in
`components/layout/RoleShell.tsx`; its small navigation map contains only
routes that currently have UI and backend support. Do not add a navigation
entry for an unimplemented API feature.

The former `/dashboard/*`, `/applications`, `/viewings`, and `/my-profile`
entry points are redirected in `next.config.mjs` where a same-role destination
is unambiguous. Resource detail URLs remain shared.

## Where code belongs

- `app/` contains route files and route-group layouts. Pages should compose
  feature components instead of owning data or workflow logic.
- `features/<name>/` contains resource-specific UI, hooks, types, and schemas.
  Keep a resource's API operations next to that feature as it is migrated.
- `api/` currently contains the backend-mirroring resource types and API
  wrappers. Keep each wire resource type in one place; mirror backend enums
  exactly.
- `lib/api-client.ts` owns browser requests, credentials, access-token
  attachment, and refresh/retry behavior. `lib/` also holds domain-neutral
  utilities such as `cn` and formatters.
- `Store/useUserStore.ts` is only the in-memory identity/session store. Never
  persist the access token to local storage, cookies, or session storage.
- `components/ui/` contains reusable primitives; `components/layout/` contains
  cross-feature shells and layout elements.

## Rendering and data flow

Public discovery should be server-rendered so search engines and link previews
receive listing content. Public API reads can use server `fetch` caching and
revalidation once those pages are moved to Server Components. The current
public listing/detail pages are still being migrated and should not be used as
the pattern for new public pages.

Protected pages use client-side API wrappers because their bearer token only
exists in browser memory. Keep page components focused on loading/error/empty
states and move reusable workflow logic into the owning feature. All requests
go directly to `NEXT_PUBLIC_API_URL` (which includes `/api`); there is no
Next.js API proxy.

Use `react-hook-form` with Zod schemas for new multi-field forms when the form
slice adds those dependencies. The schema is the shared source for input
validation and TypeScript inference; field components should expose labels,
descriptions, and errors accessibly.

## Authentication and route protection

The refresh cookie is `httpOnly` and belongs to the backend domain. Vercel's
Next.js middleware cannot read it, so middleware cannot correctly determine
whether a browser has a session. The protected route-group layout instead
waits for the browser bootstrap to finish, then a role layout checks the
in-memory user. This prevents protected content from flashing while refresh
runs. These guards are UX boundaries only; the backend must authorize every
request.

Only the access token is held in Zustand memory. The user record restored from
the token's claims is for navigation and display, not proof of identity.

### Request, refresh, and retry

1. `apiFetch` reads the latest access token from the store and sends it as a
   Bearer token. Browser credentials are included so the backend can receive
   its refresh cookie on auth requests.
2. If a request gets `401`, the client starts one refresh request. Concurrent
   `401`s share that same promise rather than stampeding the refresh endpoint.
3. Refresh reads the backend-domain cookie, receives a new access token, checks
   the token claims for the expected user ID and role, and updates the store.
4. The original request is retried once with that token. A second `401` clears
   the local session and is returned to the caller as an error response.
5. An expired/invalid refresh clears local state. A network/service failure
   produces a protected-route error state with an explicit retry action rather
   than silently pretending the visitor is logged out.

Login, registration, refresh, and logout opt out of automatic 401 refresh so
credential errors cannot accidentally trigger a second auth operation.

On initial load, `AuthBootstrap` starts a refresh while public content remains
renderable. Protected layouts remain in the neutral “restoring session” state
until that request resolves. After a failed network request they show a retry
state; an absent or expired cookie results in the sign-in gate.

## Visual and interaction conventions

Tailwind v4 tokens live in `app/globals.css`; `font-sans` uses Inter for
readability and `font-display` uses Fraunces for editorial headings. Deep navy,
warm ochre, and quiet neutral surfaces communicate reliability without using
generic dashboard blue as the only identity. Use `cn()` when combining
conditional Tailwind classes.

New data views need explicit loading, error, and empty states. Use semantic
headings, native controls, visible keyboard focus, accessible labels, and
keyboard-operable navigation. Use `next/image` with a known aspect ratio and
appropriate loading priority for listing media. Keep mobile layouts first and
avoid loading large client-only libraries for simple interactions.
