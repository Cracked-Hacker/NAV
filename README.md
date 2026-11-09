# NAV Public Platform

Public NAV company website, Classroom, and shared-identity My NAV member hub.

Canonical public host: https://coach-nate.netlify.app/ (Netlify project `coach-nate`, site ID `0be37e53-123c-4019-83e0-8afdea1988a5`). The connected repository is `Cracked-Hacker/NAV`; NAV Coach remains a separate Vercel app.

Use Node 24 for release checks.

## Architecture boundary

- This repository is public and must not contain NAV Coach secrets or private coaching records.
- Authenticated coaching remains in `NAV-coach-App`.
- Marketing pages remain static HTML/CSS. My NAV uses the pinned official Supabase browser SDK with the existing NAV identity backend; the website does not store passwords or create a separate user system.
- The permanent root domain can later point here; NAV Coach should move to the `app.` subdomain only after DNS/HTTPS and auth callback migration are separately verified.

## Release gate

Run `npm ci --ignore-scripts`, `npm run verify`, `npm audit --audit-level=high`, and `npm run build` before publishing. Existing public-site checks and account runtime tests run for pull requests and the existing Netlify build through `netlify.toml`. Netlify publishes only `.site-build/`; the former Pages workflow verifies the canonical Netlify site and no longer publishes a competing website.

The gate protects required public routes, internal links, one-H1 page structure, viewport/title metadata, reduced-motion/focus/safe-area CSS, and rejects placeholder content plus localhost/127.0.0.1 production references.

## Local check

Serve the repository root with any static server, for example `python3 -m http.server 8000`, then inspect phone and desktop widths.

## Reconciled release

PR #16 public content and original research media are retained alongside PR #15’s canonical account implementation. `/account.html` redirects to `/account/`; website Sign In/Create Account use `/account/auth.html`. Product sessions remain separate; this is shared identity, not cross-domain SSO.

## My NAV

See [the unified account contract](docs/NAV_ACCOUNT_CONTRACT.md) for canonical identity, existing data sources, security boundaries, recovery behavior, deployment dependencies, and required production verification. The signup transport source lives in `supabase/functions/nav-account-entry/` and must be deployed to the same existing NAV Supabase project before enabling website signup in production.
