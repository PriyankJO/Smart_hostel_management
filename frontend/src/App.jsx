import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import Layout from "./components/Layout";

// Shared Pages
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import WardenDashboard from "./pages/WardenDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentRoom from "./pages/StudentRoom";
import Students from "./pages/Students";
import Rooms from "./pages/Rooms";
import Fees from "./pages/Fees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Complaints from "./pages/Complaints";
import Visitors from "./pages/Visitors";
import Mess from "./pages/Mess";
import Notices from "./pages/Notices";
import Wardens from "./pages/Wardens";
import Salary from "./pages/Salary";

// New Pages
import Reports from "./pages/Reports";
import Maintenance from "./pages/Maintenance";
import StaffList from "./pages/StaffList";
import StaffProfile from "./pages/StaffProfile";
import StaffAttendance from "./pages/StaffAttendance";
import StaffLeave from "./pages/StaffLeave";
import StaffSalary from "./pages/StaffSalary";
import AccountantDashboard from "./pages/AccountantDashboard";
import CanteenDashboard from "./pages/CanteenDashboard";
import CanteenSales from "./pages/CanteenSales";

import { ROLES } from "./utils/roles";

const ADMIN_WARDEN = [ROLES.ADMIN, ROLES.WARDEN];
const ADMIN = [ROLES.ADMIN];
const WARDEN = [ROLES.WARDEN];
const ACCOUNTANT = [ROLES.ACCOUNTANT];
const CANTEEN = [ROLES.CANTEEN_MANAGER];
const STAFF = [ROLES.STAFF];
const STUDENT = [ROLES.STUDENT];

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case ROLES.ADMIN: return <Navigate to="/admin/dashboard" replace />;
    case ROLES.WARDEN: return <Navigate to="/warden/dashboard" replace />;
    case ROLES.ACCOUNTANT: return <Navigate to="/accountant/dashboard" replace />;
    case ROLES.CANTEEN_MANAGER: return <Navigate to="/canteen/dashboard" replace />;
    case ROLES.STAFF: return <Navigate to="/staff/profile" replace />;
    case ROLES.STUDENT: return <Navigate to="/student/dashboard" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<RequireAuth />}>
          <Route path="/" element={<RootRedirect />} />
          
          <Route element={<Layout />}>
            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<RequireRole allow={ADMIN} />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="fees" element={<Fees />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="leaves" element={<Leave />} />
              <Route path="finance" element={<AccountantDashboard />} />
              <Route path="canteen" element={<CanteenDashboard />} />
              <Route path="canteen-menu" element={<CanteenDashboard defaultTab="menu-list" />} />
              <Route path="mess" element={<Mess />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="notices" element={<Notices />} />
              <Route path="visitors" element={<Visitors />} />
              <Route path="reports" element={<Reports />} />
              <Route path="staff-list" element={<StaffList />} />
              <Route path="salary" element={<Salary />} />
            </Route>

            {/* WARDEN ROUTES */}
            <Route path="/warden" element={<RequireRole allow={WARDEN} />}>
              <Route path="dashboard" element={<WardenDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="leaves" element={<Leave />} />
              <Route path="canteen" element={<CanteenDashboard />} />
              <Route path="canteen-menu" element={<CanteenDashboard defaultTab="menu-list" />} />
              <Route path="mess" element={<Mess />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="notices" element={<Notices />} />
              <Route path="visitors" element={<Visitors />} />
            </Route>

            {/* ACCOUNTANT ROUTES */}
            <Route path="/accountant" element={<RequireRole allow={ACCOUNTANT} />}>
              <Route path="dashboard" element={<AccountantDashboard />} />
              <Route path="fees" element={<Fees />} />
              <Route path="salaries" element={<Salary />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* CANTEEN ROUTES */}
            <Route path="/canteen" element={<RequireRole allow={CANTEEN} />}>
              <Route path="dashboard" element={<CanteenDashboard />} />
              <Route path="sales" element={<CanteenSales />} />
              <Route path="menu" element={<Mess />} />
            </Route>

            {/* STAFF ROUTES */}
            <Route path="/staff" element={<RequireRole allow={STAFF} />}>
              <Route path="profile" element={<StaffProfile />} />
              <Route path="attendance" element={<StaffAttendance />} />
              <Route path="leave" element={<StaffLeave />} />
              <Route path="salary" element={<StaffSalary />} />
              <Route path="notices" element={<Notices />} />
            </Route>

            {/* STUDENT ROUTES */}
            <Route path="/student" element={<RequireRole allow={STUDENT} />}>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="room" element={<StudentRoom />} />
              <Route path="fees" element={<Fees />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="leave" element={<Leave />} />
              <Route path="notices" element={<Notices />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all route for invalid URLs -> send them to root to check auth */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
