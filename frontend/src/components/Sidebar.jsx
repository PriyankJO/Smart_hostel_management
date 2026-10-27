import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BedDouble, Receipt, CalendarCheck,
  ClipboardList, Wrench, UserCheck, UtensilsCrossed, Coffee, Megaphone, KeyRound, LogOut, ShieldCheck, Banknote, FileText, User as UserIcon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLES, ROLE_LABELS } from "../utils/roles";

const getNavItems = (role) => {
  const items = [];
  const prefix = `/${role}`;

  // Shared Dashboard (except for Staff, who use Profile as their main landing page)
  if (role !== ROLES.STAFF) {
    items.push({ to: `${prefix}/dashboard`, label: "Dashboard", icon: LayoutDashboard });
  }

  // Role specific items
  switch (role) {
    case ROLES.ADMIN:
      items.push({ to: `${prefix}/students`, label: "Students", icon: Users });
      items.push({ to: `${prefix}/rooms`, label: "Rooms", icon: BedDouble });
      items.push({ to: `${prefix}/fees`, label: "Fees", icon: Receipt });
      items.push({ to: `${prefix}/attendance`, label: "Attendance", icon: CalendarCheck });
      items.push({ to: `${prefix}/leaves`, label: "Leave & Outpass", icon: ClipboardList });
      items.push({ to: `${prefix}/canteen`, label: "Canteen & Menu", icon: UtensilsCrossed });
      items.push({ to: `${prefix}/maintenance`, label: "Maintenance", icon: Wrench });
      items.push({ to: `${prefix}/finance`, label: "Finance", icon: Banknote });
      items.push({ to: `${prefix}/complaints`, label: "Complaints", icon: ClipboardList });
      items.push({ to: `${prefix}/notices`, label: "Notices", icon: Megaphone });
      items.push({ to: `${prefix}/visitors`, label: "Visitors", icon: UserCheck });
      items.push({ to: `${prefix}/reports`, label: "Reports", icon: FileText });
      items.push({ to: `${prefix}/staff-list`, label: "Staff List", icon: ShieldCheck });
      items.push({ to: `${prefix}/salary`, label: "Salary", icon: Banknote });
      break;
    case ROLES.WARDEN:
      items.push({ to: `${prefix}/students`, label: "Students", icon: Users });
      items.push({ to: `${prefix}/rooms`, label: "Rooms", icon: BedDouble });
      items.push({ to: `${prefix}/attendance`, label: "Attendance", icon: CalendarCheck });
      items.push({ to: `${prefix}/leaves`, label: "Leave & Outpass", icon: ClipboardList });
      items.push({ to: `${prefix}/canteen`, label: "Canteen & Menu", icon: UtensilsCrossed });
      items.push({ to: `${prefix}/mess`, label: "Mess Schedule", icon: Coffee });
      items.push({ to: `${prefix}/complaints`, label: "Complaints", icon: ClipboardList });
      items.push({ to: `${prefix}/maintenance`, label: "Maintenance", icon: Wrench });
      items.push({ to: `${prefix}/notices`, label: "Notices", icon: Megaphone });
      items.push({ to: `${prefix}/visitors`, label: "Visitors", icon: UserCheck });
      break;
    case ROLES.ACCOUNTANT:
      items.push({ to: `${prefix}/fees`, label: "Fees & Receipts", icon: Receipt });
      items.push({ to: `${prefix}/salaries`, label: "Staff Salary", icon: Banknote });
      items.push({ to: `${prefix}/reports`, label: "Financial Reports", icon: FileText });
      break;
    case ROLES.CANTEEN_MANAGER:
      items.push({ to: `${prefix}/sales`, label: "Sales & Mess", icon: Receipt });
      items.push({ to: `${prefix}/menu`, label: "Menu", icon: UtensilsCrossed });
      break;
    case ROLES.STAFF:
      items.push({ to: `${prefix}/profile`, label: "My Profile", icon: UserIcon });
      items.push({ to: `${prefix}/attendance`, label: "Attendance", icon: CalendarCheck });
      items.push({ to: `${prefix}/leave`, label: "Leave Requests", icon: ClipboardList });
      items.push({ to: `${prefix}/salary`, label: "Salary Slips", icon: Banknote });
      items.push({ to: `${prefix}/notices`, label: "Notices", icon: Megaphone });
      break;
    case ROLES.STUDENT:
      items.push({ to: `${prefix}/profile`, label: "My Profile", icon: UserIcon });
      items.push({ to: `${prefix}/room`, label: "My Room", icon: BedDouble });
      items.push({ to: `${prefix}/fees`, label: "Fees", icon: Receipt });
      items.push({ to: `${prefix}/attendance`, label: "Attendance", icon: CalendarCheck });
      items.push({ to: `${prefix}/complaints`, label: "Complaints", icon: Wrench });
      items.push({ to: `${prefix}/leave`, label: "Leave & Outpass", icon: ClipboardList });
      items.push({ to: `${prefix}/notices`, label: "Notices", icon: Megaphone });
      break;
  }
  return items;
};

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const items = getNavItems(user.role);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-navy/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar container */}
      <aside 
        className={`print:hidden fixed lg:sticky top-0 left-0 z-50 w-64 shrink-0 bg-navy text-white/90 flex flex-col h-screen transform transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 rounded-tag bg-tag flex items-center justify-center text-navy">
            <KeyRound size={17} strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-display font-bold text-sm tracking-tight text-white">Hosteller</p>
            <p className="text-[10px] text-white/50 -mt-0.5">Smart Hostel System</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {items.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-tag text-navy font-semibold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={17} strokeWidth={2.2} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 px-1.5 py-1.5">
            <div className="w-8 h-8 rounded-lg bg-tag text-navy font-display font-bold text-xs flex items-center justify-center shrink-0">
              {initials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-white/45 truncate">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="w-7 h-7 rounded-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
