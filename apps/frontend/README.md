# UrbanRent — frontend (visual mockup only)

Static Next.js (App Router) + Tailwind v4 pages. **No logic, no state
management, no API calls, no data fetching.** Every page is plain
JSX with hardcoded example content — this is a visual scaffold to
build the real thing on top of, not a working app yet.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## What's here

| Route | Page |
|---|---|
| `/` | Public property browse (marketplace) |
| `/property/[id]` | Property detail |
| `/login` | Log in |
| `/register` | Register, with role selection |
| `/dashboard` | Landlord's "my properties" |
| `/dashboard/properties/new` | Create/edit property form |
| `/applications` | Applications list |
| `/viewings` | Viewing requests list |

## What's deliberately NOT here yet

- Zustand / any state management
- Form validation or submit handlers
- Fetching real data from the backend API
- Auth-aware routing / protected pages
- Accessibility pass beyond basic semantics (labels, focus states)
- Loading/empty/error states

These are next — build them yourself on top of this scaffold, same
mentor-review pattern as the backend.

## Design tokens

Defined in `app/globals.css` under `@theme`. Palette, type
(Fraunces + Inter), and the ledger/registry visual language are
documented in the design plan shared alongside this handoff.
