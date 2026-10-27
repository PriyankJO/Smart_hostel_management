import { User, Phone, MapPin, Calendar, Heart, GraduationCap, LogOut, CheckCircle, Activity } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, KeyTag, RoomTag, StatusPill } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { students as seedStudents } from "../data/mockData";
import { computeStudentAttendanceStats } from "../utils/attendance";

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function StudentProfile() {
  const { user } = useAuth();
  const [students] = useLocalStorage("shms:students", seedStudents);
  const [records] = useLocalStorage("shms:attendanceRecords", {});

  const me = students.find((s) => String(s.id).trim().toLowerCase() === String(user?.studentId || "").trim().toLowerCase());

  if (!me) {
    return (
      <div>
        <div className="opacity-0 animate-fade-in">
          <Topbar title="My Profile" subtitle="Student details" />
        </div>
        <div className="p-8">
          <p className="text-sm text-ink/50">Student profile not found.</p>
        </div>
      </div>
    );
  }

  const attendanceStats = computeStudentAttendanceStats(me, records, students);

  return (
    <div>
      <div className="relative z-50 opacity-0 animate-fade-in">
        <Topbar title="My Profile" subtitle="Manage your personal details" />
      </div>
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        
        {/* Identity Card */}
        <Card className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6 opacity-0 animate-fade-in-up [animation-delay:100ms]">
          <div className="w-24 h-24 rounded-full bg-navy text-white flex items-center justify-center font-display font-bold text-3xl shrink-0 shadow-lg">
            {initials(me.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-2xl text-ink">{me.name}</h1>
            <p className="text-sm text-ink/60 mt-1 flex items-center gap-2">
              <GraduationCap size={16} /> {me.course}
            </p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <KeyTag>{me.id}</KeyTag>
              <RoomTag room={me.room} />
              <StatusPill status={me.feeStatus} />
              {me.dateOfVacating ? (
                <span className="text-xs font-semibold text-warn bg-warn/10 px-2.5 py-1 rounded-md border border-warn/20 flex items-center gap-1">
                  <LogOut size={12} /> Vacated ({formatDate(me.dateOfVacating)})
                </span>
              ) : (
                <span className="text-xs font-semibold text-ok bg-ok/10 px-2.5 py-1 rounded-md border border-ok/20 flex items-center gap-1">
                  <CheckCircle size={12} /> Active Resident
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Attendance Rate Analysis Card */}
        <Card className="p-6 opacity-0 animate-fade-in-up [animation-delay:150ms]">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader eyebrow="Tracking" title="Attendance Rate Analysis" />
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${attendanceStats.badgeColor}`}>
              {attendanceStats.analysis}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
            <div className="bg-parchment p-3 rounded-lg border border-line">
              <p className="text-xs text-ink/50">Present Days</p>
              <p className="text-xl font-bold text-ok mt-0.5">{attendanceStats.presentCount}</p>
            </div>
            <div className="bg-parchment p-3 rounded-lg border border-line">
              <p className="text-xs text-ink/50">Absent Days</p>
              <p className="text-xl font-bold text-warn mt-0.5">{attendanceStats.absentCount}</p>
            </div>
            <div className="bg-parchment p-3 rounded-lg border border-line">
              <p className="text-xs text-ink/50">Total Conducted</p>
              <p className="text-xl font-bold text-ink mt-0.5">{attendanceStats.totalMarked}</p>
            </div>
            <div className="bg-parchment p-3 rounded-lg border border-line">
              <p className="text-xs text-ink/50">Present Rate</p>
              <p className="text-xl font-bold text-navy mt-0.5">{attendanceStats.rate !== null ? `${attendanceStats.rate}%` : "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-line rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${attendanceStats.rate < 75 ? "bg-warn" : attendanceStats.rate < 90 ? "bg-navy" : "bg-ok"}`}
                style={{ width: `${attendanceStats.rate || 0}%` }}
              />
            </div>
            <span className="text-sm font-bold text-ink">{attendanceStats.format}</span>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal & Residency Details */}
          <Card className="p-6 opacity-0 animate-fade-in-up [animation-delay:200ms]">
            <SectionHeader eyebrow="Personal" title="Hostel & Contact Details" />
            <div className="space-y-4 text-sm mt-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Date of Joining</p>
                  <p className="font-semibold text-ink mt-0.5">{formatDate(me.dateOfJoining)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0">
                  <LogOut size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Date of Vacating</p>
                  <p className="font-semibold text-ink mt-0.5">
                    {me.dateOfVacating ? formatDate(me.dateOfVacating) : "Currently Residing (Active)"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Phone Number</p>
                  <p className="font-medium text-ink mt-0.5">{me.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Date of Birth</p>
                  <p className="font-medium text-ink mt-0.5">{formatDate(me.dob)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Permanent Address</p>
                  <p className="font-medium text-ink mt-0.5 leading-relaxed">{me.address}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Emergency & Family */}
          <Card className="p-6 opacity-0 animate-fade-in-up [animation-delay:300ms]">
            <SectionHeader eyebrow="Emergency" title="Family Details" />
            <div className="space-y-4 text-sm mt-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-warn/10 flex items-center justify-center text-warn shrink-0">
                  <Heart size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Father / Guardian Name</p>
                  <p className="font-medium text-ink mt-0.5">{me.fatherName}</p>
                </div>
              </div>
              
              <div className="bg-tag/10 p-4 rounded-lg mt-6 border border-tag/20">
                <p className="text-xs font-semibold text-tag-dark uppercase tracking-wide">Important Note</p>
                <p className="text-sm text-ink/70 mt-1.5 leading-relaxed">
                  To update your personal details, permanent address, room status, or emergency contacts, please visit the Admin Office in Block A.
                </p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
