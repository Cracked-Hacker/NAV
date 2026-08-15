# NAV Public Platform

Public NAV company website, Classroom, and NAV Coach gateway.

## Architecture boundary

- This repository is public and must not contain NAV Coach secrets or private coaching records.
- Authenticated coaching remains in `NAV-coach-App`.
- Current production-safe public implementation is dependency-free static HTML/CSS.
- The permanent root domain can later point here; NAV Coach should move to the `app.` subdomain only after DNS/HTTPS and auth callback migration are separately verified.

## Release gate

Run `node scripts/validate-site.mjs` before publishing. The same dependency-free check runs on pull requests and again inside the GitHub Pages production deployment before any new artifact is uploaded.

The gate protects required public routes, internal links, one-H1 page structure, viewport/title metadata, reduced-motion/focus/safe-area CSS, and rejects placeholder content plus localhost/127.0.0.1 production references.

## Local check

Serve the repository root with any static server, for example `python3 -m http.server 8000`, then inspect phone and desktop widths.
