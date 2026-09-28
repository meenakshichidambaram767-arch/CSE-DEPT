# Phase 1 Open Decisions & Blocker Documentation

The following architectural and business decisions were identified in Phase 0 repository inspection based on `SIET_CSE_Platform_PRD_v2_0.pdf`, `SIET CSE Department Platform - API Contract v2.0.pdf`, and `SIET_CSE_Meena_Implementation_Guide.pdf`.

---

## Unresolved Open Decisions

### 1. OD Period Slots vs. Exact Time Ranges
* **Issue**: The README and Student Apply OD form describe period-based slot options (`Full Day`, `Forenoon`, `Afternoon`, `Custom Periods 1–7`), whereas PRD v2.0 Section 07 specifies continuous `from_time` and `to_time` fields.
* **Impact**: Affects OD request database schema and Phase 2 OD Conflict Detection engine.
* **Status**: `BLOCKED FOR PHASE 2 OD TIMETABLE CONFLICTS` — Defaulting DB schema to store both `from_time`/`to_time` and optional `slot_type` enum (`FULL_DAY`, `FORENOON`, `AFTERNOON`, `CUSTOM_PERIODS`).

### 2. Review Rubrics & Evaluative Scoring
* **Issue**: PRD Section 05 dictates that weekly reviews are "non-evaluative progress meetings" focused on blockers and goals. However, repository TypeScript interfaces (`src/types/index.ts`) include rubric score fields (`technicalKnowledge`, `implementation`, `presentation`, `problemUnderstanding`, `progress`, `totalScore`).
* **Impact**: Affects Phase 4 Weekly Review API (`/api/v1/reviews/sessions/:id/finalize`).
* **Status**: `BLOCKED FOR PHASE 4 REVIEWS` — Core Phase 1 Auth/Profiles layer remains unaffected.

### 3. Approval Delegation & Faculty Mentors
* **Issue**: PRD Section 04 restricts platform users to exactly two roles (`STUDENT` and `HOD`). Does the system require intermediate Class Adviser / Guide approval before an OD or activity reaches the HOD inbox?
* **Impact**: Affects OD & Activity approval state machine transitions.
* **Status**: `BLOCKED FOR MULTI-LEVEL APPROVALS` — Phase 1 enforces direct HOD approval per PRD v2.0 specification.

### 4. Storage Quotas & File Type Restrictions
* **Issue**: Specific byte limits and MIME type whitelists for Supabase Storage buckets are not formally configured.
* **Impact**: Affects Phase 2 Document Upload API (`/api/v1/documents/upload`).
* **Status**: `BLOCKED FOR PHASE 2 DOCUMENTS` — Defaulting to maximum 5MB limit and MIME types `application/pdf`, `image/jpeg`, `image/png`.

### 5. NAAC / NBA Accreditation Framework Criteria Confirmation
* **Issue**: Report criteria numbers (`1.3.2`, `5.3.1`, `1.3.3`) are hardcoded in the prototype UI. Institutional verification is required to confirm active criteria tags.
* **Impact**: Affects Phase 5 Accreditation Reports API (`/api/v1/reports/accreditation`).
* **Status**: `BLOCKED FOR PHASE 5 REPORTS` — Phase 1 Auth & Foundation is unblocked.

---

## Phase 1 Readiness Summary
* **Phase 1 Core Foundation (Auth, Session Management, RLS Policies, GET /api/v1/me, Role-based Route Protection)**: **UNBLOCKED & PROCEEDING**.
