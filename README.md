# DotGanga — Enterprise Attendance & Payroll Management System

A production-ready full-stack system with dual-layer physical check-in validation (Geofence + WiFi SSID), automated payroll engine, staff mobile hub, and admin analytics console.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js · Express.js · MongoDB (Mongoose) |
| Frontend | React 18 · Vite · Tailwind CSS |
| Auth | JWT (7-day expiry) · bcrypt (10 rounds) |
| Security | Helmet · Rate limiting · Input validation |
| Export | xlsx (Excel export) |

---

## Project Structure

```
dotganga-att/
├── backend/
│   ├── models/          # 6 Mongoose schemas
│   ├── routes/          # REST API routes
│   ├── middleware/       # JWT auth + error handler
│   ├── utils/           # Haversine + Payroll Engine
│   └── scripts/         # Seed script
└── frontend/
    └── src/
        ├── pages/        # Login · StaffHub · AdminMatrix
        ├── components/
        │   ├── staff/    # CheckInPanel · EarningsTracker · LeaveManager
        │   └── admin/    # OperationalDeck · ShiftConfig · StaffManagement · PayrollMatrix
        ├── context/      # AuthContext
        └── utils/        # Axios API client
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env → set MONGODB_URI and JWT_SECRET
npm run seed      # Creates admin + demo staff + company config
npm run dev       # Starts on port 5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Starts on port 5173
```

### 4. Login Credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@dotganga.com | admin123 |
| Staff | staff@dotganga.com | staff123 |

---

## API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/change-password | Change password |

### Attendance
| Method | Route | Description |
|---|---|---|
| POST | /api/attendance/checkin | Check in (validates GPS + WiFi) |
| PUT | /api/attendance/checkout | Check out |
| GET | /api/attendance/today | Today's records |
| GET | /api/attendance/my | Own attendance history |
| GET | /api/attendance/stats | Monthly stats |
| GET | /api/attendance/report | Admin full report |

### Leaves
| Method | Route | Description |
|---|---|---|
| POST | /api/leaves | Apply for leave |
| GET | /api/leaves/my | Own leave history |
| PATCH | /api/leaves/:id/approve | Admin: approve |
| PATCH | /api/leaves/:id/reject | Admin: reject |
| DELETE | /api/leaves/:id | Withdraw pending leave |

### Payroll
| Method | Route | Description |
|---|---|---|
| POST | /api/payroll/generate | Generate for all staff |
| GET | /api/payroll | All payroll records |
| GET | /api/payroll/my | Own payroll history |
| GET | /api/payroll/my/preview | Live preview (no DB write) |
| PATCH | /api/payroll/:id/status | Update payment status |
| GET | /api/payroll/export?month=YYYY-MM | Export Excel |

### Company Config
| Method | Route | Description |
|---|---|---|
| GET | /api/company | Get config |
| PUT | /api/company | Update config |

### Staff (Admin)
| Method | Route | Description |
|---|---|---|
| GET | /api/staff | List all staff |
| POST | /api/staff | Add staff |
| PUT | /api/staff/:id | Update staff |
| DELETE | /api/staff/:id | Deactivate staff |
| GET | /api/staff/:id/salary | Get salary profile |
| PUT | /api/staff/:id/salary | Set salary profile |
| GET | /api/staff/dashboard/summary | Operational summary |

---

## Core Business Rules

### Check-In Validation (Twin-Layer)

1. **WiFi SSID** — Staff must confirm they are on the office WiFi network. The provided SSID is matched case-insensitively against the configured value.
2. **Geofence (Haversine)** — GPS coordinates are validated using the Haversine formula. Check-in is rejected if the distance from the office exceeds `allowedRadiusMeter`.

### Late Slip Automation

```
Shift Start: 09:30
Grace Period: 15 min  →  Deadline: 09:45

Check-in ≤ 09:30      → Full-Day (on time)
Check-in 09:31–09:45  → Full-Day + isLate flag (within grace)
Check-in ≥ 09:46      → Half-Day (auto half-day) + isLate flag
```

### Payroll Formula

```
Daily Wage Rate  = Base Monthly Salary ÷ Total Calendar Days in Month
Payable Days     = Present Days + Approved Leaves + (Half Days × 0.5)
Final Net Payout = (Daily Wage Rate × Payable Days) + Allowances
```

---

## WiFi SSID Note

Web browsers cannot natively read the device's connected WiFi SSID. The current implementation requires staff to manually enter their network name. For production enforcement, a native mobile app (React Native / Flutter) or Electron desktop app with OS-level network access is recommended.
