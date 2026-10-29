# Unified NAV account contract

The public website, NAV Coach, and Classroom remain separate product surfaces. The website member hub is **My NAV**. Account creation and login use the existing NAV Supabase Auth project; no website user database, password store, or email-based ownership mapping is introduced.

## Canonical relationships

| Concept | Existing canonical source | Website behavior |
| --- | --- | --- |
| Identity | Supabase Auth `user.id` | Validate with `auth.getUser`; retain immutable UUID |
| Profile | `profiles.id = auth user.id` | Read only name/phone/ID; update only name and phone |
| Roles | `platform_user_roles.user_id` | Show active capabilities; never self-grant roles |
| Coaching | `coach_client_relationships` and `get_my_coach_connections()` | Show authorized relationship state; launch the separate app |
| Subscription | `subscriptions.user_id` | Show recorded status; never infer training access or lock out |
| Invoices | `billing_invoices.client_id` | Show the user's non-draft invoices; launch canonical billing details |
| Learning | Currently device-local | Launch public Classroom; explicitly identify device-local progress |
| Credentials / general orders | No deployed account-backed source found | Do not invent status, records, or empty dashboard cards |

Email can change without changing identity. Browser metadata, a selected persona, a navigation link, and a subscription status never grant permissions. All protected reads/writes remain subject to the existing database RLS and column grants.

## Signup transport

The static website calls `nav-account-entry`, a small same-project Edge Function transport. It forwards an explicit whitelist into the existing `secure-signup` function. The existing signup authorization ledger, breach checks, minimum password requirements, duplicate handling, Auth trigger, and email verification remain canonical.

The transport accepts only the exact existing GitHub Pages and Netlify website origins and the explicitly reviewed PR #15 preview origin. It bounds request bodies, uses a fixed upstream URL, never uses a service-role key, suppresses upstream session data, and returns generic results. Arbitrary preview subdomains are not allowed. Origin checks constrain browser exposure; they are not a replacement for the canonical signup authorization or user authorization.

New website members enter the existing minimum-capability `client` signup path without a mandatory persona selector. This does not request coach/admin privileges, create a coaching relationship, activate a subscription, or permanently restrict the person to a client identity. Existing dual-role records remain unchanged. Coach capability approval continues through the existing controlled app workflow.

## Sessions and security

- Website sessions use the official, locally vendored, pinned Supabase JS SDK and the browser storage key `nav-website-auth-v1`.
- An app session and website session can authenticate the same UUID independently. Tokens and passwords are never placed in cross-product links.
- Public navigation loads the SDK only when a website session may exist. Marketing pages remain usable if account recovery fails.
- The member hub distinguishes confirmed signout from transient verification errors; private views are cleared on signout, account replacement, and page hiding.
- Profile writes verify the returned persisted row and preserve input on failure. Email changes require current-password reauthentication and provider confirmation.
- Email verification, email-change confirmation, and password resets intentionally retain the existing allowlisted NAV Coach callback. Recovery pages explain this handoff. No new redirect allowlist or cross-domain token handoff is assumed.
- Website logout ends the website session. Other product sessions may remain active.
- Account pages are noindex and use a restrictive CSP and no-referrer policy. Public deployment packaging excludes server source, tests, documentation, and development dependencies.

## Release and verification

Run `npm ci --ignore-scripts`, `npm run verify`, `npm audit --audit-level=high`, `npm run build`, and `git diff --check`. Existing public route/content gates remain intact. The account tests execute frontend behavior with synthetic SDK/database fixtures and execute the actual signup transport with controlled requests. They do not prove real email delivery or authenticated production behavior.

Before calling the entire directive complete, obtain production evidence for website signup → actual verification email → website login → same account in NAV Coach; existing-user login; persisted profile change and reload; dual-role app access; email/password recovery including expired links; ordinary-user data isolation; and real-device behavior. Do not change an existing user's password or manufacture consent to obtain test evidence.

Future account-linked learning, enrollment, certification, order, preference, and public professional-profile records must reference the same UUID, have appropriate authorization, and preserve completion/credential/payment distinctions. Device-local progress must not be silently promoted to a credential or attached to whichever person logs in next.

## Recovery

No user or schema migration is required by this initial hub. Reverting the website change removes its entry points without deleting users, records, app sessions, roles, or relationships. The transport can be disabled independently if needed; it owns no persistent account data. The separate coaching app is not rebuilt or replaced by this work.
