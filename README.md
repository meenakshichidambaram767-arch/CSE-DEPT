# SIET CSE — Student Hackathon, Project & Internship Tracking Platform

A modern, institutional web application engineered for the **Computer Science & Engineering Department** at **Sri Shakthi Institute of Engineering and Technology (SIET Autonomous)**.

The primary goal of this platform is to eliminate administrative workload for the Head of Department (HOD) while enabling students to digitally manage capstone projects, national hackathons, industrial internships, on-duty (OD) attendance permissions, and weekly non-evaluative review milestones.

---

## 🏛️ Key Capabilities

### 🎓 Student Workspace
- **Unified Activity Proposal Gateway**: Submit capstones, national hackathon entries, and internship NOC requests with verifiable technology stacks and documentation.
- **On-Duty (OD) Permissions**: Apply for academic attendance concessions with period-specific timetable slot selections (Full Day, Forenoon, Afternoon, Custom Periods 1–7).
- **Weekly Progress & Review Logging**: Submit weekly goals, tasks completed, blockers, and GitHub repository links before review meetings.
- **Progress History & Status Tracking**: Live timeline updates tracking proposal reviews, HOD endorsements, and revision directives.

### 🛡️ HOD Departmental Command Center
- **Centralized Approvals Inbox**: Filterable by category, academic year (II, III, IV), and status with real-time student track record badges.
- **Dedicated Review & Decision Gateway**:
  - Embedded inline PDF / Document previewer.
  - Non-punitive **"Request Clarification / Revision"** workflow.
  - 1-Click suggestion templates for audit remarks and revisions.
  - **Auto-Schedule Review Pipeline**: 1-click generation of 8 recurring weekly review sessions with customizable presets (8-Week Semester, 4-Week Sprint, Bi-Weekly).
  - Live Student Notification preview.
- **Weekly Review Tracker**: Non-evaluative progress meetings with 1-click "Mark All Present" attendance logging, QR code check-in, and actionable next-week directives.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router & Turbopack)
- **Language**: TypeScript
- **Styling**: Tailored Modern CSS & TailwindCSS Design System (SIET Institutional Forest Green `#064e3b` & Warm Gold `#f3b72b`)
- **Icons**: Lucide React
- **Backend & Database**: Supabase (PostgreSQL 15+ with Row-Level Security, Auth, Storage, and ACID RPC functions)
- **State Management**: React Context (`DataContext`) hydrated directly via REST `/api/v1/*` endpoints

---

## 🚀 Getting Started

### 1. Prerequisites & Environment Variables
Copy `.env.example` to `.env.local` and configure your Supabase project keys:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Dev Only: Set to true only if you wish to run with mock fixtures without live Supabase
# NEXT_PUBLIC_USE_MOCKS=true
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🔒 Authentication & Role Access

Authentication is backed by Supabase Auth with server-side verified PostgreSQL role enforcement (`STUDENT` vs `HOD`).

- In production, authenticating via valid institutional credentials issued in Supabase Auth is strictly required.
- In local development mode with `NEXT_PUBLIC_USE_MOCKS=true`, dev mock accounts may be used for isolated UI iteration.
- Refer to `FIX_REPORT.md` for complete integration defect resolution and manual testing checklist.

---

## 📜 License
Developed for Sri Shakthi Institute of Engineering & Technology (SIET) Autonomous, Coimbatore.

