import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User, BedDouble, CalendarClock, Wallet, Wrench, Menu, Info, Banknote, ShoppingCart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useSidebar } from "../context/SidebarContext";
import { ROLES } from "../utils/roles";
import {
  students as seedStudents,
  rooms as seedRooms,
  leaveRequests as seedLeave,
  complaints as seedComplaints,
  fees as seedFees,
  notices as seedNotices,
  salaryRecords as seedSalaries,
  canteenTransactions as seedCanteen
} from "../data/mockData";

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth();
  const isStaff = user?.role !== "student";
  const navigate = useNavigate();
  const { toggle } = useSidebar();

  const [students] = useLocalStorage("shms:students", seedStudents);
  const [rooms] = useLocalStorage("shms:rooms", seedRooms);
  const [leaveRequests] = useLocalStorage("shms:leave", seedLeave);
  const [complaints] = useLocalStorage("shms:complaints", seedComplaints);
  const [fees] = useLocalStorage("shms:fees", seedFees);
  const [notices] = useLocalStorage("shms:notices", seedNotices);
  const [salaries] = useLocalStorage("shms:salary", seedSalaries);
  const [canteen] = useLocalStorage("shms:canteen", seedCanteen);

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  
  // Persist read notifications per user
  const [readNotifs, setReadNotifs] = useLocalStorage(`shms:readNotifs_${user?.id || user?.role || 'default'}`, []);
  
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { students: [], rooms: [] };
    const matchedStudents = isStaff
      ? students.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.room?.toLowerCase().includes(q)).slice(0, 5)
      : [];
    const matchedRooms = isStaff
      ? rooms.filter((r) => r.number.toLowerCase().includes(q) || r.block.toLowerCase().includes(q)).slice(0, 5)
      : [];
    return { students: matchedStudents, rooms: matchedRooms };
  }, [query, students, rooms, isStaff]);

  const hasResults = results.students.length > 0 || results.rooms.length > 0;

  const goTo = (path) => {
    navigate(`/${user.role}${path}`);
    setQuery("");
    setSearchOpen(false);
  };

  // Build a small set of real, live notifications from actual app data tailored per role.
  const notifications = useMemo(() => {
    if (!user) return [];
    const items = [];
    const prefix = `/${user.role}`;

    switch (user.role) {
      case ROLES.ADMIN:
        complaints.filter(c => c.status === "Open").slice(0, 2).forEach(c => 
          items.push({ id: `cmp-${c.id}`, icon: Wrench, text: `Unresolved complaint in ${c.room}`, path: `${prefix}/complaints` })
        );
        fees.filter(f => f.status === "Overdue").slice(0, 2).forEach(f => 
          items.push({ id: `fee-${f.id}`, icon: Wallet, text: `${f.student} has overdue fees`, path: `${prefix}/fees` })
        );
        leaveRequests.filter(l => l.status === "Pending").slice(0, 2).forEach(l => 
          items.push({ id: `leave-${l.id}`, icon: CalendarClock, text: `Pending leave for ${l.student}`, path: `${prefix}/leaves` })
        );
        break;

      case ROLES.WARDEN:
        leaveRequests.filter(l => l.status === "Pending").forEach(l => 
          items.push({ id: `leave-${l.id}`, icon: CalendarClock, text: `${l.student} requested leave`, path: `${prefix}/leaves` })
        );
        complaints.filter(c => c.status === "Open").forEach(c => 
          items.push({ id: `cmp-${c.id}`, icon: Wrench, text: `Maintenance request in ${c.room}`, path: `${prefix}/complaints` })
        );
        break;

      case ROLES.ACCOUNTANT:
        fees.filter(f => f.status === "Overdue").forEach(f => 
          items.push({ id: `fee-${f.id}`, icon: Wallet, text: `Overdue fee: ₹${f.amount} from ${f.student}`, path: `${prefix}/fees` })
        );
        salaries.filter(s => s.status === "Pending").forEach(s => 
          items.push({ id: `sal-${s.id}`, icon: Banknote, text: `Pending salary for ${s.staffName}`, path: `${prefix}/salaries` })
        );
        break;

      case ROLES.CANTEEN_MANAGER:
        const todaySales = canteen.filter(c => c.type === "Income").length;
        if (todaySales > 0) {
          items.push({ id: `cnt-sales`, icon: ShoppingCart, text: `You have ${todaySales} recent sales recorded`, path: `${prefix}/sales` });
        }
        notices.slice(0, 2).forEach(n => 
          items.push({ id: `notice-${n.id}`, icon: Info, text: `New Notice: ${n.title}`, path: `${prefix}/dashboard` })
        );
        break;

      case ROLES.STAFF:
        notices.slice(0, 3).forEach(n => 
          items.push({ id: `notice-${n.id}`, icon: Info, text: `Notice: ${n.title}`, path: `${prefix}/notices` })
        );
        break;

      case ROLES.STUDENT:
        const myLeaves = leaveRequests.filter(r => r.studentId === user.studentId && r.status !== "Pending");
        myLeaves.slice(-2).forEach(r => 
          items.push({ id: `leave-${r.id}`, icon: CalendarClock, text: `Your leave request was ${r.status}`, path: `${prefix}/leave` })
        );
        const myDueFees = fees.filter(f => f.studentId === user.studentId && f.status !== "Paid");
        myDueFees.forEach(f => 
          items.push({ id: `fee-${f.id}`, icon: Wallet, text: `You have ${f.status.toLowerCase()} fees of ₹${f.amount}`, path: `${prefix}/fees` })
        );
        notices.slice(0, 2).forEach(n => 
          items.push({ id: `notice-${n.id}`, icon: Info, text: `Notice: ${n.title}`, path: `${prefix}/notices` })
        );
        break;
    }

    return items.slice(0, 8); // Cap at 8 notifications
  }, [user, leaveRequests, complaints, fees, notices, salaries, canteen]);

  const unreadCount = notifications.filter(n => !readNotifs.includes(n.id)).length;

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifs(allIds);
  };

  const handleNotificationClick = (n) => {
    if (!readNotifs.includes(n.id)) {
      setReadNotifs([...readNotifs, n.id]);
    }
    navigate(n.path);
    setNotifOpen(false);
  };

  return (
    <header className="h-16 sticky top-0 z-40 bg-parchment/90 backdrop-blur border-b border-line flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="lg:hidden p-2 -ml-2 text-ink/70 hover:text-ink transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-display font-bold text-lg text-ink leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-ink/50 mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div ref={searchRef} className="relative hidden sm:block">
          <div className="flex items-center gap-2 bg-white border border-line rounded-lg px-3 py-1.5 w-64">
            <Search size={15} className="text-ink/40" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => query && setSearchOpen(true)}
              placeholder={isStaff ? "Search students, rooms…" : "Search…"}
              className="text-sm outline-none bg-transparent w-full placeholder:text-ink/35"
            />
          </div>
          {searchOpen && query.trim() && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-line rounded-xl shadow-xl overflow-hidden max-h-96 overflow-y-auto">
              {!isStaff && (
                <p className="px-4 py-3 text-xs text-ink/50">Search is available to hostel staff.</p>
              )}
              {isStaff && !hasResults && (
                <p className="px-4 py-3 text-xs text-ink/50">No matches for "{query}".</p>
              )}
              {isStaff && results.students.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink/40 uppercase tracking-wide">Students</p>
                  {results.students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => goTo("/students")}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-parchment transition-colors"
                    >
                      <User size={14} className="text-navy shrink-0" />
                      <span className="text-sm text-ink truncate">{s.name}</span>
                      <span className="text-xs text-ink/40 ml-auto shrink-0">{s.id}</span>
                    </button>
                  ))}
                </div>
              )}
              {isStaff && results.rooms.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink/40 uppercase tracking-wide">Rooms</p>
                  {results.rooms.map((r) => (
                    <button
                      key={r.number}
                      onClick={() => goTo("/rooms")}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-parchment transition-colors"
                    >
                      <BedDouble size={14} className="text-navy shrink-0" />
                      <span className="text-sm text-ink truncate">Room {r.number}</span>
                      <span className="text-xs text-ink/40 ml-auto shrink-0">Block {r.block}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              // Option: mark all as read automatically when panel opens
              // if (!notifOpen) handleMarkAllRead();
            }}
            className="relative w-9 h-9 rounded-lg bg-white border border-line flex items-center justify-center text-ink/60 hover:text-ink transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-warn text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md border border-line rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up origin-top-right transition-all">
              <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-parchment/50">
                <p className="text-xs font-semibold text-ink/60 uppercase tracking-wide">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] font-semibold text-navy hover:underline transition-colors">Mark all as read</button>
                )}
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-2">
                {notifications.length === 0 && (
                  <p className="px-4 py-6 text-sm text-ink/45 text-center">You're all caught up.</p>
                )}
                {notifications.map((n) => {
                  const Icon = n.icon;
                  const isUnread = !readNotifs.includes(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-xl transition-colors mb-1 last:mb-0 ${isUnread ? 'bg-navy/5 hover:bg-navy/10' : 'hover:bg-ink/5'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center mt-0.5 ${isUnread ? 'bg-navy/15 text-navy' : 'bg-ink/10 text-ink/60'}`}>
                        <Icon size={14} />
                      </div>
                      <span className={`text-sm leading-snug ${isUnread ? 'text-ink font-semibold' : 'text-ink/70 font-medium'}`}>{n.text}</span>
                      {isUnread && <div className="w-2 h-2 rounded-full bg-navy mt-1.5 shrink-0 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="w-9 h-9 rounded-lg bg-navy text-white font-display font-semibold text-sm flex items-center justify-center">
          {initials(user?.name) || "?"}
        </div>
      </div>
    </header>
  );
}
