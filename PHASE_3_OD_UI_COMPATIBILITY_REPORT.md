# Phase 3 — Existing OD UI Compatibility Report

**Project**: SIET CSE Department Platform  
**Phase**: Phase 3 — Existing OD UI Compatibility Retrofit  
**Status**: **PASS**  
**Authoritative Contracts**: SIET CSE Department Platform PRD v2.0, API Contract v2.0, Phase 1 Foundation, Phase 2 Data Layer  
**Date**: 2026-10-05  

---

## 1. Phase 3 Scope

Phase 3 implements a complete compatibility retrofit of the existing On-Duty (OD) user interface across student and HOD flows, aligning UI models, forms, detail views, and decision dialogs with **API Contract v2.0**.

### Strict Scope Boundaries Observed
* **No Live Backend Integration**: Zero calls to Supabase, Meena backend, Nattu backend, or external servers. The UI operates deterministically using Phase 1 contract fixtures and offline mock resolvers.
* **No New Frontend Created**: Preserved 100% of the existing visual styling, layout, component hierarchy, Tailwind CSS tokens, and UX behavior.
* **No Database or Migration Changes**: Zero modifications to Supabase database schemas, tables, RLS policies, or stored procedures.
* **No Unrelated Domain Mutations**: Activities, Reviews, Records, Reports, and Notifications domain pages were untouched beyond small shared mapper utilities.
* **Canonical Route Consolidation**: Standardized on `/student/apply-od` as the canonical student OD application route, converting the duplicate `/student/od-requests/new` route into a transparent compatibility redirect.

---

## 2. OD Architecture (Before Changes)

Prior to Phase 3, the OD interface operated with disconnected prototype patterns:
```
[Student UI: /student/apply-od]       [Duplicate UI: /student/od-requests/new]
                │                                    │
                ├────────────────────────────────────┘
                ▼
[Ad-hoc Form State (mixed camelCase & non-contract fields)]
                │
                ├─► Raw fetch('/api/v1/od-requests') bypassing DataContext
                ├─► Hardcoded time formats ("09:00 AM" / "05:00 PM")
                ├─► Arbitrary team member structures without register_number
                ├─► Filename strings passed instead of document_ids UUIDs
                └─► Client-side direct status mutations in HOD approval screens
```

Key deficiencies resolved:
1. Two competing OD form routes existed simultaneously (`/student/apply-od` vs `/student/od-requests/new`).
2. Time handling was hardcoded to a single fixed slot without presets or custom range support.
3. Total days calculation was inconsistent across single-day and multi-day date selections.
4. HOD approval pages (`/hod/approvals/[id]`, `/hod/requests/[id]`, `/hod/requests`) used raw `fetch()` calls.
5. Supporting documents used string filenames rather than contract-compliant `document_ids`.

---

## 3. OD Architecture (After Changes)

The retrofitted OD interface cleanly routes all student and HOD operations through the verified Phase 1 API abstractions and Phase 2 reactive state layer:
```
[Student OD Form: /student/apply-od]     [Compatibility Redirect: /student/od-requests/new]
                │                                                │
                └────────────────────────────────────────────────┘
                                │
                                ▼
        [Canonical Form State & Validation]
        - Quick Presets: Full Day (09-17), Forenoon (09-13), Afternoon (13-17), Custom
        - Dates: YYYY-MM-DD + Automatic Total Days
        - Team Members: [{ register_number, name, role }]
        - Documents: document_ids UUID array
                                │
                                ▼
        [Phase 2 DataContext: addODApplication / resubmitOD]
                                │
                                ▼
        [Phase 1 Mappers: mapODApplicationToApiPayload (strict snake_case)]
                                │
                                ▼
        [Phase 1 odApi: createODRequest / resubmitODRequest / executeDecision]
                                │
                                ▼
        [Contract-Compatible Fixtures & Mock Resolver] (Deterministic Offline)
                                │
                                ▼
        [Reactive State Update] ──► [Student & HOD UI Components Re-render]
```

---

## 4. Files Changed

