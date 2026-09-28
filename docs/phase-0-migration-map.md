# Phase 0 student-side migration map

| File/path | Current purpose | Mock/local dependency | Replacement | Planned phase |
| --- | --- | --- | --- | --- |
| `src/context/DataContext.tsx` | Prototype activity, OD, review, and notification state | Mock imports and `localStorage` | Student repository/query layer backed by authenticated Supabase access | Student workflow phase |
| `src/context/SessionContext.tsx` and `src/lib/session.ts` | Demo login and route role switching | Mock users and `localStorage` session | Supabase Auth session plus verified student profile lookup | Auth integration |
| `src/data/mock/*` | Prototype records for all UI routes | Static student, OD, activity, review, event, and notification data | Database reads after each agreed data contract is implemented | Per workflow phase |
| `src/lib/api/*` | Prototype API-shaped reads | Returns mock collections | Supabase-backed repositories; no fake API endpoints | Per workflow phase |
| `src/components/ui/FileUpload.tsx` | Browser file selection and metadata preview | Does not upload; generates temporary client IDs | Approved private-storage adapter and document metadata persistence | Document workflow phase |
| Student pages | Prototype presentation and submissions | Some fallback identity/data and `DataContext` writes | Authenticated student data source plus workflow repositories | Student workflow phase |
| `src/lib/supabase/*` | New connection foundation | None | Reused by approved repositories/auth adapters | Foundation complete |

## Mock/localStorage audit

The remaining mock dependencies are intentionally contained in the prototype boundaries above. `DataContext` also fabricates IDs, success notifications, and document URL strings; these must not be used as backend behavior. `Header.tsx` contains a prototype HOD identifier and is out of this student-only Phase 0 scope.

No existing data set was found. `data/student-import.template.csv` contains only visibly fake records. Use the exact columns `register_number,name,email,department,year,section`; run `npm run student-import -- <file> --dry-run` before any future server-side import adapter is enabled.

The importer supports the documented 15 CSE sections: Years I/II A-E, Year III A-C, and Year IV A-B. `--apply` deliberately fails until the approved database schema and server-only destination adapter are available; guessing a table name or column mapping would violate the API-contract constraint.
