import { CalendarDays, CheckCircle2, Clock } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, Table, StatusPill } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { staffAttendanceRecords as seedAttendance, staffAccounts as seedStaff } from "../data/mockData";

export default function StaffAttendance() {
  const { user } = useAuth();
  const [allAttendance] = useLocalStorage("shms:staffAttendance", seedAttendance);
  const [staff] = useLocalStorage("shms:staff", seedStaff);

  const myDetails = staff.find(s => s.name === user.name) || { id: "STF-XXX", name: user.name };

  const attendance = allAttendance.filter(r => r.staffId === myDetails.id || r.staffName === user.name);

  const presentCount = attendance.filter(r => r.status === "Present").length;
  const totalDays = attendance.length;
  const attendanceScore = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] animate-fade-in-up">
      <Topbar title="My Attendance" subtitle="View your daily check-in records" />
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Card className="flex-1 p-6 bg-gradient-to-br from-ok/10 to-ok/20 border-ok/20">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="text-ok" size={24} />
              <h3 className="font-display font-semibold text-lg text-ok-dark">Attendance Score</h3>
            </div>
            <p className="text-3xl font-bold text-ok">{attendanceScore}%</p>
            <p className="text-sm text-ok-dark/70 mt-1">Overall percentage</p>
          </Card>
          
          <Card className="flex-1 p-6 bg-gradient-to-br from-navy/5 to-navy/10 border-navy/10">
             <div className="flex items-center gap-3 mb-2">
              <CalendarDays className="text-navy" size={24} />
              <h3 className="font-display font-semibold text-lg text-navy-dark">Days Present</h3>
            </div>
            <p className="text-3xl font-bold text-navy">{presentCount}</p>
            <p className="text-sm text-navy-dark/70 mt-1">Out of {totalDays} recorded days</p>
          </Card>
        </div>

        <Card className="p-6">
          <SectionHeader eyebrow="Records" title="Recent Check-ins" />
          
          {attendance.length === 0 ? (
            <div className="mt-4 text-center py-12 bg-white/50 border border-dashed border-line rounded-xl">
              <CalendarDays size={40} className="mx-auto text-ink/20 mb-3" />
              <p className="text-ink/60 font-medium">Your RFID logs will appear here.</p>
              <p className="text-ink/40 text-sm mt-1">Biometric integration is active.</p>
            </div>
          ) : (
            <Table headers={["Date", "Status", "Time In", "Time Out", "Source"]}>
              {attendance.map((rec, i) => (
                <tr key={i} className="hover:bg-parchment/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-ink">{rec.date}</td>
                  <td className="py-3 px-4">
                    <StatusPill status={rec.status} />
                  </td>
                  <td className="py-3 px-4 text-ink/70">
                    {rec.timeIn !== "—" ? (
                      <span className="flex items-center gap-1"><Clock size={12} className="text-ink/40"/>{rec.timeIn}</span>
                    ) : "—"}
                  </td>
                  <td className="py-3 px-4 text-ink/70">
                    {rec.timeOut !== "—" ? (
                      <span className="flex items-center gap-1"><Clock size={12} className="text-ink/40"/>{rec.timeOut}</span>
                    ) : "—"}
                  </td>
                  <td className="py-3 px-4 text-ink/50 text-sm">{rec.source}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
