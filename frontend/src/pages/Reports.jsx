import { useState } from "react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, KeyTag, StatusPill } from "../components/ui";
import { Field, Select } from "../components/Modal";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { FileText, Printer, ShieldCheck, User, Calendar, Activity, CheckCircle, LogOut } from "lucide-react";
import { 
  students as seedStudents, 
  fees as seedFees, 
  leaveRequests as seedLeave,
  complaints as seedComplaints
} from "../data/mockData";
import { computeStudentAttendanceStats } from "../utils/attendance";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Reports() {
  const [students] = useLocalStorage("shms:students", seedStudents);
  const [fees] = useLocalStorage("shms:fees", seedFees);
  const [leaveRequests] = useLocalStorage("shms:leave", seedLeave);
  const [complaints] = useLocalStorage("shms:complaints", seedComplaints);
  const [records] = useLocalStorage("shms:attendanceRecords", {});

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reportData, setReportData] = useState(null);

  const generateReport = () => {
    if (!selectedStudentId) return;
    
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const studentFees = fees.filter(f => f.studentId === student.id);
    const studentLeaves = leaveRequests.filter(l => l.studentId === student.id);
    const studentComplaints = complaints.filter(c => c.student === student.name);
    const attendanceStats = computeStudentAttendanceStats(student, records, students);

    setReportData({
      student,
      fees: studentFees,
      leaves: studentLeaves,
      complaints: studentComplaints,
      attendanceStats,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print:bg-white print:min-h-screen">
      <div className="print:hidden">
        <Topbar title="Reports" subtitle="Generate and download student reports" />
      </div>
      
      <div className="p-8 print:p-0">
        <div className="print:hidden space-y-6">
          <Card className="p-6">
            <SectionHeader eyebrow="Generator" title="Student Comprehensive Report" />
            <div className="max-w-md mt-4 space-y-4">
              <Field label="Select Student">
                <Select
                  options={["", ...students.map(s => `${s.name} — ${s.id}`)]}
                  value={selectedStudentId ? `${students.find(s => s.id === selectedStudentId)?.name} — ${selectedStudentId}` : ""}
                  onChange={(e) => {
                    const id = e.target.value.split(" — ").pop();
                    setSelectedStudentId(id);
                  }}
                />
              </Field>
              <button 
                onClick={generateReport}
                disabled={!selectedStudentId}
                className="flex items-center gap-2 bg-navy text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-navy-light disabled:opacity-50 transition-colors"
              >
                <FileText size={16} /> Generate Report
              </button>
            </div>
          </Card>
        </div>

        {/* Report Preview / Print Area */}
        {reportData && (
          <div className="mt-8 print:mt-0 print:block">
            <Card className="p-8 bg-white print:shadow-none print:border-none print:rounded-none max-w-4xl mx-auto">
              
              {/* Header */}
              <div className="flex justify-between items-end mb-8 border-b-2 border-navy pb-6">
                <div>
                  <div className="flex items-center gap-2 text-navy mb-2">
                    <ShieldCheck size={28} />
                    <h1 className="font-display font-bold text-3xl tracking-tight">Hosteller</h1>
                  </div>
                  <p className="text-sm text-ink/70 uppercase tracking-widest font-semibold">Comprehensive Student Report</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink">Date Generated</p>
                  <p className="text-sm text-ink/70">{new Date().toLocaleDateString('en-IN')}</p>
                  <button 
                    onClick={handlePrint} 
                    className="print:hidden mt-3 flex items-center gap-2 bg-tag text-navy text-sm font-medium px-4 py-2 rounded-lg hover:bg-tag-dark transition-colors ml-auto"
                  >
                    <Printer size={16} /> Print / Save as PDF
                  </button>
                </div>
              </div>

              {/* Personal Details */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-navy mb-4 border-b border-line pb-2 flex items-center gap-2">
                  <User size={18} /> Personal & Academic Details
                </h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div><p className="text-xs text-ink/50 uppercase">Student Name</p><p className="font-semibold text-ink">{reportData.student.name}</p></div>
                  <div><p className="text-xs text-ink/50 uppercase">Student ID</p><p className="font-semibold text-ink">{reportData.student.id}</p></div>
                  <div><p className="text-xs text-ink/50 uppercase">Date of Joining</p><p className="font-semibold text-ink">{formatDate(reportData.student.dateOfJoining)}</p></div>
                  <div>
                    <p className="text-xs text-ink/50 uppercase">Date of Vacating</p>
                    <p className="font-semibold text-ink">
                      {reportData.student.dateOfVacating ? formatDate(reportData.student.dateOfVacating) : "Currently Residing (Active)"}
                    </p>
                  </div>
                  <div><p className="text-xs text-ink/50 uppercase">Course / Year</p><p className="font-medium text-ink">{reportData.student.course}</p></div>
                  <div><p className="text-xs text-ink/50 uppercase">Room Allocation</p><p className="font-medium text-ink">{reportData.student.room || "None"}</p></div>
                  <div><p className="text-xs text-ink/50 uppercase">Phone Number</p><p className="font-medium text-ink">{reportData.student.phone}</p></div>
                  <div><p className="text-xs text-ink/50 uppercase">Father's Name</p><p className="font-medium text-ink">{reportData.student.fatherName || "—"}</p></div>
                  <div className="col-span-2"><p className="text-xs text-ink/50 uppercase">Permanent Address</p><p className="font-medium text-ink">{reportData.student.address || "—"}</p></div>
                </div>
              </div>

              {/* Attendance Rate Analysis */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-navy mb-4 border-b border-line pb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Activity size={18} /> Attendance Rate Analysis</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${reportData.attendanceStats.badgeColor}`}>
                    {reportData.attendanceStats.analysis}
                  </span>
                </h2>
                <div className="grid grid-cols-4 gap-3 text-center bg-parchment/60 p-4 rounded-xl border border-line">
                  <div>
                    <p className="text-xs text-ink/50 uppercase">Present Days</p>
                    <p className="text-xl font-bold text-ok mt-1">{reportData.attendanceStats.presentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 uppercase">Absent Days</p>
                    <p className="text-xl font-bold text-warn mt-1">{reportData.attendanceStats.absentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 uppercase">Total Days</p>
                    <p className="text-xl font-bold text-ink mt-1">{reportData.attendanceStats.totalMarked}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 uppercase">Present Rate</p>
                    <p className="text-xl font-bold text-navy mt-1">{reportData.attendanceStats.format}</p>
                  </div>
                </div>
              </div>

              {/* Financial Status */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-navy mb-4 border-b border-line pb-2">Financial Status</h2>
                {reportData.fees.length === 0 ? (
                  <p className="text-sm text-ink/60">No fee records found.</p>
                ) : (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-parchment text-ink font-semibold">
                        <th className="py-2 px-3 border border-line">Receipt No.</th>
                        <th className="py-2 px-3 border border-line">Amount</th>
                        <th className="py-2 px-3 border border-line">Date Paid</th>
                        <th className="py-2 px-3 border border-line">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.fees.map(f => (
                        <tr key={f.id}>
                          <td className="py-2 px-3 border border-line">{f.id}</td>
                          <td className="py-2 px-3 border border-line">₹{Number(f.amount).toLocaleString('en-IN')}</td>
                          <td className="py-2 px-3 border border-line">{f.date || "—"}</td>
                          <td className="py-2 px-3 border border-line font-medium">{f.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Leaves & Outpasses */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-navy mb-4 border-b border-line pb-2">Leave & Outpass History</h2>
                {reportData.leaves.length === 0 ? (
                  <p className="text-sm text-ink/60">No leave requests found.</p>
                ) : (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-parchment text-ink font-semibold">
                        <th className="py-2 px-3 border border-line">Request ID</th>
                        <th className="py-2 px-3 border border-line">Duration</th>
                        <th className="py-2 px-3 border border-line">Reason</th>
                        <th className="py-2 px-3 border border-line">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.leaves.map(l => (
                        <tr key={l.id}>
                          <td className="py-2 px-3 border border-line">{l.id}</td>
                          <td className="py-2 px-3 border border-line">{l.from} to {l.to}</td>
                          <td className="py-2 px-3 border border-line">{l.reason}</td>
                          <td className="py-2 px-3 border border-line font-medium">{l.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Disciplinary & Complaints */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-navy mb-4 border-b border-line pb-2">Complaints Filed By Student</h2>
                {reportData.complaints.length === 0 ? (
                  <p className="text-sm text-ink/60">No complaints filed.</p>
                ) : (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-parchment text-ink font-semibold">
                        <th className="py-2 px-3 border border-line">Complaint ID</th>
                        <th className="py-2 px-3 border border-line">Date</th>
                        <th className="py-2 px-3 border border-line">Category</th>
                        <th className="py-2 px-3 border border-line">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.complaints.map(c => (
                        <tr key={c.id}>
                          <td className="py-2 px-3 border border-line">{c.id}</td>
                          <td className="py-2 px-3 border border-line">{c.date}</td>
                          <td className="py-2 px-3 border border-line">{c.category}</td>
                          <td className="py-2 px-3 border border-line font-medium">{c.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="mt-16 text-center text-sm text-ink/50 border-t border-line pt-4">
                <p>This is a system-generated report. Validated by Smart Hostel Management System.</p>
              </div>

            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
