import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import {
  Check,
  X,
  Save,
  Users,
  Eye,
  Calendar,
  LogOut,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Download,
  Search,
  Filter,
  Activity,
  Info,
  RefreshCw,
  Clock,
  ArrowRight,
  BookOpen
} from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, Table, KeyTag, RoomTag, SectionHeader, StatusPill } from "../components/ui";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { students as seedStudents, leaveRequests as seedLeave } from "../data/mockData";
import {
  normalizeDateStr,
  normalizeEntry,
  computeStudentAttendanceStats,
  getStudentStatusForDate,
  exportAttendanceReportToCsv
} from "../utils/attendance";
import api from "../services/api";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const clean = normalizeDateStr(dateStr);
  if (!clean) return "—";
  const d = new Date(clean + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function expandDateRange(from, to) {
  const days = [];
  let cur = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  if (isNaN(cur.getTime()) || isNaN(end.getTime())) return days;
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export default function Attendance() {
  const { user } = useAuth();
  const isStaff = user?.role !== "student";

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState("rollcall"); // 'rollcall' | 'month-wise' | 'year-wise' | 'analytics' | 'checker'

  // Core Data States
  const [students, setStudents] = useLocalStorage("shms:students", seedStudents);
  const [records, setRecords] = useLocalStorage("shms:attendanceRecords", {});
  const [leaveRequests] = useLocalStorage("shms:leave", seedLeave);

  // Daily Roll Call States
  const [date, setDate] = useState(todayStr());
  const [searchQuery, setSearchQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'Present' | 'Absent' | 'Leave'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const [isLoadingRollcall, setIsLoadingRollcall] = useState(false);

  // Draft marks for the selected date: { studentId: { status, reason } }
  const [draft, setDraft] = useState({});

  // Month-Wise Filter States
  const [monthStudentId, setMonthStudentId] = useState("");
  const [monthYear, setMonthYear] = useState(new Date().getFullYear());
  const [monthNum, setMonthNum] = useState(new Date().getMonth() + 1);
  const [monthLeaveAsEligible, setMonthLeaveAsEligible] = useState(false);
  const [monthReportData, setMonthReportData] = useState(null);
  const [isLoadingMonthReport, setIsLoadingMonthReport] = useState(false);
  const [monthReportError, setMonthReportError] = useState("");

  // Year-Wise Filter States
  const [yearStudentId, setYearStudentId] = useState("");
  const [yearSelected, setYearSelected] = useState(new Date().getFullYear());
  const [yearLeaveAsEligible, setYearLeaveAsEligible] = useState(false);
  const [yearReportData, setYearReportData] = useState(null);
  const [isLoadingYearReport, setIsLoadingYearReport] = useState(false);
  const [yearReportError, setYearReportError] = useState("");

  // Absence Checker States
  const [reportRange, setReportRange] = useState("today");
  const [reportStartDate, setReportStartDate] = useState(todayStr());
  const [reportEndDate, setReportEndDate] = useState(todayStr());
  const [reportStudent, setReportStudent] = useState("all");
  const [reportResults, setReportResults] = useState(null);

  // Modal State
  const [historyFor, setHistoryFor] = useState(null);

  // 1. Fetch Students from DB
  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get("/students?limit=1000");
      if (res.data?.success && Array.isArray(res.data.data)) {
        const mapped = res.data.data.map((s) => ({
          _id: s._id,
          id: s.studentId,
          name: s.name,
          room: s.roomId ? s.roomId.roomNumber : "",
          block: s.roomId?.block ? `Block ${s.roomId.block}` : "Main Hostel",
          course: s.course,
          year: s.year,
          phone: s.phone,
          dob: s.dob ? normalizeDateStr(s.dob) : "",
          feeStatus: s.feeStatus,
          attendance: s.attendance || 0,
          dateOfJoining: s.dateOfJoining ? normalizeDateStr(s.dateOfJoining) : (s.admissionDate ? normalizeDateStr(s.admissionDate) : ""),
          dateOfVacating: s.dateOfVacating ? normalizeDateStr(s.dateOfVacating) : "",
          status: s.status || "Active",
        }));
        setStudents(mapped);

        // Pre-select first student for reports if unselected
        if (!monthStudentId && mapped.length > 0) {
          setMonthStudentId(mapped[0].id);
        }
        if (!yearStudentId && mapped.length > 0) {
          setYearStudentId(mapped[0].id);
        }
      }
    } catch (err) {
      console.warn("Using local students storage fallback", err?.message);
    }
  }, [monthStudentId, yearStudentId, setStudents]);

  // Active hostel students only (vacated students directly excluded from attendance module)
  const activeStudents = useMemo(() => {
    return students.filter((s) => s.status !== "Vacated" && !s.dateOfVacating);
  }, [students]);

  // Keep month and year report student selection pointed at an active student
  useEffect(() => {
    if (activeStudents.length > 0) {
      if (!monthStudentId || !activeStudents.some((s) => s.id === monthStudentId)) {
        setMonthStudentId(activeStudents[0].id);
      }
      if (!yearStudentId || !activeStudents.some((s) => s.id === yearStudentId)) {
        setYearStudentId(activeStudents[0].id);
      }
    }
  }, [activeStudents, monthStudentId, yearStudentId]);

  // When any student vacates, directly remove their attendance records from local storage records
  useEffect(() => {
    const vacatedIds = new Set(
      students.filter((s) => s.status === "Vacated" || s.dateOfVacating).map((s) => s.id)
    );
    if (vacatedIds.size > 0) {
      setRecords((prev) => {
        let changed = false;
        const updated = { ...prev };
        Object.keys(updated).forEach((d) => {
          if (updated[d]) {
            vacatedIds.forEach((vId) => {
              if (updated[d][vId]) {
                delete updated[d][vId];
                changed = true;
              }
            });
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [students, setRecords]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 2. Fetch/Load Roll Call for Selected Date
  const loadRollCallForDate = useCallback(async (targetDate) => {
    setIsLoadingRollcall(true);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    try {
      // Try backend sheet API
      const res = await api.get(`/attendance/rollcall-sheet?date=${targetDate}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const newDraft = {};
        res.data.data.forEach((item) => {
          newDraft[item.studentId] = {
            status: item.attendanceStatus || "Present",
            reason: item.remarks || ""
          };
        });
        setDraft(newDraft);
        setIsLoadingRollcall(false);
        return;
      }
    } catch (err) {
      // Fallback to local storage draft builder
    }

    // Local fallback - only populate for active residents
    const existing = records[targetDate] || {};
    const init = {};
    activeStudents.forEach((s) => {
      const eligibility = getStudentStatusForDate(s, targetDate);
      const norm = normalizeEntry(existing[s.id]);
      if (norm) {
        init[s.id] = norm;
      } else if (!eligibility.eligible) {
        init[s.id] = { status: eligibility.reason, reason: eligibility.badge };
      } else {
        init[s.id] = { status: "Present", reason: "" };
      }
    });
    setDraft(init);
    setIsLoadingRollcall(false);
  }, [records, students]);

  useEffect(() => {
    loadRollCallForDate(date);
  }, [date, loadRollCallForDate]);

  // 3. Mark Single Student
  const mark = (studentId, status) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
  };

  const setReason = (studentId, reason) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], reason }
    }));
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
  };

  const markAll = (status) => {
    const all = { ...draft };
    activeStudents.forEach((s) => {
      const eligibility = getStudentStatusForDate(s, date);
      if (eligibility.eligible) {
        all[s.id] = {
          status,
          reason: status === "Present" ? "" : (draft[s.id]?.reason || "")
        };
      }
    });
    setDraft(all);
    setSaveSuccessMsg("");
  };

  // 4. Save Attendance
  const handleSaveAttendance = async () => {
    setIsSaving(true);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");

    const newRecords = { ...records, [date]: draft };
    setRecords(newRecords);

    try {
      // Exclude any vacated students from payload records
      const payloadRecords = Object.entries(draft)
        .filter(([stuId]) => {
          const s = students.find((st) => st.id === stuId);
          return s && s.status !== "Vacated" && !s.dateOfVacating;
        })
        .map(([stuId, entry]) => ({
          studentId: stuId,
          status: entry.status,
          remarks: entry.reason || "",
        }));

      const res = await api.post("/attendance", { date, records: payloadRecords });
      if (res.data?.success) {
        setSaveSuccessMsg(res.data.message || `Attendance saved successfully for ${date}!`);
        await fetchStudents();
        if (monthStudentId) fetchMonthWiseReport();
        if (yearStudentId) fetchYearWiseReport();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save attendance";
      setSaveErrorMsg(msg);
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveSuccessMsg("");
      }, 5000);
    }
  };

  // 5. Fetch Month-Wise Attendance Report
  const fetchMonthWiseReport = useCallback(async () => {
    if (!monthStudentId) return;
    setIsLoadingMonthReport(true);
    setMonthReportError("");
    try {
      const res = await api.get(`/attendance/month-wise`, {
        params: {
          studentId: monthStudentId,
          year: monthYear,
          month: monthNum,
          leaveAsEligible: monthLeaveAsEligible
        }
      });
      if (res.data?.success) {
        setMonthReportData(res.data.data);
      }
    } catch (err) {
      setMonthReportError(err.response?.data?.message || "Failed to fetch month report from server");
    } finally {
      setIsLoadingMonthReport(false);
    }
  }, [monthStudentId, monthYear, monthNum, monthLeaveAsEligible]);

  useEffect(() => {
    if (activeTab === "month-wise" && monthStudentId) {
      fetchMonthWiseReport();
    }
  }, [activeTab, monthStudentId, monthYear, monthNum, monthLeaveAsEligible, fetchMonthWiseReport]);

  // 6. Fetch Year-Wise Attendance Report
  const fetchYearWiseReport = useCallback(async () => {
    if (!yearStudentId) return;
    setIsLoadingYearReport(true);
    setYearReportError("");
    try {
      const res = await api.get(`/attendance/year-wise`, {
        params: {
          studentId: yearStudentId,
          year: yearSelected,
          leaveAsEligible: yearLeaveAsEligible
        }
      });
      if (res.data?.success) {
        setYearReportData(res.data.data);
      }
    } catch (err) {
      setYearReportError(err.response?.data?.message || "Failed to fetch annual report from server");
    } finally {
      setIsLoadingYearReport(false);
    }
  }, [yearStudentId, yearSelected, yearLeaveAsEligible]);

  useEffect(() => {
    if (activeTab === "year-wise" && yearStudentId) {
      fetchYearWiseReport();
    }
  }, [activeTab, yearStudentId, yearSelected, yearLeaveAsEligible, fetchYearWiseReport]);

  // Filtered roll call students: Vacated students directly removed!
  const filteredStudents = useMemo(() => {
    return activeStudents.filter((s) => {
      // Search match
      const q = searchQuery.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.room && s.room.toLowerCase().includes(q));

      // Room filter
      const matchRoom = roomFilter === "all" || s.room === roomFilter;

      // Status filter
      const entryStatus = draft[s.id]?.status || "Unmarked";
      const matchStatus = statusFilter === "all" || entryStatus === statusFilter;

      return matchSearch && matchRoom && matchStatus;
    });
  }, [activeStudents, searchQuery, roomFilter, statusFilter, draft]);

  // Roll call summary statistics for the selected date (active residents only)
  const rollCallStats = useMemo(() => {
    const eligibleStudents = activeStudents.filter((s) => getStudentStatusForDate(s, date).eligible);
    const present = eligibleStudents.filter((s) => draft[s.id]?.status === "Present").length;
    const absent = eligibleStudents.filter((s) => draft[s.id]?.status === "Absent").length;
    const unrecorded = eligibleStudents.length - (present + absent);

    return {
      totalEligible: eligibleStudents.length,
      present,
      absent,
      unrecorded,
      rate: eligibleStudents.length > 0 ? Math.round((present / eligibleStudents.length) * 100) : 0
    };
  }, [activeStudents, date, draft]);

  // Dynamic live rate analysis per active student across all records
  const liveRecords = useMemo(() => {
    return { ...records, [date]: draft };
  }, [records, date, draft]);

  const computedAttendance = useMemo(() => {
    const result = {};
    activeStudents.forEach((s) => {
      result[s.id] = computeStudentAttendanceStats(s, liveRecords, activeStudents);
    });
    return result;
  }, [liveRecords, activeStudents]);

  // Aggregate statistics for Analytics tab
  const aggregateStats = useMemo(() => {
    const allStats = activeStudents.map((s) => computedAttendance[s.id] || {});
    const activeWithData = allStats.filter((st) => st.rate !== null);
    const overallRate = activeWithData.length > 0
      ? Math.round(activeWithData.reduce((acc, curr) => acc + (curr.rate || 0), 0) / activeWithData.length)
      : 0;

    return {
      total: activeStudents.length,
      active: activeStudents.length,
      vacated: students.length - activeStudents.length,
      overallRate,
      high: allStats.filter((st) => st.rate !== null && st.rate >= 90).length,
      normal: allStats.filter((st) => st.rate !== null && st.rate >= 75 && st.rate < 90).length,
      low: allStats.filter((st) => st.rate !== null && st.rate < 75).length,
      newJoiners: allStats.filter((st) => st.rate === null || st.totalMarked === 0).length,
    };
  }, [students, activeStudents, computedAttendance]);

  // Distinct rooms for dropdown filter (active residents)
  const distinctRooms = useMemo(() => {
    const set = new Set();
    activeStudents.forEach((s) => {
      if (s.room) set.add(s.room);
    });
    return Array.from(set).sort();
  }, [activeStudents]);

  // Absence history for modal (Absent records only)
  const absenceHistory = (studentId) => {
    const byDate = {};
    const mergedRecords = { ...records, [date]: draft };

    Object.keys(mergedRecords).forEach((d) => {
      const norm = normalizeEntry(mergedRecords[d]?.[studentId]);
      if (norm && norm.status === "Absent") {
        const savedNorm = records[d] ? normalizeEntry(records[d][studentId]) : null;
        const isUnsaved =
          d === date &&
          (!savedNorm || savedNorm.status !== norm.status || savedNorm.reason !== norm.reason);
        byDate[d] = {
          date: d,
          status: "Absent",
          reason: norm.reason,
          source: isUnsaved ? "Unsaved" : "Roll-call"
        };
      }
    });

    return Object.values(byDate).sort((a, b) => (a.date < b.date ? 1 : -1));
  };

  const historyStudent = historyFor ? students.find((s) => s.id === historyFor) : null;
  const historyList = historyFor ? absenceHistory(historyFor) : [];
  const historyStats = historyFor ? computedAttendance[historyFor] : null;

  // CSV Export Handlers
  const handleExportMonthCsv = () => {
    if (!monthReportData) return;
    const headers = ["Day", "Date", "Day of Week", "Eligibility", "Status", "Remarks"];
    const rows = (monthReportData.dailyBreakdown || []).map((d) => [
      d.dayNumber,
      d.date,
      d.dayOfWeek,
      d.isEligible ? "Eligible" : d.ineligibilityReason,
      d.status,
      d.remarks || ""
    ]);
    exportAttendanceReportToCsv(
      `attendance_${monthReportData.studentId}_${monthReportData.year}_${monthReportData.month}`,
      headers,
      rows
    );
  };

  const handleExportYearCsv = () => {
    if (!yearReportData) return;
    const headers = ["Month", "Days in Month", "Eligible Days", "Present Days", "Absent Days", "Leave Days", "Rate (%)", "Status"];
    const rows = (yearReportData.monthlyBreakdown || []).map((m) => [
      m.monthName,
      m.daysInMonth,
      m.totalEligibleDays,
      m.presentDays,
      m.absentDays,
      m.leaveDays,
      m.totalEligibleDays > 0 ? `${m.rate}%` : "N/A",
      m.status
    ]);
    exportAttendanceReportToCsv(
      `annual_attendance_${yearReportData.studentId}_${yearReportData.year}`,
      headers,
      rows
    );
  };

  // Absence Checker Run
  const handleGenerateAbsenceReport = () => {
    let start = reportStartDate;
    let end = reportEndDate;
    const today = new Date();

    if (reportRange === "today") {
      start = todayStr();
      end = todayStr();
    } else if (reportRange === "weekly") {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      start = lastWeek.toISOString().slice(0, 10);
      end = todayStr();
    } else if (reportRange === "monthly") {
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      start = lastMonth.toISOString().slice(0, 10);
      end = todayStr();
    }

    setReportStartDate(start);
    setReportEndDate(end);

    const dates = expandDateRange(start, end);
    let results = [];

    dates.forEach((d) => {
      const dayRecord = records[d] || {};
      const targetStudents = reportStudent === "all" ? activeStudents : activeStudents.filter((s) => s.id === reportStudent);

      targetStudents.forEach((s) => {
        const norm = normalizeEntry(dayRecord[s.id]);
        if (norm && norm.status === "Absent") {
          results.push({
            date: d,
            studentId: s.id,
            studentName: s.name,
            status: "Absent",
            reason: norm.reason,
            source: "Roll-call"
          });
        }
      });
    });

    results.sort((a, b) => (a.date > b.date ? -1 : 1));
    setReportResults(results);
  };

  return (
    <div>
      <Topbar
        title="Student Attendance Module"
        subtitle="Daily roll call, month-wise & year-wise reports, and automated vacancy exclusion"
      />

      <div className="p-8 space-y-6">

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-line pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("rollcall")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${
              activeTab === "rollcall"
                ? "bg-navy text-white shadow-sm"
                : "bg-white text-ink/70 hover:bg-parchment border border-line"
            }`}
          >
            <CheckCircle size={16} /> Daily Roll Call
          </button>
          <button
            onClick={() => setActiveTab("month-wise")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${
              activeTab === "month-wise"
                ? "bg-navy text-white shadow-sm"
                : "bg-white text-ink/70 hover:bg-parchment border border-line"
            }`}
          >
            <Calendar size={16} /> Month-Wise Report
          </button>
          <button
            onClick={() => setActiveTab("year-wise")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${
              activeTab === "year-wise"
                ? "bg-navy text-white shadow-sm"
                : "bg-white text-ink/70 hover:bg-parchment border border-line"
            }`}
          >
            <TrendingUp size={16} /> Year-Wise Report
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${
              activeTab === "analytics"
                ? "bg-navy text-white shadow-sm"
                : "bg-white text-ink/70 hover:bg-parchment border border-line"
            }`}
          >
            <Activity size={16} /> Rate Analytics & Progress
          </button>
          {isStaff && (
            <button
              onClick={() => setActiveTab("checker")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                activeTab === "checker"
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white text-ink/70 hover:bg-parchment border border-line"
              }`}
            >
              <Search size={16} /> Absence Checker
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: DAILY ROLL CALL                                   */}
        {/* ========================================================= */}
        {activeTab === "rollcall" && (
          <div className="space-y-6">

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Eligible Students</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-display text-navy">{rollCallStats.totalEligible}</span>
                  <Users size={16} className="text-navy" />
                </div>
                <span className="text-[11px] text-ink/45 mt-1">Excludes vacated students</span>
              </div>

              <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Present</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-display text-ok">{rollCallStats.present}</span>
                  <CheckCircle size={16} className="text-ok" />
                </div>
                <span className="text-[11px] text-ok font-medium mt-1">{rollCallStats.rate}% present rate</span>
              </div>

              <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Absent</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-display text-warn">{rollCallStats.absent}</span>
                  <AlertTriangle size={16} className="text-warn" />
                </div>
                <span className="text-[11px] text-warn font-medium mt-1">Absentees for date</span>
              </div>

              <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
                <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Hostel Vacated</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-display text-ink/60">{aggregateStats.vacated}</span>
                  <LogOut size={16} className="text-ink/40" />
                </div>
                <span className="text-[11px] text-ink/45 mt-1">Excluded from roll-call</span>
              </div>
            </div>

            {/* Notification messages */}
            {saveSuccessMsg && (
              <div className="flex items-center gap-2 bg-ok/10 border border-ok/30 text-ok-dark px-4 py-3 rounded-xl text-sm font-medium animate-fadeIn">
                <CheckCircle size={18} className="text-ok shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
            {saveErrorMsg && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-fadeIn">
                <AlertTriangle size={18} className="text-red-500 shrink-0" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            {/* Attendance Marking Card */}
            <Card className="p-6">
              <SectionHeader
                eyebrow="Roll call"
                title="Daily Attendance Marking"
                action={
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={todayStr()}
                      className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40 font-medium"
                    />
                    {isStaff && (
                      <>
                        <button
                          onClick={() => markAll("Present")}
                          className="text-xs font-semibold text-ok bg-ok/10 hover:bg-ok/20 px-3 py-2 rounded-lg transition-colors border border-ok/20 flex items-center gap-1"
                        >
                          <Check size={13} /> Mark All Present
                        </button>
                        <button
                          onClick={() => markAll("Absent")}
                          className="text-xs font-semibold text-warn bg-warn/10 hover:bg-warn/20 px-3 py-2 rounded-lg transition-colors border border-warn/20 flex items-center gap-1"
                        >
                          <X size={13} /> Mark All Absent
                        </button>
                      </>
                    )}
                    {isStaff && (
                      <button
                        onClick={handleSaveAttendance}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-navy-light transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw size={15} className="animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save size={15} /> Save Attendance
                          </>
                        )}
                      </button>
                    )}
                  </div>
                }
              />

              {/* Filters & Search Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-ink/40" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-line rounded-lg outline-none focus:border-navy/40"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter size={15} className="text-ink/40 shrink-0" />
                  <select
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40"
                  >
                    <option value="all">All Rooms</option>
                    {distinctRooms.map((r) => (
                      <option key={r} value={r}>
                        Room {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Present">Present Only</option>
                    <option value="Absent">Absent Only</option>
                  </select>
                </div>

                <div className="flex items-center justify-end text-xs text-ink/60 font-medium">
                  Showing <b>{filteredStudents.length}</b> eligible student(s)
                </div>
              </div>

              {isLoadingRollcall ? (
                <div className="py-12 text-center text-ink/50 space-y-2">
                  <RefreshCw size={24} className="animate-spin mx-auto text-navy" />
                  <p className="text-sm">Loading attendance sheet for {formatDate(date)}...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-ink/50 bg-parchment/40 rounded-xl">
                  <Users size={32} className="mx-auto mb-2 text-ink/30" />
                  <p className="text-base font-semibold text-ink">No eligible students found</p>
                  <p className="text-xs text-ink/60 mt-1">
                    Check your search or date filter. Students who have vacated the hostel are automatically excluded.
                  </p>
                </div>
              ) : (
                <Table
                  headers={[
                    "Student ID",
                    "Name",
                    "Hostel / Room",
                    "Stay Period",
                    "Attendance Mark",
                    "Remarks / Reason",
                    "Cumulative Format",
                    "Actions"
                  ]}
                >
                  {filteredStudents.map((s) => {
                    const eligibility = getStudentStatusForDate(s, date);
                    const entry = draft[s.id] || { status: "Present", reason: "" };
                    const stats = computedAttendance[s.id] || {};

                    return (
                      <tr key={s.id} className="hover:bg-parchment/60 transition-colors">
                        <td className="py-3 px-4">
                          <KeyTag>{s.id}</KeyTag>
                        </td>
                        <td className="py-3 px-4 font-semibold text-ink">
                          {s.name}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <RoomTag room={s.room} />
                            <span className="text-[11px] text-ink/50 block">{s.block}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-ink/70 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className="flex items-center gap-1 text-[11px]">
                              <Calendar size={11} className="text-navy" />
                              Joined: {formatDate(s.dateOfJoining)}
                            </span>
                            {s.dateOfVacating ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warn bg-warn/10 px-2 py-0.5 rounded border border-warn/20">
                                <LogOut size={11} /> Vacated: {formatDate(s.dateOfVacating)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-ok font-semibold bg-ok/10 px-1.5 py-0.2 rounded border border-ok/20">
                                Active Resident
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {!eligibility.eligible ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-ink/5 text-ink/50 border border-line">
                              {eligibility.reason}
                            </span>
                          ) : !isStaff ? (
                            <StatusPill status={entry.status} />
                          ) : (
                            <div className="flex gap-1.5 flex-wrap">
                              <button
                                onClick={() => mark(s.id, "Present")}
                                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
                                  entry.status === "Present"
                                    ? "bg-ok text-white border-ok shadow-sm"
                                    : "bg-white text-ink/60 border-line hover:border-ok/40"
                                }`}
                              >
                                <Check size={12} /> Present
                              </button>
                              <button
                                onClick={() => mark(s.id, "Absent")}
                                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
                                  entry.status === "Absent"
                                    ? "bg-warn text-white border-warn shadow-sm"
                                    : "bg-white text-ink/60 border-line hover:border-warn/40"
                                }`}
                              >
                                <X size={12} /> Absent
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {!eligibility.eligible ? (
                            <span className="text-xs text-ink/40 italic">{eligibility.badge}</span>
                          ) : entry.status === "Absent" ? (
                            !isStaff ? (
                              <span className="text-xs text-ink/60">{entry.reason || "No remarks"}</span>
                            ) : (
                              <input
                                value={entry.reason}
                                onChange={(e) => setReason(s.id, e.target.value)}
                                placeholder="e.g. Sick, at home, reason..."
                                className="w-full max-w-[200px] border border-line rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-navy/40"
                              />
                            )
                          ) : (
                            <span className="text-xs text-ink/30">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-ink block">{stats.format}</span>
                            <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded border ${stats.badgeColor}`}>
                              {stats.analysis}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setHistoryFor(s.id)}
                            className="text-xs font-medium text-ink/70 bg-ink/5 hover:bg-ink/10 px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                          >
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </Table>
              )}
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MONTH-WISE ATTENDANCE REPORT                       */}
        {/* ========================================================= */}
        {activeTab === "month-wise" && (
          <div className="space-y-6">
            <Card className="p-6">
              <SectionHeader
                eyebrow="Month filter"
                title="Month-Wise Student Attendance Report"
                action={
                  <button
                    onClick={handleExportMonthCsv}
                    disabled={!monthReportData}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-line hover:bg-parchment text-ink px-3 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Download size={14} /> Export to CSV
                  </button>
                }
              />

              {/* Month Report Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4 p-4 bg-parchment/50 rounded-xl border border-line">
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Select Student</label>
                  <select
                    value={monthStudentId}
                    onChange={(e) => setMonthStudentId(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40 font-medium bg-white"
                  >
                    {activeStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id}) — Room {s.room || "Unassigned"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Select Year</label>
                  <select
                    value={monthYear}
                    onChange={(e) => setMonthYear(Number(e.target.value))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40 font-medium bg-white"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Select Month</label>
                  <select
                    value={monthNum}
                    onChange={(e) => setMonthNum(Number(e.target.value))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40 font-medium bg-white"
                  >
                    {[
                      { num: 1, name: "January" },
                      { num: 2, name: "February (Leap-Aware)" },
                      { num: 3, name: "March" },
                      { num: 4, name: "April" },
                      { num: 5, name: "May" },
                      { num: 6, name: "June" },
                      { num: 7, name: "July" },
                      { num: 8, name: "August" },
                      { num: 9, name: "September" },
                      { num: 10, name: "October" },
                      { num: 11, name: "November" },
                      { num: 12, name: "December" }
                    ].map((m) => (
                      <option key={m.num} value={m.num}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={fetchMonthWiseReport}
                    className="w-full bg-navy text-white text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-navy-light transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <RefreshCw size={12} /> Apply Filter
                  </button>
                </div>
              </div>

              {/* Error message */}
              {monthReportError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                  <AlertTriangle size={16} />
                  <span>{monthReportError}</span>
                </div>
              )}

              {/* Month Report Results */}
              {isLoadingMonthReport ? (
                <div className="py-16 text-center text-ink/50 space-y-2">
                  <RefreshCw size={24} className="animate-spin mx-auto text-navy" />
                  <p className="text-sm">Calculating month-wise statistics...</p>
                </div>
              ) : monthReportData ? (
                <div className="space-y-6">

                  {/* Student Profile Banner */}
                  <div className="flex items-center justify-between p-4 bg-white border border-line rounded-xl flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy/10 text-navy font-bold flex items-center justify-center">
                        {monthReportData.studentName?.charAt(0) || "S"}
                      </div>
                      <div>
                        <h3 className="font-bold text-ink text-base">{monthReportData.studentName}</h3>
                        <p className="text-xs text-ink/60">
                          ID: <KeyTag>{monthReportData.studentId}</KeyTag> · Room: <RoomTag room={monthReportData.room} /> · {monthReportData.hostel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-ink/60">
                        Joined: <b>{formatDate(monthReportData.dateOfJoining)}</b>
                      </span>
                      {monthReportData.isVacated ? (
                        <span className="text-warn font-semibold bg-warn/10 px-2 py-0.5 rounded border border-warn/25">
                          Vacated: {formatDate(monthReportData.dateOfVacating)}
                        </span>
                      ) : (
                        <span className="text-ok font-semibold bg-ok/10 px-2 py-0.5 rounded border border-ok/25">
                          Active Resident
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white border border-line rounded-xl p-3 shadow-sm">
                      <p className="text-[11px] font-semibold text-ink/50 uppercase">Eligible Days</p>
                      <p className="text-xl font-bold font-display text-navy mt-1">
                        {monthReportData.totalEligibleDays}
                      </p>
                      <p className="text-[10px] text-ink/40">In {monthReportData.monthName} {monthReportData.year}</p>
                    </div>

                    <div className="bg-white border border-line rounded-xl p-3 shadow-sm">
                      <p className="text-[11px] font-semibold text-ok uppercase">Present Days</p>
                      <p className="text-xl font-bold font-display text-ok mt-1">
                        {monthReportData.presentDays}
                      </p>
                      <p className="text-[10px] text-ok/70">Attended roll-call</p>
                    </div>

                    <div className="bg-white border border-line rounded-xl p-3 shadow-sm">
                      <p className="text-[11px] font-semibold text-warn uppercase">Absent Days</p>
                      <p className="text-xl font-bold font-display text-warn mt-1">
                        {monthReportData.absentDays}
                      </p>
                      <p className="text-[10px] text-warn/70">Missed days</p>
                    </div>

                    <div className="bg-white border border-line rounded-xl p-3 shadow-sm">
                      <p className="text-[11px] font-semibold text-ink/50 uppercase">Unrecorded</p>
                      <p className="text-xl font-bold font-display text-ink/70 mt-1">
                        {monthReportData.unrecordedDays}
                      </p>
                      <p className="text-[10px] text-ink/40">Incomplete days</p>
                    </div>

                    <div className="bg-white border border-line rounded-xl p-3 shadow-sm border-l-4 border-l-navy">
                      <p className="text-[11px] font-semibold text-ink/50 uppercase">Attendance %</p>
                      <p className="text-xl font-bold font-display text-navy mt-1">
                        {monthReportData.totalEligibleDays > 0 ? `${monthReportData.rate}%` : "0%"}
                      </p>
                      <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded border ${monthReportData.badgeColor}`}>
                        {monthReportData.status}
                      </span>
                    </div>
                  </div>

                  {/* Formula explanation banner */}
                  <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-900">
                    <Info size={16} className="text-blue-600 shrink-0" />
                    <span>
                      <b>Authoritative Calculation:</b> {monthReportData.formula}. (Days outside student's stay period or after checkout are strictly excluded).
                    </span>
                  </div>

                  {/* Chronological Daily Records Table */}
                  <div>
                    <h4 className="text-sm font-semibold text-ink mb-3 flex items-center justify-between">
                      <span>Daily Attendance Records — {monthReportData.monthName} {monthReportData.year} ({monthReportData.daysInMonth} days)</span>
                      <span className="text-xs text-ink/50 font-normal">Chronological date order</span>
                    </h4>

                    <div className="max-h-96 overflow-y-auto border border-line rounded-xl">
                      <Table
                        headers={[
                          "Day #",
                          "Date",
                          "Day of Week",
                          "Stay / Eligibility Status",
                          "Attendance Mark",
                          "Remarks"
                        ]}
                      >
                        {(monthReportData.dailyBreakdown || []).map((day) => (
                          <tr key={day.date} className="hover:bg-parchment/60 transition-colors">
                            <td className="py-2.5 px-4 font-mono text-xs font-semibold text-ink/70">
                              Day {day.dayNumber}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-xs text-ink whitespace-nowrap">
                              {day.date}
                            </td>
                            <td className="py-2.5 px-4 text-xs text-ink/60 font-medium">
                              {day.dayOfWeek}
                            </td>
                            <td className="py-2.5 px-4 text-xs whitespace-nowrap">
                              {day.isEligible ? (
                                <span className="text-ok font-semibold flex items-center gap-1">
                                  <CheckCircle size={12} /> Eligible Stay Date
                                </span>
                              ) : (
                                <span className="text-ink/40 italic flex items-center gap-1">
                                  <Clock size={12} /> {day.ineligibilityReason}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              {day.status === "Present" ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-ok bg-ok/10 px-2 py-0.5 rounded border border-ok/20">
                                  <Check size={12} /> Present
                                </span>
                              ) : day.status === "Absent" ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-warn bg-warn/10 px-2 py-0.5 rounded border border-warn/20">
                                  <X size={12} /> Absent
                                </span>
                              ) : day.status === "Leave" ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  <Calendar size={12} /> Leave
                                </span>
                              ) : day.status === "Unrecorded" ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-ink/50 bg-ink/5 px-2 py-0.5 rounded border border-line">
                                  Unrecorded
                                </span>
                              ) : (
                                <span className="text-xs text-ink/30 italic">
                                  {day.status}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-xs text-ink/60">
                              {day.remarks || "—"}
                            </td>
                          </tr>
                        ))}
                      </Table>
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: YEAR-WISE ATTENDANCE REPORT                        */}
        {/* ========================================================= */}
        {activeTab === "year-wise" && (
          <div className="space-y-6">
            <Card className="p-6">
              <SectionHeader
                eyebrow="Annual filter"
                title="Year-Wise Student Attendance Report"
                action={
                  <button
                    onClick={handleExportYearCsv}
                    disabled={!yearReportData}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-line hover:bg-parchment text-ink px-3 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Download size={14} /> Export to CSV
                  </button>
                }
              />

              {/* Year Report Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 p-4 bg-parchment/50 rounded-xl border border-line">
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Select Student</label>
                  <select
                    value={yearStudentId}
                    onChange={(e) => setYearStudentId(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40 font-medium bg-white"
                  >
                    {activeStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id}) — Room {s.room || "Unassigned"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Select Year</label>
                  <select
                    value={yearSelected}
                    onChange={(e) => setYearSelected(Number(e.target.value))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40 font-medium bg-white"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={fetchYearWiseReport}
                    className="w-full bg-navy text-white text-xs font-semibold py-2.5 px-3 rounded-lg hover:bg-navy-light transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <RefreshCw size={12} /> Apply Filter
                  </button>
                </div>
              </div>

              {yearReportError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                  <AlertTriangle size={16} />
                  <span>{yearReportError}</span>
                </div>
              )}

              {isLoadingYearReport ? (
                <div className="py-16 text-center text-ink/50 space-y-2">
                  <RefreshCw size={24} className="animate-spin mx-auto text-navy" />
                  <p className="text-sm">Calculating annual weighted attendance...</p>
                </div>
              ) : yearReportData ? (
                <div className="space-y-6">

                  {/* Annual Summary Header Card */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-line rounded-xl p-4 shadow-sm">
                      <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Annual Percentage</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-bold font-display text-navy">
                          {yearReportData.annualRate}%
                        </span>
                        <TrendingUp size={18} className="text-navy" />
                      </div>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border mt-2 ${yearReportData.badgeColor}`}>
                        {yearReportData.status}
                      </span>
                    </div>

                    <div className="bg-white border border-line rounded-xl p-4 shadow-sm">
                      <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Total Eligible Days</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-bold font-display text-ink">
                          {yearReportData.annualEligibleDays}
                        </span>
                        <Calendar size={16} className="text-ink/40" />
                      </div>
                      <span className="text-[11px] text-ink/40 mt-1">Across {yearReportData.year}</span>
                    </div>

                    <div className="bg-white border border-line rounded-xl p-4 shadow-sm">
                      <span className="text-xs font-semibold text-ok uppercase tracking-wide">Present Days</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-bold font-display text-ok">
                          {yearReportData.annualPresentDays}
                        </span>
                        <CheckCircle size={16} className="text-ok" />
                      </div>
                      <span className="text-[11px] text-ok font-medium mt-1">Total days attended</span>
                    </div>

                    <div className="bg-white border border-line rounded-xl p-4 shadow-sm">
                      <span className="text-xs font-semibold text-warn uppercase tracking-wide">Absent Days</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-bold font-display text-warn">
                          {yearReportData.annualAbsentDays}
                        </span>
                        <AlertTriangle size={16} className="text-warn" />
                      </div>
                      <span className="text-[11px] text-warn font-medium mt-1">Total absentees</span>
                    </div>
                  </div>

                  {/* Formula rule alert */}
                  <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-900">
                    <Info size={16} className="text-blue-600 shrink-0" />
                    <span>
                      <b>Weighted Annual Formula:</b> {yearReportData.formula}. (Properly accounts for differing numbers of eligible days per month, not a simple average of percentages).
                    </span>
                  </div>

                  {/* 12-Month Attendance Trend Chart */}
                  <div className="p-4 bg-white border border-line rounded-xl shadow-sm">
                    <h4 className="text-xs font-semibold text-ink/60 uppercase tracking-wide mb-3">
                      Monthly Attendance Rate Trend — {yearReportData.year}
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={yearReportData.chartData} margin={{ left: -20, top: 5 }}>
                        <CartesianGrid stroke="#EADBE6" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#2F172E99" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#2F172E99" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(value) => [`${value}%`, "Attendance Rate"]}
                          contentStyle={{ borderRadius: 8, border: "1px solid #EADBE6", fontSize: 13 }}
                        />
                        <Bar dataKey="rate" fill="#003554" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 12-Month Detailed Breakdown Table */}
                  <div>
                    <h4 className="text-sm font-semibold text-ink mb-3">
                      Month-by-Month Summary (January to December)
                    </h4>
                    <Table
                      headers={[
                        "Month",
                        "Days in Month",
                        "Eligible Days",
                        "Present Days",
                        "Absent Days",
                        "Monthly Attendance %",
                        "Status",
                        "Drilldown Action"
                      ]}
                    >
                      {(yearReportData.monthlyBreakdown || []).map((m) => (
                        <tr key={m.month} className="hover:bg-parchment/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-ink text-sm">
                            {m.monthName}
                          </td>
                          <td className="py-3 px-4 text-ink/60 text-xs">
                            {m.daysInMonth} days
                          </td>
                          <td className="py-3 px-4 font-bold text-ink text-xs">
                            {m.totalEligibleDays}
                          </td>
                          <td className="py-3 px-4 font-bold text-ok text-xs">
                            {m.presentDays}
                          </td>
                          <td className="py-3 px-4 font-bold text-warn text-xs">
                            {m.absentDays}
                          </td>
                          <td className="py-3 px-4">
                            {m.totalEligibleDays > 0 ? (
                              <div className="space-y-1 min-w-[120px]">
                                <span className="text-xs font-bold text-ink">{m.rate}%</span>
                                <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      m.rate < 60 ? "bg-red-500" : m.rate < 75 ? "bg-warn" : "bg-ok"
                                    }`}
                                    style={{ width: `${m.rate}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-ink/40 italic">0 eligible days</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${m.badgeColor}`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setMonthStudentId(yearReportData.studentId);
                                setMonthYear(yearReportData.year);
                                setMonthNum(m.month);
                                setActiveTab("month-wise");
                              }}
                              className="text-xs font-semibold text-navy bg-navy/10 hover:bg-navy/20 px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                            >
                              View Daily Records <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </Table>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: RATE ANALYTICS & HOSTEL PROGRESS                   */}
        {/* ========================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">

            {/* Aggregate Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Overall Rate</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-display text-navy">{aggregateStats.overallRate}%</span>
                  <TrendingUp size={16} className="text-navy" />
                </div>
                <span className="text-[11px] text-ink/45 mt-1">Across active residents</span>
              </div>

              <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">High Attendance</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-display text-ok">{aggregateStats.high}</span>
                  <ShieldCheck size={16} className="text-ok" />
                </div>
                <span className="text-[11px] text-ok font-medium mt-1">Rate ≥ 90%</span>
              </div>

              <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Normal / Good</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-display text-ink">{aggregateStats.normal}</span>
                  <CheckCircle size={16} className="text-navy" />
                </div>
                <span className="text-[11px] text-ink/50 mt-1">Rate 75% - 89%</span>
              </div>

              <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Low Rate Warning</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-display text-warn">{aggregateStats.low}</span>
                  <AlertTriangle size={16} className="text-warn" />
                </div>
                <span className="text-[11px] text-warn font-medium mt-1">Rate &lt; 75%</span>
              </div>

              <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
                <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Active Residents</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-display text-ink">{aggregateStats.active}</span>
                  <Users size={16} className="text-ink/50" />
                </div>
                <span className="text-[11px] text-ink/45 mt-1">{aggregateStats.vacated} vacated excluded</span>
              </div>
            </div>

            {/* Per-Student Rate Progress Table */}
            <Card className="p-6">
              <SectionHeader
                eyebrow="Student list"
                title="Per-Student Attendance Rate & Progress Analysis"
              />
              <p className="text-xs text-ink/50 -mt-2 mb-4">
                Attendance eligibility starts from each student's <b>Date of Joining</b> and ends at their <b>Date of Vacating</b> (or today). Dates after checkout are permanently excluded from eligible attendance.
              </p>
              <Table
                headers={[
                  "Student ID",
                  "Name",
                  "Room",
                  "Date of Joining",
                  "Date of Vacating",
                  "Present",
                  "Absent",
                  "Total Conducted",
                  "Attendance Format",
                  "Rate Analysis",
                  "Actions"
                ]}
              >
                {activeStudents.map((s) => {
                  const stats = computedAttendance[s.id] || {};
                  return (
                    <tr key={s.id} className="hover:bg-parchment/60 transition-colors">
                      <td className="py-3 px-4"><KeyTag>{s.id}</KeyTag></td>
                      <td className="py-3 px-4 font-semibold text-ink">{s.name}</td>
                      <td className="py-3 px-4"><RoomTag room={s.room} /></td>
                      <td className="py-3 px-4 text-xs text-ink/70 whitespace-nowrap">{formatDate(s.dateOfJoining)}</td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {s.dateOfVacating ? (
                          <span className="text-warn font-semibold bg-warn/10 px-2 py-0.5 rounded border border-warn/20">
                            {formatDate(s.dateOfVacating)}
                          </span>
                        ) : (
                          <span className="text-ok font-medium">Active</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-ok text-sm">{stats.presentCount}</td>
                      <td className="py-3 px-4 font-semibold text-warn text-sm">{stats.absentCount}</td>
                      <td className="py-3 px-4 text-ink/70 text-sm font-medium">{stats.totalMarked}</td>
                      <td className="py-3 px-4">
                        {stats.rate === null ? (
                          <span className="text-xs text-ink/40 italic">No roll-call yet</span>
                        ) : (
                          <div className="space-y-1 min-w-[140px]">
                            <span className="text-xs font-bold text-ink">{stats.format}</span>
                            <div className="w-full h-2 bg-line rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  stats.rate < 60 ? "bg-red-500" : stats.rate < 75 ? "bg-warn" : stats.rate < 90 ? "bg-navy" : "bg-ok"
                                }`}
                                style={{ width: `${stats.rate}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${stats.badgeColor}`}>
                          {stats.analysis}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setHistoryFor(s.id)}
                          className="text-xs font-medium text-ink/60 bg-ink/5 hover:bg-ink/10 px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: ABSENCE CHECKER (STAFF)                            */}
        {/* ========================================================= */}
        {activeTab === "checker" && isStaff && (
          <Card className="p-6">
            <SectionHeader eyebrow="Absence audit" title="Student Absence Checker" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1">Time Range</label>
                <select
                  value={reportRange}
                  onChange={(e) => setReportRange(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40"
                >
                  <option value="today">Today</option>
                  <option value="weekly">Last 7 Days</option>
                  <option value="monthly">Last 30 Days</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {reportRange === "custom" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">From Date</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">To Date</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1">Student</label>
                <select
                  value={reportStudent}
                  onChange={(e) => setReportStudent(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40"
                >
                  <option value="all">All Active Students ({activeStudents.length})</option>
                  {activeStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  onClick={handleGenerateAbsenceReport}
                  className="w-full bg-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-navy-light transition-colors"
                >
                  Check Absences
                </button>
              </div>
            </div>

            {reportResults && (
              <div className="mt-6 border-t border-line pt-4">
                <h4 className="text-sm font-semibold text-ink mb-3">
                  Absence Records ({reportResults.length})
                </h4>
                {reportResults.length === 0 ? (
                  <p className="text-sm text-ink/50 py-4 text-center">No absences found for the selected criteria.</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {reportResults.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-3 bg-parchment rounded-lg px-3.5 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {r.date} — {r.studentName} ({r.studentId})
                          </p>
                          <p className="text-xs text-ink/50 mt-0.5">{r.reason || "No reason given"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusPill status={r.status} />
                          <span className="text-[10px] font-medium text-ink/40">
                            {r.source === "Leave" ? "Approved Leave" : "Roll-call"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ========================================================= */}
      {/* STUDENT ATTENDANCE HISTORY MODAL                          */}
      {/* ========================================================= */}
      <Modal
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
        title={historyStudent ? `${historyStudent.name} — Attendance Profile` : ""}
        wide
      >
        {historyStudent && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap pb-4 border-b border-line">
              <KeyTag>{historyStudent.id}</KeyTag>
              <RoomTag room={historyStudent.room} />
              <span className="text-xs text-ink/70 flex items-center gap-1 font-medium">
                <Calendar size={13} className="text-navy" /> Joined: {formatDate(historyStudent.dateOfJoining)}
              </span>
              {historyStudent.dateOfVacating ? (
                <span className="text-xs text-warn flex items-center gap-1 font-medium bg-warn/10 px-2 py-0.5 rounded border border-warn/20">
                  <LogOut size={13} /> Vacated: {formatDate(historyStudent.dateOfVacating)}
                </span>
              ) : (
                <span className="text-xs text-ok flex items-center gap-1 font-medium bg-ok/10 px-2 py-0.5 rounded border border-ok/20">
                  <CheckCircle size={13} /> Active Resident
                </span>
              )}
            </div>

            {/* Live stats summary */}
            {historyStats && (
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-parchment p-3 rounded-lg border border-line">
                  <p className="text-xs text-ink/50">Present Days</p>
                  <p className="text-lg font-bold text-ok mt-0.5">{historyStats.presentCount}</p>
                </div>
                <div className="bg-parchment p-3 rounded-lg border border-line">
                  <p className="text-xs text-ink/50">Absent Days</p>
                  <p className="text-lg font-bold text-warn mt-0.5">{historyStats.absentCount}</p>
                </div>
                <div className="bg-parchment p-3 rounded-lg border border-line">
                  <p className="text-xs text-ink/50">Present Rate</p>
                  <p className="text-lg font-bold text-navy mt-0.5">
                    {historyStats.rate !== null ? `${historyStats.rate}%` : "—"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-ink/60 uppercase tracking-wide">
                Absence History
              </h4>
              <button
                onClick={() => {
                  setMonthStudentId(historyStudent.id);
                  setHistoryFor(null);
                  setActiveTab("month-wise");
                }}
                className="text-xs font-semibold text-navy hover:underline flex items-center gap-1"
              >
                <BookOpen size={13} /> View Full Month-Wise Report
              </button>
            </div>

            {historyList.length === 0 ? (
              <p className="text-sm text-ink/50 py-4 bg-parchment/40 rounded-lg text-center">
                No absences recorded yet for this student.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2">
                {historyList.map(({ date: d, status, reason, source }) => (
                  <div
                    key={d}
                    className="flex items-start justify-between gap-3 bg-parchment rounded-lg px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{formatDate(d)}</p>
                      <p className="text-xs text-ink/60 mt-0.5">{reason || "No reason given"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill status={status || "Absent"} />
                      <span className={`text-[10px] font-medium ${source === "Unsaved" ? "text-warn" : "text-ink/40"}`}>
                        {source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 mt-3 border-t border-line">
              <button
                onClick={() => setHistoryFor(null)}
                className="px-4 py-2 text-sm font-semibold text-ink/60 hover:text-ink rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
