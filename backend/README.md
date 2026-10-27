# Smart Hostel Management System - Backend

This is the Node.js/Express backend for the Smart Hostel Management System.

## Project Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env` (refer to `.env.example`).
3. Ensure MongoDB is running locally or provide a valid MongoDB Atlas URI.

## Database Seeding

To populate the database with initial mock data from the frontend:

```bash
npm run seed
```

This will create:
- Admin (username: admin, password: Admin@123)
- Warden (username: warden, password: Warden@123)
- Accountant (username: accountant, password: Accountant@123)
- Canteen Manager (username: canteen, password: Canteen@123)
- Staff (username: staff, password: Staff@123)
- Students (e.g. STU-1043, password: Student@123)

## Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:5000` by default.

## Authentication & Roles
- JWT-based authentication
- Roles: `admin`, `warden`, `accountant`, `canteen`, `staff`, `student`

## API Endpoints

### Auth
- `POST /api/auth/staff/login`
- `POST /api/auth/student/login`
- `POST /api/auth/logout`
- `GET /api/auth/me` (Protected)

### Students
- `GET /api/students` (Protected, supports `?search=`)
- `POST /api/students` (Admin only)
- `GET /api/students/:id`
- `PUT /api/students/:id` (Admin only)
- `DELETE /api/students/:id` (Admin only)

### Rooms
- `GET /api/rooms`
- `POST /api/rooms` (Admin, Warden)
- `GET /api/rooms/:id`
- `PUT /api/rooms/:id` (Admin, Warden)
- `DELETE /api/rooms/:id` (Admin)

### Fees
- `GET /api/fees`
- `POST /api/fees` (Admin, Accountant)
- `PUT /api/fees/:id` (Admin, Accountant)
- `DELETE /api/fees/:id` (Admin, Accountant)
- `GET /api/fees/student/:studentId`

### Leaves
- `GET /api/leaves`
- `POST /api/leaves`
- `PATCH /api/leaves/:id/status` (Admin, Warden)

### Complaints
- `GET /api/complaints`
- `POST /api/complaints`
- `GET /api/complaints/:id`
- `PATCH /api/complaints/:id/status` (Admin, Warden)
- `DELETE /api/complaints/:id` (Admin, Warden)

### Dashboard
- `GET /api/dashboard/admin` (Protected)

### Staff
- `GET /api/staff`
- `POST /api/staff`
- `GET /api/staff/:id`

### Visitors
- `GET /api/visitors`
- `POST /api/visitors`

### Notices
- `GET /api/notices`

## Troubleshooting
- **CORS Error**: Ensure `CLIENT_URL` in `.env` matches your frontend URL exactly.
- **MongoDB Error**: Check `MONGODB_URI` connection string and network access.
