# Hard to Kill Classroom source contract

The public NAV Classroom course is derived from **NAV Human Performance — University-Ready Curriculum v3 (August 2026)** in the owner's connected Google Drive.

## Build rules

- Preserve the 10-week course structure, 10 quizzes, 12 solo-gym labs, and 10 applied assignments.
- Do not add a capstone unless the owner explicitly changes the curriculum.
- Keep completion distinct from mastery.
- Keep every required physical lab solo-capable, normal-gym feasible, and paired with an analytically equivalent non-physical alternative when needed.
- Do not require true 1RM testing, forced repetitions, unsafe failure testing, or specialized research equipment.
- Physical performance does not determine the grade.
- Keep the evidence hierarchy explicit: longitudinal outcome evidence outranks acute biomarkers for long-term programming claims.
- Distinguish direct evidence, mechanistic explanation, inference, uncertainty, and unsupported claims.
- Maintain the course reasoning loop: Assess → Explain → Prescribe → Monitor → Adjust → Refer.
- Public/NAV commercial delivery must not imply university endorsement or accreditation.
- The source curriculum remains authoritative for course outcomes, weekly sequence, assessment structure, and university-format workload unless the owner explicitly approves a revision.

## Current web architecture

- `lms-data.js` is the canonical public course/activity map.
- `week-data.js` contains the detailed week-level instructional layer.
- `course/week-N/index.html` provides stable student-facing week URLs.
- `week.js` renders weekly lessons and reuses the existing `nav-classroom-full-course-v1` local activity state.
- `syllabus.html` presents the public course record and scope language.
- `scripts/validate-site.mjs` is the release gate protecting these contracts.