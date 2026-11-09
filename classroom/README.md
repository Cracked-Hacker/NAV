# NAV Classroom authoring and release boundary

**Owner instruction (November 9, 2026): unfinished or untested content is private by default.** The files below are authoring sources, not approved public releases. Because this GitHub repository is public, these existing files and older history may remain accessible through GitHub/Pages; move future unreleased content to private storage.

Netlify packaging publishes only `classroom/public-landing.html` as `classroom/index.html`. Quizzes, answers, course weeks, student records, and learning files are withheld from the Netlify artifact until reviewed and explicitly released. Source-level content validation is not public-release approval.

Account-bound tester codes, course grants, private downloads, and owner publishing controls belong in NAV Coach on Vercel and private Supabase, as tracked in NAV-coach-App issue #668 and this site's issue #22.

## Authoring source surfaces (not publicly approved)

- `index.html` — Classroom overview and Starter Kit
- `course.html` — Hard to Kill course map
- `syllabus.html` — public course record, outcomes, assessment, workload, lab/evidence standards
- `course/week-1/` through `course/week-10/` — detailed weekly learning pages
- `assignments.html` — applied assignment workspace
- `labs.html` — solo-gym lab workspace
- `quizzes.html` — weekly quizzes
- `materials.html` — documents/media/evidence hub
- `progress.html` — browser-local learning activity progress

## Shared course data

- `lms-data.js` — canonical week, quiz, lab, and assignment definitions
- `week-data.js` — detailed week objectives, lesson clusters, examples, scenarios, evidence guidance, spaced return, and CLO mapping
- `classroom.js` — Starter Kit + LMS workspace behavior
- `week.js` — detailed week rendering and canonical full-course progress-state reading
- `workspace-sync.js` — assignment/lab completion badge synchronization

## Boundary

The public site may display published educational content. Uploading, replacing, unpublishing, archiving, deleting, roster management, private submissions, grading, and instructor feedback belong behind authenticated NAV Coach permissions and must not be implemented as an unauthenticated public write surface.