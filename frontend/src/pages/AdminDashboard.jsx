import { useState, useEffect } from "react";
import {
  Users, BedDouble, Wallet, Wrench, UtensilsCrossed, ArrowRight,
  Coffee, Sun, Moon, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck,
  Receipt, CalendarCheck, ClipboardList, Megaphone, UserCheck, FileText, Banknote, Clock
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, StatCard, KeyTag, StatusPill } from "../components/ui";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import {
  students as seedStudents, rooms as seedRooms, fees as seedFees,
  complaints as seedComplaints, leaveRequests as seedLeave, notices as seedNotices,
  messMenu as seedMessMenu, canteenMenuItems as seedMenuItems, canteenTransactions as seedCanteen,
  attendanceTrend,
} from "../data/mockData";
import api from "../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getTodayDayName() {
  return DAYS[(new Date().getDay() + 6) % 7];
}

function getCurrentMealSlot() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return { name: "Breakfast", icon: Coffee, time: "7:30 AM – 9:30 AM" };
  if (hour >= 11 && hour < 16) return { name: "Lunch", icon: Sun, time: "12:30 PM – 2:30 PM" };
  if (hour >= 16 && hour < 19) return { name: "Evening Snacks", icon: Coffee, time: "4:30 PM – 6:00 PM" };
  return { name: "Dinner", icon: Moon, time: "7:30 PM – 9:30 PM" };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Local storage fallbacks
  const [messMenu] = useLocalStorage("shms:messMenu", seedMessMenu);
  const [canteenItems] = useLocalStorage("shms:canteenItems", seedMenuItems);
  const [canteenTxns] = useLocalStorage("shms:canteen", seedCanteen);

  const [stats, setStats] = useState({
    totalStudents: 11,
    totalRooms: 6,
    occupiedRooms: 6,
    availableBeds: 2,
    pendingLeaves: 2,
    openComplaints: 3,
    pendingFees: 282000,
    monthlyCollection: 509000,
    recentLeaves: [],
    recentComplaints: [],
    recentNotices: []
  });

  const [todayMenu, setTodayMenu] = useState(null);

  useEffect(() => {
    // 1. Fetch dashboard stats
    api.get("/dashboard/admin")
      .then((res) => {
        if (res.data?.success) {
          setStats((prev) => ({ ...prev, ...res.data.data }));
        }
      })
      .catch((err) => console.log("Using cached dashboard stats", err.message));

    // 2. Fetch today's mess menu
    api.get("/mess/today")
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setTodayMenu(res.data.data);
        }
      })
      .catch(() => {
        const todayDay = getTodayDayName();
        setTodayMenu(messMenu[todayDay]);
      });
  }, []);

  const todayDay = getTodayDayName();
  const activeMeal = getCurrentMealSlot();
  const activeTodayMenu = todayMenu || messMenu[todayDay] || { breakfast: "—", lunch: "—", dinner: "—" };

  const {
    totalStudents = 11,
    totalRooms = 6,
    occupiedRooms = 6,
    availableBeds = 2,
    pendingLeaves = 2,
    openComplaints = 3,
    pendingFees = 282000,
    monthlyCollection = 509000,
    recentLeaves = [],
    recentComplaints = [],
    recentNotices = []
  } = stats;

  const totalCapacity = occupiedRooms + availableBeds;
  const occupiedBeds = totalCapacity - availableBeds;
  const target = monthlyCollection + pendingFees || 1;
  const feesPct = Math.round((monthlyCollection / target) * 100);

  // Canteen quick figures
  const totalCanteenSales = canteenTxns
    .filter((t) => t.type === "Income")
    .reduce((s, t) => s + Number(t.amount), 0);

  // Admin Modules Directory List
  const adminModules = [
    {
      title: "Students Directory",
      desc: `${totalStudents} registered students`,
      path: `/${user?.role}/students`,
      icon: Users,
      badge: `${totalStudents} Enrolled`,
      color: "from-blue-500/10 to-indigo-500/5 text-blue-700"
    },
    {
      title: "Rooms & Beds",
      desc: `${occupiedBeds}/${totalCapacity} beds occupied`,
      path: `/${user?.role}/rooms`,
      icon: BedDouble,
      badge: `${availableBeds} Free Beds`,
      color: "from-purple-500/10 to-pink-500/5 text-purple-700"
    },
    {
      title: "Fee Collections",
      desc: `${feesPct}% collected this month`,
      path: `/${user?.role}/fees`,
      icon: Receipt,
      badge: `₹${(monthlyCollection / 1000).toFixed(0)}k Collected`,
      color: "from-emerald-500/10 to-teal-500/5 text-emerald-700"
    },
    {
      title: "Attendance Tracker",
      desc: "Daily student check-ins",
      path: `/${user?.role}/attendance`,
      icon: CalendarCheck,
      badge: "Biometric & Manual",
      color: "from-amber-500/10 to-orange-500/5 text-amber-700"
    },
    {
      title: "Leave & Outpass",
      desc: `${pendingLeaves} pending approvals`,
      path: `/${user?.role}/leaves`,
      icon: ClipboardList,
      badge: `${pendingLeaves} Pending`,
      color: "from-rose-500/10 to-red-500/5 text-rose-700"
    },
    {
      title: "Canteen & Menu List",
      desc: `${canteenItems.length} dishes in catalog`,
      path: `/${user?.role}/canteen`,
      icon: UtensilsCrossed,
      badge: "Menu & Sales",
      highlight: true,
      color: "from-amber-500/15 to-yellow-500/10 text-amber-900 border-amber-300"
    },
    {
      title: "Facility Maintenance",
      desc: "Repairs & scheduled service",
      path: `/${user?.role}/maintenance`,
      icon: Wrench,
      badge: "Facilities",
      color: "from-sky-500/10 to-cyan-500/5 text-sky-700"
    },
    {
      title: "Finance & Accounts",
      desc: "Hostel balance & cash flow",
      path: `/${user?.role}/finance`,
      icon: Banknote,
      badge: "P&L Statements",
      color: "from-emerald-500/10 to-green-500/5 text-emerald-700"
    },
    {
      title: "Student Grievances",
      desc: `${openComplaints} open issues`,
      path: `/${user?.role}/complaints`,
      icon: AlertTriangle,
      badge: `${openComplaints} Open`,
      color: "from-orange-500/10 to-amber-500/5 text-orange-700"
    },
    {
      title: "Notice Broadcasts",
      desc: "Hostel announcements",
      path: `/${user?.role}/notices`,
      icon: Megaphone,
      badge: "Circulars",
      color: "from-violet-500/10 to-purple-500/5 text-violet-700"
    },
    {
      title: "Visitor Gate Pass",
      desc: "Visitor register & security",
      path: `/${user?.role}/visitors`,
      icon: UserCheck,
      badge: "Gate Control",
      color: "from-slate-500/10 to-gray-500/5 text-slate-700"
    },
    {
      title: "Reports & Audits",
      desc: "Occupancy & finance exports",
      path: `/${user?.role}/reports`,
      icon: FileText,
      badge: "Analytics",
      color: "from-indigo-500/10 to-blue-500/5 text-indigo-700"
    },
    {
      title: "Hostel Staff List",
      desc: "Wardens, security, helpers",
      path: `/${user?.role}/staff-list`,
      icon: ShieldCheck,
      badge: "Active Staff",
      color: "from-cyan-500/10 to-blue-500/5 text-cyan-700"
    },
    {
      title: "Staff Payroll",
      desc: "Monthly wage disbursements",
      path: `/${user?.role}/salary`,
      icon: Wallet,
      badge: "Salaries",
      color: "from-emerald-500/10 to-teal-500/5 text-emerald-700"
    }
  ];

  return (
    <div className="pb-12">
      <Topbar title="Admin Dashboard" subtitle="Central operations hub & hostel overview" />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Core KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={totalStudents} sub="across all hostel blocks" icon={Users} />
          <StatCard
            label="Beds Occupied"
            value={`${occupiedBeds}/${totalCapacity}`}
            sub={`${totalCapacity ? Math.round((occupiedBeds / totalCapacity) * 100) : 0}% occupancy rate`}
            icon={BedDouble}
            accent="tag"
          />
          <StatCard label="Fee Collections" value={`${feesPct}%`} sub={`₹${monthlyCollection.toLocaleString("en-IN")} received`} icon={Wallet} />
          <StatCard label="Open Complaints" value={openComplaints} sub="needs staff attention" icon={Wrench} accent="tag" />
        </div>

        {/* ========================================================================= */}
        {/* TODAY'S CANTEEN & MESS MENU HERO CARD                                     */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-navy via-[#421d3f] to-[#542a52] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <UtensilsCrossed size={160} />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="bg-tag text-navy text-xs font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
                  Canteen & Mess Menu
                </span>
                <span className="text-white/70 text-xs font-semibold flex items-center gap-1">
                  <Clock size={13} /> {todayDay} Schedule
                </span>
              </div>
              <h3 className="text-xl lg:text-2xl font-display font-bold tracking-tight">
                Today's Daily Food & Mess Menu
              </h3>
              <p className="text-xs lg:text-sm text-white/80 leading-relaxed">
                Currently serving: <strong className="text-tag">{activeMeal.name}</strong> ({activeMeal.time}).
                Canteen catalog has <strong>{canteenItems.length} active dishes</strong> with real-time stock and prices.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(`/${user?.role}/canteen`)}
                className="flex items-center gap-2 bg-tag text-navy font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-tag/90 transition shadow-sm"
              >
                <UtensilsCrossed size={16} /> Open Canteen Menu
              </button>
              <button
                onClick={() => navigate(`/${user?.role}/canteen-menu`)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-4 py-2.5 rounded-xl border border-white/20 transition"
              >
                Food Price List <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Today's Meals Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-white/15">
            {/* Breakfast */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
                <span className="flex items-center gap-1.5 font-bold text-white uppercase text-[11px] tracking-wider">
                  <Coffee size={14} className="text-tag" /> Breakfast
                </span>
                <span className="text-[10px]">7:30 – 9:30 AM</span>
              </div>
              <p className="text-sm font-medium text-white truncate">
                {activeTodayMenu.breakfast || "Idli, Sambar, Chutney, Tea"}
              </p>
            </div>

            {/* Lunch */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
                <span className="flex items-center gap-1.5 font-bold text-white uppercase text-[11px] tracking-wider">
                  <Sun size={14} className="text-tag" /> Lunch
                </span>
                <span className="text-[10px]">12:30 – 2:30 PM</span>
              </div>
              <p className="text-sm font-medium text-white truncate">
                {activeTodayMenu.lunch || "Rice, Dal, Seasonal Curry, Curd"}
              </p>
            </div>

            {/* Dinner */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
                <span className="flex items-center gap-1.5 font-bold text-white uppercase text-[11px] tracking-wider">
                  <Moon size={14} className="text-tag" /> Dinner
                </span>
                <span className="text-[10px]">7:30 – 9:30 PM</span>
              </div>
              <p className="text-sm font-medium text-white truncate">
                {activeTodayMenu.dinner || "Chapati, Paneer Curry, Rice"}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ALL ADMIN MODULES DIRECTORY / NAVIGATION GRID                             */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-tag-dark uppercase tracking-wider">Navigation</p>
              <h3 className="text-lg font-bold text-ink">Hostel Operations & Management Modules</h3>
            </div>
            <span className="text-xs text-ink/50">14 Active Modules</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {adminModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.title}
                  onClick={() => navigate(mod.path)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-sm ${
                    mod.highlight
                      ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-300/50"
                      : "bg-white border-line hover:border-navy/30"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${mod.color}`}>
                        <Icon size={17} />
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-navy/5 text-navy/70 truncate max-w-[70px]">
                        {mod.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-ink leading-tight">{mod.title}</h4>
                      <p className="text-[11px] text-ink/50 mt-0.5 truncate">{mod.desc}</p>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center text-[10px] font-semibold text-navy/80 hover:text-navy">
                    Open <ArrowRight size={10} className="ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Charts and Operational Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <SectionHeader eyebrow="Attendance Analytics" title="Monthly student attendance trend" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={attendanceTrend} margin={{ left: -20, top: 5 }}>
                <defs>
                  <linearGradient id="fillAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#542A52" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#542A52" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EADBE6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#2F172E99" }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 12, fill: "#2F172E99" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #EADBE6", fontSize: 13 }} />
                <Area type="monotone" dataKey="pct" stroke="#542A52" strokeWidth={2.5} fill="url(#fillAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Pending Leave Requests */}
          <Card className="p-6 flex flex-col">
            <SectionHeader eyebrow="Approvals" title="Pending leave requests" />
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px]">
              {recentLeaves.length === 0 && <p className="text-sm text-ink/50">No pending leave requests.</p>}
              {recentLeaves.map((l) => (
                <button
                  key={l.leaveId || l._id}
                  onClick={() => navigate(`/${user?.role}/leaves`, { state: { openId: l.leaveId || l._id } })}
                  className="w-full flex items-start justify-between gap-3 pb-3 border-b border-line last:border-0 last:pb-0 text-left hover:bg-parchment/60 -mx-2 px-2 pt-1.5 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{l.studentId?.name || "Student"}</p>
                    <p className="text-xs text-ink/50 mt-0.5">
                      {new Date(l.from).toLocaleDateString()} → {new Date(l.to).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusPill status={l.status} />
                </button>
              ))}
            </div>
          </Card>

          {/* Open Complaints */}
          <Card className="p-6 flex flex-col">
            <SectionHeader eyebrow="Complaints" title="Open Complaints" />
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px]">
              {recentComplaints.length === 0 && <p className="text-sm text-ink/50">No open complaints.</p>}
              {recentComplaints.map((c) => (
                <button
                  key={c.complaintId || c._id}
                  onClick={() => navigate(`/${user?.role}/complaints`)}
                  className="w-full flex items-start justify-between gap-3 pb-3 border-b border-line last:border-0 last:pb-0 text-left hover:bg-parchment/60 -mx-2 px-2 pt-1.5 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{c.title || c.category}</p>
                    <p className="text-xs text-ink/50 mt-0.5">
                      {c.studentId?.name || "Student"} • {new Date(c.date || c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusPill status={c.status} />
                </button>
              ))}
            </div>
          </Card>

          {/* Recent Notices */}
          <Card className="p-6 flex flex-col lg:col-span-2">
            <SectionHeader eyebrow="Notice Board" title="Recent Hostel Circulars & Announcements" />
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px]">
              {recentNotices.length === 0 && <p className="text-sm text-ink/50">No recent circulars.</p>}
              {recentNotices.map((n) => (
                <button
                  key={n.noticeId || n._id}
                  onClick={() => navigate(`/${user?.role}/notices`)}
                  className="w-full flex items-start justify-between gap-3 pb-3 border-b border-line last:border-0 last:pb-0 text-left hover:bg-parchment/60 -mx-2 px-2 pt-1.5 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    <p className="text-xs text-ink/50 mt-0.5 line-clamp-1">{n.description}</p>
                  </div>
                  <span className="text-xs text-ink/40 shrink-0">
                    {new Date(n.date).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
