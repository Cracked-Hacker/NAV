# NAV Public Website — 100-criterion Competitive Content and UX Audit

**Date:** 2026-11-09. **Carrier:** draft PR #16, `Cracked-Hacker/NAV` branch `fix/netlify-account-gateway-coach-nate-20261109`. **Owner's target:** Netlify public site, Vercel NAV Coach app.

## Methodology and evidence integrity

This is a **100-criterion website/source audit**, not a claim that 100 independent competitor websites were fully tested or that the same audit was repeated 100 times. Review combines accessible official reference websites, Nielsen Norman Group homepage guidelines, and NAV public-site source inspection. 'Pass in reviewed source' is not proof of live deployment or completion of browser/assistive technology testing. A failed criterion may be an omitted product asset rather than a code defect. Ratings are qualitative checklist judgments, not measured conversion outcomes.

Sources inspected for patterns:
- TrainHeroic: https://www.trainheroic.com/ — coach-first outcomes, real subscription/onboarding explanation.
- ABC Trainerize: https://www.trainerize.com/ — concrete features, real product categories, audience fit and pricing information.
- Future: https://future.co/ — personal coaching customer journey and actual price.
- Science for Sport: https://cscca.scienceforsport.com/ — educational programs, instructor identity and course offerings.
- Stanford Neuromuscular Biomechanics Lab: https://nmbl.stanford.edu/ — specific scientific projects and publications.
- Stanford Soft Tissue Biomechanics Lab: https://stbl.stanford.edu/current-research — specific research rather than generic science branding.
- NSCA: https://www.nsca.com/certification/continuing-education/ — structured education and credential disclosures.
- Nielsen Norman Group: https://www.nngroup.com/articles/homepage-design-principles/ — clarity, concrete examples, precise labels, simplification.

**Audit status counts (source-level only):** 78 assessed pass, 6 missing, 16 needs verification. These numbers are not a Lighthouse score and are not claims of production quality.

## Defects found and action

1. **Repeat/AI-sounding philosophy:** the old homepage, About and NAV Coach pages explained the same principles three times. PR #16 changes those sections into examples and concrete tasks. The detailed principles remain where they serve a technical/education purpose.
2. **Vague marketing CTAs:** first-level coaching links were less literal than needed. PR #16 emphasizes real coaching inquiry steps, app entry and Classroom.
3. **Lack of visual evidence:** no source-backed production screenshots or real photos were added. These must use owner-approved authentic assets and must not contain real client details without permission.
4. **Coach Nate science material:** public résumé and DOI link are present, but the poster, headshot and lab-image captions are not yet published and must be reconciled against original files and usage consent.
5. **Pricing/availability:** the site deliberately does not invent these. Service listings should be linked to actual live, approved offers and terms before public promotion.
6. **Cross-domain account truth:** a static Netlify gateway links to Vercel authenticated forms; it is **not** a fully synchronized member dashboard or independent login system.
7. **Classroom progress:** browser-local public progress should not be described as an authenticated, durable cross-device learning record.
8. **Visual/technical gates:** Netlify preview status and source checks do not prove screenshots, keyboard operability, contrast, screen reader or actual end-to-end signup.

## 100 criteria

### 1. Positioning

| # | Criterion | Source-review status |
|---:|---|---|
| 1 | Identify offering within five seconds | Pass in reviewed source |
| 2 | Name clients and coaches distinctly | Pass in reviewed source |
| 3 | Explain coaching service concretely | Pass in reviewed source |
| 4 | Explain the private app concretely | Pass in reviewed source |
| 5 | Explain Classroom concretely | Pass in reviewed source |
| 6 | State what is available today | Pass in reviewed source |
| 7 | Distinguish in-development features | Pass in reviewed source |
| 8 | Avoid empty value slogans | Pass in reviewed source |
| 9 | Use the visitor's vocabulary | Pass in reviewed source |
| 10 | Keep founder story factual | Pass in reviewed source |

### 2. Navigation

| # | Criterion | Source-review status |
|---:|---|---|
| 11 | Home link from every root page | Pass in reviewed source |
| 12 | Site logo returns home | Pass in reviewed source |
| 13 | Coaching within one click | Pass in reviewed source |
| 14 | App within one click | Pass in reviewed source |
| 15 | Classroom within one click | Pass in reviewed source |
| 16 | Founder within one click | Pass in reviewed source |
| 17 | Sign in visible on desktop | Pass in reviewed source |
| 18 | Create account visible on desktop | Pass in reviewed source |
| 19 | Mobile navigation exposes account | Pass in reviewed source |
| 20 | Descriptive link labels | Pass in reviewed source |

### 3. Conversion

| # | Criterion | Source-review status |
|---:|---|---|
| 21 | Primary coaching inquiry path | Pass in reviewed source |
| 22 | Service fit and scope explicit | Pass in reviewed source |
| 23 | Inquiry steps shown | Pass in reviewed source |
| 24 | No surprise required purchase | Pass in reviewed source |
| 25 | Pricing not fabricated | Pass in reviewed source |
| 26 | Service availability not fabricated | Pass in reviewed source |
| 27 | Actual terms not implied | Not independently verified |
| 28 | Business contact easy to find | Pass in reviewed source |
| 29 | Returning user path prioritized | Pass in reviewed source |
| 30 | CTA does what label says | Not independently verified |

