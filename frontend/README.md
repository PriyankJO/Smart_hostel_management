# Hosteller — Smart Hostel Management System (Frontend)

A React + Vite frontend for a Smart Hostel Management System, built with Tailwind CSS,
React Router, Recharts, and lucide-react icons. All data is seeded locally and persisted
to the browser's localStorage — no backend required, and your changes survive a page
refresh (until you clear browser storage).

## Login (separate Staff and Student portals)

The app now has a login screen with two tabs: **Staff Login** and **Student Login**.
Sessions persist in `localStorage` under `shms:session` until you log out.

**Staff demo accounts** (Admin / Warden — full access to every module):
| Username | Password    | Role   |
|----------|-------------|--------|
| admin    | admin123    | Admin  |
| warden   | warden123   | Warden |

**Student demo login** (Student ID + the phone number on their profile):
| Student ID | Phone         |
|------------|---------------|
| STU-1042   | 98765 43210   |
| STU-1043   | 98765 11223   |
| ...        | see Students module for the rest |

Students who log in only see: Dashboard (their own profile/fees/attendance), Fees
(their own transactions, read-only), Leave & Outpass (create + view their own,
cannot approve), Complaints (create + view their own), Mess Menu, and Notices.
Students, Rooms, Attendance, and Visitors are staff-only and redirect back to the
dashboard if a student tries to open the URL directly.

Any student added via the Students module can immediately log in with their
Student ID + phone number — no separate signup step needed for this demo.

## Pages (full CRUD — Create, Read, Update, Delete)
- Dashboard — live occupancy, fees, attendance trend, pending approvals, notices
- Students — add / edit / delete, search/filter
- Rooms — add / edit / delete, block-wise occupancy
- Fees — add / edit / delete payment records, collection stats
- Attendance — trend chart + per-student attendance (reads live student data)
- Leave & Outpass — create requests, approve/reject, delete
- Complaints — create / edit / delete maintenance tickets
- Visitors — log entry, mark exit, edit / delete
- Mess Menu — weekly meal plan (static reference)
- Notices — post / edit / delete announcements

### How persistence works
Each module stores its data under a `shms:<module>` key in `localStorage` via the
`useLocalStorage` hook in `src/hooks/useLocalStorage.js`. To reset a module back to the
seed data, clear that key from your browser's dev tools (Application → Local Storage),
or clear all site data.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Connecting to a real backend
All mock data lives in `src/data/mockData.js`. Replace the imports in each page
with API calls (e.g. `fetch`/`axios`) to your backend once it's ready — the
component structure and props are already shaped like normal API responses.

## Tech stack
- Vite + React 19
- Tailwind CSS 3
- React Router 6
- Recharts (charts)
- lucide-react (icons)