| File Path | Description of Changes |
| :--- | :--- |
| `src/app/student/od-requests/new/page.tsx` | Consolidated duplicate OD form into a thin compatibility redirect to `/student/apply-od` preserving search parameters. |
| `src/app/student/apply-od/page.tsx` | Retrofitted canonical OD application form: integrated time presets (`FULL_DAY`, `FORENOON`, `AFTERNOON`, `PERIOD_CUSTOM`), custom period selector, automatic total days calculation, contract team member schema, `document_ids` array, conflict check integration, and lazy state initialization. |
| `src/app/student/od-requests/page.tsx` | Retrofitted student OD request list to consume reactive DataContext state via `useMemo`, eliminating render cascading and displaying contract status badges. |
| `src/app/student/od-requests/[id]/page.tsx` | Retrofitted student OD detail page: renders full contract metadata, team members list, supporting document signed URL action, and full `REVISION_REQUESTED` resubmission form routing through `resubmitOD`. |
| `src/app/hod/approvals/[id]/page.tsx` | Removed direct `fetch()` calls; routed HOD approval, revision, and rejection actions through DataContext actions (`approveOD`, `rejectOD`, `requestRevisionOD`). |
| `src/app/hod/requests/page.tsx` | Removed direct `fetch()` calls; routed OD registry queries through `odApi.getODRequests`. |
| `src/app/hod/requests/[id]/page.tsx` | Removed direct `fetch()` calls; routed detail lookup and decision execution through `odApi` and DataContext. |
| `src/lib/api/mappers.ts` | Added and exported `calculateTotalDays` helper to dynamically compute inclusive days between start and end dates with a minimum of 1. |
| `src/lib/api/client.ts` | Enhanced `getFieldError` to unwrap field validation messages from both raw `ApiError` instances and parsed RFC 7807 payloads. |
| `scripts/test-phase3-od-ui-compatibility.ts` | Created 12-test automated suite covering all Phase 3 categories. |
| `package.json` | Updated `test:compatibility` script to include Phase 3 (50 tests total). |

---

## 5. Canonical Routes & Consolidation

* **Canonical Route**: `/student/apply-od` is the single source of truth for student OD applications.
* **Compatibility Route**: `/student/od-requests/new` is a thin client redirect that seamlessly forwards incoming users (and query parameters such as `?activityId=...`) to `/student/apply-od` without maintaining a competing implementation.

---

## 6. Payload Compatibility

Form submissions produce the authoritative `CreateODPayload`:
```json
{
  "event_id": null,
  "activity_id": null,
  "purpose": "HACKATHON",
  "event_name": "Smart India Hackathon 2026",
  "start_date": "2026-10-15",
  "end_date": "2026-10-17",
  "from_time": "09:00:00",
  "to_time": "17:00:00",
  "slot_type": "FULL_DAY",
  "total_days": 3,
  "venue": "IIT Madras Research Park",
  "registration_id": "SIH-2026-9921",
  "team_members": [
    { "register_number": "714023104088", "name": "Meena C", "role": "LEAD" },
    { "register_number": "714022104002", "name": "Nattu K", "role": "MEMBER" }
  ],
  "document_ids": ["doc-fixture-001"]
}
```

---

## 7. Time Handling

Per PRD §4.2 and Section 9 of the prompt, the OD form supports:
1. **Quick Presets**:
   * **Full Day**: `09:00:00` to `17:00:00` (`slot_type: 'FULL_DAY'`)
   * **Forenoon**: `09:00:00` to `13:00:00` (`slot_type: 'FORENOON'`)
   * **Afternoon**: `13:00:00` to `17:00:00` (`slot_type: 'AFTERNOON'`)
2. **Custom Period**:
   * Interactive input fields for arbitrary start and end times (`slot_type: 'PERIOD_CUSTOM'`).
3. **Boundary Normalization**:
   * All time values are converted to strict `HH:MM:SS` (24-hour) at the API boundary via `formatTimeToHHMMSS`.

---

## 8. Date Handling & Total Days

* Dates are strictly formatted as `YYYY-MM-DD` via `formatDateToYYYYMMDD`.
* Total days calculation is dynamically managed by `calculateTotalDays(startDate, endDate)`:
  * Single-day OD: returns `1`.
  * Same start and end date: returns `1`.
  * Multi-day range (e.g. `2026-10-15` to `2026-10-17`): returns `3`.

