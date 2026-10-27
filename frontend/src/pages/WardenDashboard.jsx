import {
  Users, BedDouble, Wrench, ShieldAlert, UtensilsCrossed, Coffee, Sun, Moon, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, StatCard, KeyTag, StatusPill } from "../components/ui";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import {
  students as seedStudents, rooms as seedRooms,
  complaints as seedComplaints, leaveRequests as seedLeave,
  messMenu as seedMessMenu, canteenMenuItems as seedMenuItems,
} from "../data/mockData";

export default function WardenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students] = useLocalStorage("shms:students", seedStudents);
  const [rooms] = useLocalStorage("shms:rooms", seedRooms);
  const [complaints] = useLocalStorage("shms:complaints", seedComplaints);
  const [leaveRequests] = useLocalStorage("shms:leave", seedLeave);
  const [messMenu] = useLocalStorage("shms:messMenu", seedMessMenu);
  const [canteenItems] = useLocalStorage("shms:canteenItems", seedMenuItems);

  const occupiedBeds = rooms.reduce((s, r) => s + Number(r.occupied), 0);
  const totalBeds = rooms.reduce((s, r) => s + Number(r.capacity), 0);
  const openComplaints = complaints.filter((c) => c.status !== "Resolved");
  const pendingLeaves = leaveRequests.filter((l) => l.status === "Pending");

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const today = DAYS[(new Date().getDay() + 6) % 7];
  const todayMeals = messMenu[today] || {
    breakfast: "Not scheduled",
    lunch: "Not scheduled",
    dinner: "Not scheduled",
  };
  const availableCanteenCount = (canteenItems || []).filter((i) => i.status !== "Out of Stock").length;

  return (
    <div>
      <Topbar title="Warden Dashboard" subtitle="Student operations, mess & canteen tracking" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Total Students" value={students.length} sub="currently enrolled" icon={Users} />
          <StatCard
            label="Beds Occupied"
            value={`${occupiedBeds}/${totalBeds}`}
            sub="current capacity"
            icon={BedDouble}
            accent="tag"
          />
          <StatCard label="Pending Leaves" value={pendingLeaves.length} sub="waiting approval" icon={ShieldAlert} />
          <StatCard label="Open Complaints" value={openComplaints.length} sub="needs attention" icon={Wrench} accent="tag" />
          <StatCard
            label={`Mess — ${today}`}
            value="3 Meals"
            sub="daily schedule active"
            icon={Coffee}
            accent="tag"
          />
          <StatCard
            label="Canteen Menu"
            value={`${availableCanteenCount} Active`}
            sub={`${canteenItems.length} total items`}
            icon={UtensilsCrossed}
          />
        </div>

        {/* Canteen & Mess Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Mess Menu Card */}
          <Card className="p-6">
            <SectionHeader
              eyebrow="Dining & Mess"
              title={`Today's Mess Menu — ${today}`}
              action={
                <button
                  onClick={() => navigate(`/${user?.role}/mess`)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-navy bg-navy/5 hover:bg-navy/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Full Weekly Menu <ArrowRight size={13} />
                </button>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3">
              <div className="bg-parchment/70 border border-line/60 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5 text-navy font-semibold text-xs">
                    <Coffee size={14} className="text-tag-dark" />
                    <span className="uppercase tracking-wider text-ink/70">Breakfast</span>
                  </div>
                  <p className="text-xs text-ink/80 leading-relaxed font-medium">
                    {todayMeals.breakfast || "—"}
                  </p>
                </div>
                <span className="text-[10px] text-ink/40 mt-2 font-mono">07:30 AM - 09:30 AM</span>
              </div>

              <div className="bg-parchment/70 border border-line/60 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5 text-navy font-semibold text-xs">
                    <Sun size={14} className="text-amber-600" />
                    <span className="uppercase tracking-wider text-ink/70">Lunch</span>
                  </div>
                  <p className="text-xs text-ink/80 leading-relaxed font-medium">
                    {todayMeals.lunch || "—"}
                  </p>
                </div>
                <span className="text-[10px] text-ink/40 mt-2 font-mono">12:30 PM - 02:30 PM</span>
              </div>

              <div className="bg-parchment/70 border border-line/60 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5 text-navy font-semibold text-xs">
                    <Moon size={14} className="text-indigo-600" />
                    <span className="uppercase tracking-wider text-ink/70">Dinner</span>
                  </div>
                  <p className="text-xs text-ink/80 leading-relaxed font-medium">
                    {todayMeals.dinner || "—"}
                  </p>
                </div>
                <span className="text-[10px] text-ink/40 mt-2 font-mono">07:30 PM - 09:30 PM</span>
              </div>
            </div>
          </Card>

          {/* Canteen & Menu Card */}
          <Card className="p-6">
            <SectionHeader
              eyebrow="Canteen Operations"
              title="Hostel Canteen & Menu"
              action={
                <button
                  onClick={() => navigate(`/${user?.role}/canteen`)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-navy bg-navy/5 hover:bg-navy/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Manage Canteen <ArrowRight size={13} />
                </button>
              }
            />
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {["South Indian", "Snacks & Fast Food", "Meals & Combos", "Beverages & Drinks"].map((cat) => {
                  const count = (canteenItems || []).filter((i) => i.category === cat).length;
                  return (
                    <div
                      key={cat}
                      onClick={() => navigate(`/${user?.role}/canteen`)}
                      className="cursor-pointer bg-white border border-line hover:border-navy/40 p-3 rounded-xl transition-all hover:shadow-xs group"
                    >
                      <p className="text-[11px] font-semibold text-ink/60 truncate group-hover:text-navy">{cat}</p>
                      <p className="text-lg font-bold font-display text-ink mt-0.5">
                        {count} <span className="text-[11px] font-normal text-ink/40">items</span>
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-line/60">
                <div className="flex items-center gap-2 text-xs text-ink/60">
                  <span className="w-2 h-2 rounded-full bg-ok animate-pulse"></span>
                  <span>Canteen is <strong>Active & Serving</strong></span>
                </div>
                <button
                  onClick={() => navigate(`/${user?.role}/canteen`)}
                  className="text-xs font-medium text-navy hover:underline"
                >
                  View items & sales ledger →
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <SectionHeader eyebrow="Approvals" title="Pending leave requests" />
            <div className="space-y-3">
              {pendingLeaves.length === 0 && <p className="text-sm text-ink/50">No pending requests.</p>}
              {pendingLeaves.map((l) => (
                <button
                  key={l.id}
                  onClick={() => navigate(`/${user?.role}/leaves`, { state: { openId: l.id } })}
                  className="w-full flex items-start justify-between gap-3 pb-3 border-b border-line last:border-0 last:pb-0 text-left hover:bg-parchment/60 -mx-2 px-2 pt-1.5 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{l.student}</p>
                    <p className="text-xs text-ink/50 mt-0.5">{l.from} → {l.to}</p>
                  </div>
                  <StatusPill status={l.status} />
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader eyebrow="Maintenance" title="Recent complaints" />
            <div className="space-y-3">
              {openComplaints.length === 0 && <p className="text-sm text-ink/50">No open complaints.</p>}
              {openComplaints.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/${user?.role}/complaints`, { state: { openId: c.id } })}
                  className="w-full flex items-center justify-between gap-3 text-left hover:bg-parchment/60 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <KeyTag>{c.id}</KeyTag>
                    <div>
                      <p className="text-sm text-ink font-medium">{c.detail}</p>
                      <p className="text-xs text-ink/45">{c.student} · Room {c.room}</p>
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
