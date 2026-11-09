# NAV Classroom | Education and Competency Quality Audit
Date: 2026-11-09 | Carrier: public website PR #20 | Distinguish this from the NAV Coach App certification PR #624.

## Goal
A learner should be able to explain a concept, use it in a new situation, evaluate evidence, observe and measure exercise safely, design and critique a program, adjust based on real data, communicate with athletes, and recognize when to refer. A quiz score or "completed" badge alone does not demonstrate this.

## Research-based standards
- Retrieval practice improves retention better than passive rereading in many studied contexts: Roediger & Karpicke (2006), doi:10.1111/j.1467-9280.2006.01693.x
- Practice testing and distributed practice are well-supported study strategies: Dunlosky et al. (2013), doi:10.1177/1529100612453266
- Space learning, interleave worked examples with practice, combine visual and verbal explanations: IES What Works Clearinghouse (2007), https://ies.ed.gov/ncee/wwc/PracticeGuide/1
- Align every learning outcome to instruction and to an assessment that actually measures it: Carnegie Mellon Eberly Center, https://www.cmu.edu/teaching/assessment/basics/alignment.html
- A meaningful assignment has a defined purpose, audience, outputs, assessment criteria, and examples: CMU, https://www.cmu.edu/teaching/assessment/assesslearning/creatingassignments.html
- Feedback should reveal and close a gap rather than simply grade it: EEF, https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback
- Multiple ways to interact and demonstrate learning and accessible alternatives matter: CAST UDL 3.0, https://udlguidelines.cast.org/action-expression/

## Competitor-pattern analysis (do not copy their branding or claim identical capabilities)
- Canvas New Quizzes supports multiple item formats, outcome alignment, item banks, feedback, moderation, and reports: https://community.instructure.com/en/kb/articles/662768-what-is-new-quizzes
- Coursera distinguishes ungraded practice from graded work required for certificates; NAV must make the same distinction: https://www.coursera.support/s/article/learner-000001563?language=en_US
- NSCA CSCS independently examines scientific foundations and applied practice, with imagery/video in applied questions: https://www.nsca.com/certification/cscs/certified-strength-and-conditioning-specialist-exam-description/
- These are feature/assessment benchmarks, not claims that NAV offers an equivalent credential.

## Source-backed findings before PR #20
| Area | Current evidence | Verdict | Corrective action |
|---|---|---|---|
| 10-week course map and CLOs | classroom/lms-data.js and week-data.js | Valuable structure | Preserve |
| 10 weekly quizzes | Exactly 1 MCQ/week | Critical failure | **PR #20** eight items/week; 40 objectives covered; 80 public practice items |
| Starter Kit 8 modules | One MCQ/module | Useful as retrieval check, **not a quiz** | Label Quick Check; later add applied prompt + delayed return |
| 10 applied assignments | Good themes, local drafts, one-click "complete" | Weak assessment | **PR #20** four-point written self-review, minimum writing evidence, explicit not graded |
| 12 solo-gym labs | Good observations and alternatives, limited procedural scaffolding | Incomplete | **PR #20** common lab-report self-check scaffold; future calibrated rubrics |
| Weekly lessons | Four brief core lessons plus example, scenario, evidence note | Too condensed for claimed ~12 hours/week | Expand chapters and assigned readings based on source material; time-on-task pilot |
| Progress dashboard | Shows activity completion, based on browser-local status | Confusable with mastery | **PR #20** preserve local practice but relabel self-reports and invalidate legacy one-answer passes |
| Feedback | Immediate one-answer explanation | Insufficient coverage | **PR #20** item-level explanations after submitting all 8 |
| Certification | Authenticated app uses a 25-question client-graded knowledge check; more robust Level 1 PR #624 unmerged | Not sufficient proof of coach capability | Require secure backend, rubric-graded applied work and credential workflow; distinct app release |
| Graduate experience | No verified instructor assessment or supervised practical | Major gap | Require portfolio, observed demonstration, scenario judgment and documented feedback before certification |