---

## 9. Team Member Handling

* Primary student is automatically assigned as lead applicant:
  `{ register_number: user.registerNumber, name: user.name, role: 'LEAD' }`
* Additional classmates added via the form are formatted as:
  `{ register_number: t.regNo, name: t.name, role: 'MEMBER' }`
* No arbitrary student IDs or unvetted mock-user objects cross the API boundary.

---

## 10. Document Handling

* Supporting verification files are represented strictly by `document_ids: string[]`.
* File attachments pass through the `FileUpload` abstraction; generated document UUIDs are stored in the payload rather than string file paths or raw File objects.
* OD detail page offers 15-minute signed URL preview action via `documentsApi.getSignedUrl(docId)`.

---

## 11. Schedule Conflict Handling

* Step 5 of the canonical OD form performs conflict verification via `odApi.getODConflicts('draft')`.
* Potential timetable collisions with exams or overlapping approved leaves are surfaced with a warning banner for student awareness before final submission.
* HOD detail view similarly queries `checkODConflict` / `odApi.getODConflicts` for institutional clearance.

---

## 12. Revision & Resubmission Flow

The full verified OD lifecycle loop is implemented:
1. HOD specifies revision notes and triggers `requestRevisionOD(id, notes)`.
2. Student detail page displays the **HOD Revision Directive** with high visual prominence.
3. An inline resubmission form allows updating event name, reason, schedule, and attaching clarifications.
4. Resubmission dispatches `resubmitOD(id, revisionClarifications)` routing through `PUT /api/v1/od-requests/{id}/resubmit`.
5. Status transitions from `REVISION_REQUESTED` back to `PENDING` with timeline event recording.

---

## 13. HOD Decision Compatibility

* `/hod/approvals`: Serves as the action inbox for pending clearances.
* `/hod/requests`: Serves as the searchable registry and archive.
* Validated status transitions:
  * `PENDING` → `APPROVED` (with optional clearance remarks)
  * `PENDING` → `REJECTED` (strictly requiring rejection reason)
  * `PENDING` → `REVISION_REQUESTED` (strictly requiring revision instructions)
* Invalid client transitions are prevented.

---

## 14. Error Handling (RFC 7807)

* Errors occurring during OD actions are normalized via `parseApiError`.
* Preserves RFC 7807 properties: `code`, `message`, `status`, and `details.field`.
* `getFieldError(parsedError, 'revision_notes')` enables targeted inline error feedback for form inputs.

---

## 15. Test Results

* **Phase 1 Regression Suite**: **23 / 23 PASSED** (0 regressions)
* **Phase 2 Regression Suite**: **15 / 15 PASSED** (0 regressions)
* **Phase 3 OD UI Suite**: **12 / 12 PASSED** (0 failures)
* **Total Combined Tests**: **50 / 50 PASSED** (100% pass rate)

---

## 16. Build, Lint & Typecheck Results

* `npm run test:compatibility`: **PASS** (50/50 tests)
* `npm run typecheck` (`tsc --noEmit`): **PASS** (0 errors)
* `npm run lint` (`eslint`): **PASS** (0 errors)
* `npm run build` (`next build`): **PASS** (50 static/dynamic routes compiled via Turbopack)
* `git diff --check`: **PASS** (0 whitespace/formatting corruptions)

---

## 17. Remaining Deferred Items

The following items remain intentionally deferred to subsequent phases:
1. **Activities UI Migration**: Full retrofitting of Activities pages (Deferred to Phase 4).
2. **Reviews UI Migration**: Full retrofitting of Reviews pages (Deferred to Phase 5).
3. **Records & Reports UI Migration**: Student directory and NAAC/NBA export pages (Deferred to Phase 6).
4. **Live Backend Integration**: Connecting `apiClient` to running Supabase instance (Deferred to Backend Integration phase).
5. **Live Authentication**: Real Supabase JWT session lifecycle (Deferred to Auth phase).

---

## 18. Final Status

**PHASE 3 STATUS: PASS**  
The existing OD UI has achieved full contract compatibility with API Contract v2.0 without live backend dependencies or UI regressions.
