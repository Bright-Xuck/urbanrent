# UrbanRent — frontend

Next.js (App Router) + Tailwind v4 + Zustand. Talks to the Express backend
in `apps/backend` over `NEXT_PUBLIC_API_URL`.

## Run it

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:5000/api`) in `.env`
before starting. The backend must be running for any data to appear.

## Routes

| Route | Page | Backend it uses |
|---|---|---|
| `/` | Landing page + latest listings | `GET /api/properties` |
| `/properties` | Public browse (filters + paging) | `GET /api/properties` |
| `/property/[id]` | Listing detail: photos, amenities, apply, request a viewing, owner controls | `GET /api/properties/:id`, `/images`, amenity routes, `POST /api/properties/:id/applications`, `POST /api/properties/:id/viewing-requests`, `PATCH`/`DELETE /api/properties/:id` |
| `/login` | Log in | `POST /api/auth/login` |
| `/register` | Register (always creates a TENANT) | `POST /api/auth/register` |
| `/dashboard` | Landlord's listings — all statuses | `GET /api/properties/mine` |
| `/dashboard/properties/new` | Create a listing (draft or published) + photos | `POST /api/properties`, `POST /api/properties/:id/images` |
| `/dashboard/properties/[id]/edit` | Edit a listing, photos, publish / archive / delete | `GET`/`PATCH`/`DELETE /api/properties/:id` |
| `/applications` | Tenant's applications | `GET /api/applications/mine` |
| `/applications/[id]` | One application + decision actions | `GET /api/applications/:id`, `PATCH /api/applications/:id/status` |
| `/viewings` | Tenant's viewing requests | `GET /api/viewing-requests/mine` |
| `/viewings/[id]` | One viewing request + landlord actions | `GET /api/viewing-requests/:id`, `PATCH /api/viewing-requests/:id/status` |

`components/layout/SessionBootstrap.tsx` runs once per load: with no access
token in the store it calls `POST /api/auth/refresh` and rebuilds the user
from the new token, so a reload doesn't log you out.

## Known backend limitations this frontend works around

These are backend gaps, not frontend bugs. Each one is called out in the
code where it bites.

- **A landlord can't list what came in.** Both `applicationRoutes` and
  `viewingRequestRoutes` expose only `/mine` (read as the *tenant*) next to a
  status change. So a landlord can decide on a specific application
  (`PATCH /api/applications/:id/status`) or viewing
  (`PATCH /api/viewing-requests/:id/status`) but has no way to discover the
  ids — there is no reader keyed on `property.ownerId`, so `/applications/[id]`
  and `/viewings/[id]` are reachable only by typing the id.
- **Amenity listing is shadowed.** The amenity router is mounted on
  `/api/properties/:propid`, a path the property router already answers with
  `GET /:id`, so the list call returns a single Property instead of an array.
  Adding and removing still work (those verbs aren't shadowed). The list's own
  shape is worth knowing either way: the repository selects `PropertyAmenity`
  join rows with the amenity nested, so names live at `row.amenity.name` and
  DELETE takes `row.amenity.id`. See `api/amenityApi.ts` and
  `components/properties/AmenityPanel.tsx`.
- **The amenity routes have no `authenticate` at all.** Any anonymous caller
  can create or delete amenities — and DELETE removes the shared `amenities`
  row, so removing "WiFi" from one property unlinks it everywhere.
- **Single-listing reads require a token.** `GET /api/properties/:id` and
  `GET /api/properties/:id/images` both run `authenticate`, so
  `/property/[id]` sits behind `<RequireAuth>` even though the browse list is
  public. (The image URLs themselves are public Supabase URLs, so relaxing the
  image read leaks nothing new.)
- **No landlord sign-up, and no way to change a role.** `registerUser`
  hardcodes `Role.TENANT`, and `userRepository` has no update — so the promise
  on `/register` that "an admin can switch you later" isn't reachable through
  the API today, and `/dashboard` needs a direct database edit.
- **Listing creation isn't role-gated, but listing management is.**
  `POST /api/properties` only runs `authenticate`, while
  `GET /api/properties/mine` runs `requireLandordadmin` — so a tenant can
  create a property through the API and then never see it. `requireAdmin` is
  defined in `middleware/RBAC.ts` but no route uses it.
- **No profile endpoint.** The navbar's avatar links to `/my-profile`, which
  does not exist — `authRoutes` has register/login/refresh/logout and no
  `GET /me`.

## Design tokens

Defined in `app/globals.css` under `@theme` — palette, type (Fraunces +
Inter), and the ledger/registry visual language.
