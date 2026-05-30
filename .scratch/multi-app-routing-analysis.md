# Multi-App Routing: Current State & Namespaced Mount Proposal

## Current Architecture

**Hudson** uses two routing modes today:

1. **Single-app page** — `/app/[appId]` resolves via `registry.ts → getAppById()`, renders one app in AppShell
2. **Workspace canvas** — `/app` renders WorkspaceShell with multiple apps as floating windows or stacked panels

**Preframe standalone** uses a flat catch-all:
- `/` and `/[view]` both render `<AppShell app={catalogApp} />`
- `Provider.tsx:456` derives the view from `pathname.replace(/^\//, '')`
- So `/music` → `view = 'music'`, `/queue` → `view = 'queue'`, etc.

**The problem:** When preframe runs inside hudson at `/app/preframe-catalog`, the catalog's `usePathname()` returns `/app/preframe-catalog`, not `/music`. The view derivation breaks. And `/music` at the hudson root 404s because hudson doesn't have a catch-all for it.

## What's Needed: Namespaced Mounts

Each HudsonApp should own a route prefix. When mounted in the shell, the app's internal routing should be relative to its mount point.

### Option A: basePath on HudsonApp (recommended)

```ts
// In HudsonApp type
interface HudsonApp {
  id: string;
  basePath?: string; // e.g. '/preframe', '/logo-studio'
  // ...
}
```

- AppShell/WorkspaceShell sets this as context
- Apps use a `useAppPathname()` hook that strips the basePath prefix
- `setView()` pushes to `${basePath}/${view}` instead of `/${view}`
- Hudson's Next.js routes: `/app/[appId]/[[...slug]]/page.tsx` — the `slug` is the app-internal path

**Preframe changes:**
- `Provider.tsx:456` becomes: `const view = appPathname === '/' ? null : appPathname.replace(/^\//, '')`
- Uses `useAppPathname()` from hudsonkit instead of Next.js `usePathname()`

### Option B: Search-param routing (simpler, less clean)

Keep all views as query params: `/app/preframe-catalog?view=music`
- No Next.js route changes needed
- Feels hacky, breaks browser back/forward expectations

### Option C: App-internal hash routing

`/app/preframe-catalog#music` — app reads `window.location.hash`
- Zero Next.js involvement
- Poor SSR story, no deep-linking from server

## Recommendation

**Option A** with a `[[...slug]]` catch-all under `/app/[appId]/`. This gives:
- `/app/preframe-catalog/music` — preframe's music view
- `/app/preframe-catalog/queue` — preframe's queue view  
- `/app/logo-studio/create` — logo studio's create flow
- Apps stay unaware of their mount point via `useAppPathname()`

## Who Owns What

| Change | Owner |
|---|---|
| Add `basePath` to HudsonApp type | hudsonkit |
| Add `useAppPathname()` / `useAppRouter()` hooks | hudsonkit |
| Add `[[...slug]]` route under `/app/[appId]/` | @hudson-app-router |
| Replace `usePathname()` with `useAppPathname()` in Provider | preframe |