## The assessment ladder NAV must build
1. **Diagnostic** (not graded): 15–25 questions/sample cases to identify prerequisite gaps and select a path, never used to reject learners.
2. **Lesson quick check**: one to three retrieval prompts; immediate explanatory feedback; do not call a one-question check a quiz.
3. **Weekly formative quiz**: at least eight well-reviewed items covering each week objective, mixing factual knowledge and application/cases, with feedback and practice opportunities. PR #20 delivers the first iteration; 7 of 8 meets the >=80% practice target, with only browser-local data.
4. **Applied assignment**: a realistic scenario with client goal, constraints, incomplete/conflicting data, deliverables, references, an analytic rubric, exemplar, feedback and resubmission. Self-marking is practice only.
5. **Lab**: question/hypothesis, safe method, equipment/protocol, raw data and units, confounders, analysis, decision, next test, risk/referral boundaries, and nonphysical alternative with equivalent objectives. No fabricated observations. Written work needs human assessment before it counts toward verified competence.
6. **Spaced transfer**: revisit concepts after days/weeks, give unfamiliar cases, require explanation of a mistaken answer. A repeated identical-bank high score is not evidence of durable retention.
7. **Summative exam**: separate secured question bank and blueprint, hidden keys, versioned items, item-analysis and attempt audit. Minimum internal 80% rule, but also pass critical safety/referral domains without uncorrected errors. Define accommodations and retakes in policy.
8. **Observed professional practice**: coaching demonstration, exercise instruction, monitoring/feedback, two distinct case plans and one documented data-analysis lab scored by trained reviewers. Assessors calibrated; critical safety fail requires remediation. Do not award a credential based only on auto-scored theory.
9. **Graduate follow-through**: a voluntary reflective portfolio, 30/90-day confidence and competence checks, real-world practice feedback, and continuing education; distinguish self-confidence from observed skill.

## Proposed case-assessment rubric (0–4 in each domain)
- **Goal and needs analysis:** 0 missing; 1 vague; 2 measurable but incomplete; 3 defensible with constraints; 4 integrates objective, baseline, risk, priorities and uncertainties.
- **Scientific and mechanical reasoning:** 0 absent; 1 unsupported claims; 2 some correct but misses important tradeoffs; 3 evidence-consistent reasoning; 4 clearly distinguishes evidence, mechanism, inference and unknowns.
- **Prescription and adaptation plan:** 0 no deliverable; 1 generic template; 2 partially matched; 3 feasible dose with progression and recovery; 4 robust contingency and competing-goal plan.
- **Monitoring and response:** 0 none; 1 generic tracking; 2 metrics without action rules; 3 clear interpretation and change thresholds; 4 handles missingness, noise and contradictory evidence.
- **Communication and scope:** 0 unsafe; 1 misleading; 2 incomplete; 3 clear and collaborative within scope; 4 anticipates adherence barriers, informed choices, safety and referral.
Rubric max 20; a sample provisional standard could be >=16/20, no domain below 3 and no safety-critical failures, subject to expert review and standard setting. **Not an approved pass policy.**

## Release now vs later
**P0 PR #20**: public weekly 8-question practice, outcome coverage, clear 7/8 threshold, explanations, randomized choices, truthful practice progress and written self-review scaffolds. Releases only after PR validation and live Netlify checks.

**P1**: starter lessons should include 2–3 short retrieval questions and spaced return, visual worked examples with correct citations, feedback for common misconceptions; expand 10 weekly chapters with mechanisms, data interpretation, cases, graphics and accessible media. Build editable case data and detailed week-specific lab protocols. Review question bank by independent subject experts. Label source uncertainty.

**P2**: private app's verified learning records and review queue, multiple item formats, human grading, identity/authorization, completion audit, moderate/regrade workflow and safe accommodations. Reconcile the open app certification PR instead of launching competing credential systems.

**P3**: calibration cohort, item difficulty/discrimination, learner retention and transfer studies, rubric inter-rater consistency, validity and adverse-event reporting; only then make external claims of demonstrated graduate competence.

## Nonnegotiables
- Actual performance ≠ confidence; self-mark ≠ instructor-assessed; practice score ≠ certification.
- Save draft ≠ submit final; unknown ≠ zero; a learner's health data must not be published.
- References and assessment keys must be versioned; don't make a new credential promise without lawful professional oversight.
- Keep public site on Netlify; private authenticated NAV Coach on Vercel; $0 new fixed infrastructure cost.
