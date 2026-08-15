# NAV Public Platform

Public NAV company website, Classroom, and NAV Coach gateway.

## Architecture boundary

- This repository is public and must not contain NAV Coach secrets or private coaching records.
- Authenticated coaching remains in `NAV-coach-App`.
- Current production-safe public implementation is dependency-free static HTML/CSS.
- The permanent root domain can later point here; NAV Coach should move to the `app.` subdomain only after DNS/HTTPS and auth callback migration are separately verified.

## Local check

Serve the repository root with any static server, for example `python3 -m http.server 8000`, then inspect phone and desktop widths.