### 4. Product trust

| # | Criterion | Source-review status |
|---:|---|---|
| 31 | Actual product screenshots | Missing / needs implementation |
| 32 | Authenticated link goes to real app | Pass in reviewed source |
| 33 | Client signup deep link | Pass in reviewed source |
| 34 | Coach signup deep link | Pass in reviewed source |
| 35 | Password reset deep link | Pass in reviewed source |
| 36 | No static-site password collection | Pass in reviewed source |
| 37 | No invented customer totals | Pass in reviewed source |
| 38 | No fictional testimonials | Pass in reviewed source |
| 39 | Clear future-feature status | Pass in reviewed source |
| 40 | Protect client data in examples | Pass in reviewed source |

### 5. Research and people

| # | Criterion | Source-review status |
|---:|---|---|
| 41 | Correct degrees | Pass in reviewed source |
| 42 | Real employer experience | Pass in reviewed source |
| 43 | Work hours sourced and qualified | Pass in reviewed source |
| 44 | Peer-reviewed DOI accessible | Pass in reviewed source |
| 45 | Research areas described | Pass in reviewed source |
| 46 | Research poster available | Missing / needs implementation |
| 47 | Actual headshots used | Missing / needs implementation |
| 48 | No AI image passed off as real | Not independently verified |
| 49 | Clinical scope accurately bounded | Pass in reviewed source |
| 50 | Lab-style research navigation | Missing / needs implementation |

### 6. Education

| # | Criterion | Source-review status |
|---:|---|---|
| 51 | Eight starter lessons discoverable | Pass in reviewed source |
| 52 | Full course distinguished from starter | Pass in reviewed source |
| 53 | Materials reachable | Pass in reviewed source |
| 54 | Assignments reachable | Pass in reviewed source |
| 55 | Quizzes reachable | Pass in reviewed source |
| 56 | Labs reachable | Pass in reviewed source |
| 57 | Course progress scope explained | Pass in reviewed source |
| 58 | No unearned credential claims | Not independently verified |
| 59 | Learning outcomes provided | Pass in reviewed source |
| 60 | Evidence linked from lessons | Not independently verified |

### 7. Content quality

| # | Criterion | Source-review status |
|---:|---|---|
| 61 | No repeated philosophy grid on home | Pass in reviewed source |
| 62 | No duplicate About philosophy grid | Pass in reviewed source |
| 63 | No product principle wall | Pass in reviewed source |
| 64 | No empty AI-superlatives | Pass in reviewed source |
| 65 | Short homepage hero | Pass in reviewed source |
| 66 | Specific example of logged training | Pass in reviewed source |
| 67 | No unverified quantified outcome | Pass in reviewed source |
| 68 | Readable FAQ answers | Pass in reviewed source |
| 69 | No fake certainty | Pass in reviewed source |
| 70 | No redundant final navigation choices | Pass in reviewed source |

### 8. Visual UX

| # | Criterion | Source-review status |
|---:|---|---|
| 71 | Distinct information hierarchy | Pass in reviewed source |
| 72 | Mobile responsive nav breakpoint | Pass in reviewed source |
| 73 | Visible keyboard focus | Pass in reviewed source |
| 74 | Reduced-motion support | Pass in reviewed source |
| 75 | Sufficient tap target sizes | Not independently verified |
| 76 | Real photography in marketing | Missing / needs implementation |
| 77 | Screenshots of app workflow | Missing / needs implementation |
| 78 | Consistent spacing | Not independently verified |
| 79 | Readable contrast at all sizes | Not independently verified |
| 80 | Measured mobile page performance | Not independently verified |

### 9. Search and accessibility

| # | Criterion | Source-review status |
|---:|---|---|
| 81 | Netlify canonical URL | Pass in reviewed source |
| 82 | Netlify sitemap | Pass in reviewed source |
| 83 | Robots points to same sitemap | Pass in reviewed source |
| 84 | Meaningful meta descriptions | Pass in reviewed source |
| 85 | Unique page titles | Pass in reviewed source |
| 86 | Single H1 each page | Pass in reviewed source |
| 87 | Alt text for real images | Not independently verified |
| 88 | No deceptive schema claims | Not independently verified |
| 89 | Keyboard tested on devices | Not independently verified |
| 90 | Screen reader path tested | Not independently verified |

### 10. Quality and operations

| # | Criterion | Source-review status |
|---:|---|---|
| 91 | No secret on public site | Pass in reviewed source |
| 92 | No fake checkout code | Pass in reviewed source |
| 93 | Safe third-party form path | Pass in reviewed source |
| 94 | Static internal links checked | Pass in reviewed source |
| 95 | Existing validator maintained | Pass in reviewed source |
| 96 | No unapproved Netlify prod push | Pass in reviewed source |
| 97 | No Vercel public site replacement | Pass in reviewed source |
| 98 | PR checks passing | Not independently verified |
| 99 | Preview browser tested | Not independently verified |
| 100 | Production verified after merge | Not independently verified |

## Release decision

Do not merge or claim production until: protected source tests pass; actual Netlify deploy preview is browser-reviewed at phone and desktop widths; account deep links work; no login form is embedded on static pages; and authentic visual assets are reviewed for privacy/copyright. Keep public website on Netlify and app on Vercel. No spending or paid dependencies authorized.
