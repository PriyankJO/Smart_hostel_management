import { useState, useEffect } from "react";
import { Wallet, Wrench, GraduationCap, Phone, Activity, BedDouble, X, Calendar, Utensils, Users, Coffee, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, StatCard, KeyTag, RoomTag, StatusPill } from "../components/ui";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import { computeAttendancePct, computeStudentAttendanceStats } from "../utils/attendance";
import api from "../services/api";
import {
  students as seedStudents, fees as seedFees,
  complaints as seedComplaints, leaveRequests as seedLeave, notices as seedNotices,
  visitors as seedVisitors, messMenu as seedMessMenu,
} from "../data/mockData";

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students] = useLocalStorage("shms:students", seedStudents);
  const [fees, setFees] = useLocalStorage("shms:fees", seedFees);
  const [complaints] = useLocalStorage("shms:complaints", seedComplaints);
  const [leaveRequests] = useLocalStorage("shms:leave", seedLeave);
  const [notices] = useLocalStorage("shms:notices", seedNotices);
  const [visitors] = useLocalStorage("shms:visitors", seedVisitors);
  const [messMenu] = useLocalStorage("shms:messMenu", seedMessMenu);
  const [records] = useLocalStorage("shms:attendanceRecords", {});
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const res = await api.get('/fees');
        if (res.data && res.data.success) {
          const mapped = res.data.data.map(f => ({
            _id: f._id,
            id: f.receiptId,
            student: f.studentId ? f.studentId.name : "Unknown",
            studentId: f.studentId ? f.studentId.studentId : "Unknown",
            amount: f.amount,
            date: f.date ? f.date.split('T')[0] : "",
            status: f.status
          }));
          setFees(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch fees", error);
      }
    };
    fetchFees();
  }, []);

  const me = students.find((s) => String(s.id).trim().toLowerCase() === String(user?.studentId || "").trim().toLowerCase());
  const myStats = me ? computeStudentAttendanceStats(me, records, students) : null;
  const myFees = fees.filter((f) => f.studentId === user.studentId);
  const myComplaints = complaints.filter((c) => c.student === user.name);
  const myLeaves = leaveRequests.filter((l) => l.studentId === user.studentId || l.student === user.name);
  const myVisitors = visitors.filter((v) => v.toMeet === user.name);
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todaysMenu = messMenu ? messMenu[todayName] : null;

  return (
    <div>
      <div className="relative z-50 opacity-0 animate-fade-in">
        <Topbar title={`Welcome, ${user.name.split(" ")[0]}`} subtitle="Your hostel overview" />
      </div>
      <div className="p-8 space-y-6">
        <Card className="p-6 flex items-center gap-4 opacity-0 animate-fade-in-up [animation-delay:100ms]">
          <div className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center font-display font-bold text-lg shrink-0">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-lg text-ink">{user.name}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {me && <KeyTag>{me.id}</KeyTag>}
              {me && <RoomTag room={me.room} />}
              {me && <StatusPill status={me.feeStatus} />}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard className="opacity-0 animate-fade-in-up [animation-delay:200ms]" label="Fee status" value={me?.feeStatus || "—"} icon={Wallet} />
          <StatCard 
            className="opacity-0 animate-fade-in-up [animation-delay:250ms]" 
            label="Attendance Rate" 
            value={myStats?.rate !== null && myStats?.rate !== undefined ? `${myStats.rate}%` : "No data yet"} 
            sub={myStats?.format ? `${myStats.format} (${myStats.analysis})` : "Pending roll call"} 
            icon={Activity} 
            accent="tag" 
          />
          <StatCard className="opacity-0 animate-fade-in-up [animation-delay:300ms]" label="My complaints" value={myComplaints.length} sub="raised so far" icon={Wrench} />
          <StatCard className="opacity-0 animate-fade-in-up [animation-delay:350ms]" label="My leave requests" value={myLeaves.length} sub="submitted so far" icon={GraduationCap} accent="tag" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 opacity-0 animate-fade-in-up [animation-delay:400ms]">
            <SectionHeader eyebrow="Course & contact" title="My details" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5"><GraduationCap size={16} className="text-navy" /> {me?.course || "—"}</div>
              <div className="flex items-center gap-2.5"><BedDouble size={16} className="text-navy" /> Room {me?.room || "—"}</div>
              <div className="flex items-center gap-2.5"><Calendar size={16} className="text-navy" /> Joined: {formatDate(me?.dateOfJoining)}</div>
              {me?.dateOfVacating && (
                <div className="flex items-center gap-2.5 text-warn"><Calendar size={16} /> Vacated: {formatDate(me.dateOfVacating)}</div>
              )}
              <div className="flex items-center gap-2.5"><Phone size={16} className="text-navy" /> {me?.phone || "—"}</div>
            </div>
          </Card>

          <Card className="p-6 opacity-0 animate-fade-in-up [animation-delay:450ms]">
            <SectionHeader eyebrow="Announcements" title="Latest notices" />
            <div className="space-y-3">
              {notices.slice(0, 4).map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                  className="w-full flex items-start justify-between gap-3 text-left hover:bg-parchment/60 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm text-ink font-medium">{n.title}</p>
                    <p className="text-xs text-ink/45 mt-0.5">{n.date}</p>
                  </div>
                  <span className="text-xs font-semibold text-navy/70 bg-navy/8 px-2 py-1 rounded-md whitespace-nowrap">{n.tag}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {myFees.length > 0 && (
          <Card className="p-6 opacity-0 animate-fade-in-up [animation-delay:500ms]">
            <SectionHeader eyebrow="Fees" title="My payment records" />
            <div className="space-y-3">
              {myFees.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <KeyTag>{f.id}</KeyTag>
                    <span className="text-sm text-ink">₹{Number(f.amount).toLocaleString("en-IN")}</span>
                  </div>
                  <StatusPill status={f.status} />
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 opacity-0 animate-fade-in-up [animation-delay:550ms]">
            <SectionHeader eyebrow="Dining" title="Today's Mess Menu" />
            <div className="space-y-4 text-sm mt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-navy/10 text-navy rounded-lg"><Coffee size={16} /></div>
                <div>
                  <p className="font-semibold text-ink">Breakfast</p>
                  <p className="text-ink/70">{todaysMenu?.breakfast || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-navy/10 text-navy rounded-lg"><Sun size={16} /></div>
                <div>
                  <p className="font-semibold text-ink">Lunch</p>
                  <p className="text-ink/70">{todaysMenu?.lunch || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-navy/10 text-navy rounded-lg"><Moon size={16} /></div>
                <div>
                  <p className="font-semibold text-ink">Dinner</p>
                  <p className="text-ink/70">{todaysMenu?.dinner || "—"}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 opacity-0 animate-fade-in-up [animation-delay:600ms]">
            <SectionHeader eyebrow="Guests" title="My Visitors" />
            <div className="space-y-3 mt-4">
              {myVisitors.length > 0 ? (
                myVisitors.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-3 bg-parchment/40 p-3 rounded-lg border border-line/50">
                    <div>
                      <p className="text-sm font-semibold text-ink">{v.name}</p>
                      <p className="text-xs text-ink/60">{v.purpose}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-navy bg-navy/10 px-2 py-0.5 rounded">In: {v.in}</p>
                      <p className="text-xs text-ink/50 mt-1">Out: {v.out !== "—" ? v.out : "Still inside"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink/50 italic py-4 text-center">No visitors recorded.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Notice Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-parchment/30">
              <h3 className="font-display font-bold text-lg text-ink">Notice Details</h3>
              <button
                onClick={() => setSelectedNotice(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10 text-ink/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-navy/70 bg-navy/8 px-2.5 py-1 rounded-md">
                  {selectedNotice.tag}
                </span>
                <span className="text-xs text-ink/50 flex items-center gap-1.5 font-medium">
                  <Calendar size={14} /> {selectedNotice.date}
                </span>
              </div>

              <h2 className="text-xl font-bold text-ink mb-4 leading-tight">{selectedNotice.title}</h2>

              <div className="text-sm text-ink/80 leading-relaxed bg-parchment/50 p-5 rounded-xl border border-line/50">
                {selectedNotice.content ? (
                  <p>{selectedNotice.content}</p>
                ) : (
                  <p className="italic text-ink/40">No additional details provided.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-line bg-parchment/30 flex justify-end">
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-sm font-semibold text-white bg-navy hover:bg-navy-light px-5 py-2.5 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
