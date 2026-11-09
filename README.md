# NAV Public Platform

Public NAV company website, Classroom, and NAV Coach gateway.

## Architecture boundary

- This repository is public and must not contain NAV Coach secrets or private coaching records.
- Authenticated coaching remains in `NAV-coach-App`.
- Current production-safe public implementation is dependency-free static HTML/CSS.
- The permanent root domain can later point here; NAV Coach should move to the `app.` subdomain only after DNS/HTTPS and auth callback migration are separately verified.

## Public-site hosting and account boundaries

- **Canonical public website:** `https://coach-nate.netlify.app/` (Netlify). The hosting connection, deploy branch, and actual publish commit must be separately verified in Netlify before treating a GitHub PR as a live change.
- GitHub Pages may serve a mirror; its SEO canonical points to the owner-selected Netlify site. Do not replace the Netlify website with a Vercel public-site deployment.
- **Private authenticated NAV Coach:** `https://nav-coach-app-eight.vercel.app/` (Vercel). The public `account.html` page is a secure **gateway**, not its own login database or a cross-domain SSO portal.
- Public account links take users to the app for client/coach registration, sign-in, and password reset. Neither passwords nor payment-card data belong on the static Netlify website.
- `coach-nate.html` and `resume.html` present source-based credentials and self-reported work hours; only genuine user-supplied imagery should be added to this personal profile.

## Release gate

Run `node scripts/validate-site.mjs` before publishing. The same dependency-free check runs on pull requests and again inside the GitHub Pages production deployment before any new artifact is uploaded.

The gate protects required public routes, internal links, one-H1 page structure, viewport/title metadata, reduced-motion/focus/safe-area CSS, and rejects placeholder content plus localhost/127.0.0.1 production references.

## Local check

Serve the repository root with any static server, for example `python3 -m http.server 8000`, then inspect phone and desktop widths.
