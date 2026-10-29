# NAV Public Platform

Public NAV company website, Classroom, and NAV Coach gateway.

## Architecture boundary

- This repository is public and must not contain NAV Coach secrets or private coaching records.
- Authenticated coaching remains in `NAV-coach-App`.
- Marketing pages remain static HTML/CSS. My NAV uses the pinned official Supabase browser SDK with the existing NAV identity backend; the website does not store passwords or create a separate user system.
- The permanent root domain can later point here; NAV Coach should move to the `app.` subdomain only after DNS/HTTPS and auth callback migration are separately verified.

## Release gate

Run `npm ci --ignore-scripts`, `npm run verify`, `npm audit --audit-level=high`, and `npm run build` before publishing. Existing public-site checks and account runtime tests are configured for pull requests, GitHub Pages production deployment, and the existing Netlify build through `netlify.toml`. Only `.site-build/` public assets are uploaded on either host.

The gate protects required public routes, internal links, one-H1 page structure, viewport/title metadata, reduced-motion/focus/safe-area CSS, and rejects placeholder content plus localhost/127.0.0.1 production references.

## Local check

Serve the repository root with any static server, for example `python3 -m http.server 8000`, then inspect phone and desktop widths.

## My NAV

See [the unified account contract](docs/NAV_ACCOUNT_CONTRACT.md) for canonical identity, existing data sources, security boundaries, recovery behavior, deployment dependencies, and required production verification. The signup transport source lives in `supabase/functions/nav-account-entry/` and must be deployed to the same existing NAV Supabase project before enabling website signup in production.
