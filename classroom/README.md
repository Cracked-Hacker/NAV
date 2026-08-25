# NAV Classroom

NAV Classroom is the public learning surface for NAV's exercise-science education. It is intentionally separate from private coaching data and authenticated instructor publishing controls.

## Student surfaces

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