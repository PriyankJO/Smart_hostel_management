// Shared attendance logic and Rate Analysis

export const BASELINE_DAYS = 20;

export function normalizeDateStr(dateInput) {
  if (!dateInput) return "";
  if (typeof dateInput === "string") {
    const clean = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    if (clean.includes("T")) return clean.split("T")[0];
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return clean.slice(0, 10);
  }
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput.toISOString().slice(0, 10);
  }
  return "";
}

// Reads a record entry that may be the old plain-string format ("Present"/"Absent"/"Leave")
// or the newer { status, reason } format, and always returns { status, reason }.
export function normalizeEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return { status: entry, reason: "" };
  return { status: entry.status, reason: entry.reason || entry.remarks || "" };
}

// Checks if a student is active/eligible for roll-call on a given date string (YYYY-MM-DD)
export function getStudentStatusForDate(student, dateStr) {
  if (!student) return { eligible: true };
  const d = normalizeDateStr(dateStr);
  const today = normalizeDateStr(new Date());

  if (student.dateOfJoining) {
    const joinDate = normalizeDateStr(student.dateOfJoining);
    if (d && d < joinDate) {
      return {
        eligible: false,
        reason: "Not Joined Yet",
        badge: `Joined ${joinDate}`,
      };
    }
  }

  if (student.dateOfVacating) {
    const vacateDate = normalizeDateStr(student.dateOfVacating);
    if (d && d > vacateDate) {
      return {
        eligible: false,
        reason: "Vacated",
        badge: `Vacated ${vacateDate}`,
      };
    }
  }

  if (d && d > today) {
    return {
      eligible: false,
      reason: "Future Date",
      badge: "Upcoming",
    };
  }

  return { eligible: true };
}

/**
 * Returns attendance status object based on percentage and total eligible days.
 */
export function getAttendanceStatusBadge(rate, totalEligibleDays = 0) {
  if (totalEligibleDays === 0 || rate === null || rate === undefined) {
    return {
      label: "No Data",
      analysis: "New Joiner (Pending)",
      badgeColor: "text-tag-dark bg-tag/15 border-tag/30",
      level: "none"
    };
  }

  if (rate >= 90) {
    return {
      label: "Excellent",
      analysis: "Excellent (≥90%)",
      badgeColor: "text-ok bg-ok/10 border-ok/20",
      level: "excellent"
    };
  }
  if (rate >= 75) {
    return {
      label: "Good",
      analysis: "Normal / Good (75-89%)",
      badgeColor: "text-navy bg-navy/10 border-navy/20",
      level: "good"
    };
  }
  if (rate >= 60) {
    return {
      label: "Low",
      analysis: "Low Attendance (60-74%)",
      badgeColor: "text-warn bg-warn/10 border-warn/25",
      level: "low"
    };
  }
  return {
    label: "Critical",
    analysis: "Critical Alert (<60%)",
    badgeColor: "text-red-600 bg-red-50 border-red-200",
    level: "critical"
  };
}

/**
 * Full attendance statistics & rate analysis for a single student.
 * Authoritative Formula:
 * Attendance Percentage = (Number of Present Days / Total Eligible Attendance Days) * 100
 *
 * Supports both:
 * 1. Dictionary records: { "2026-10-21": { "STU-1043": { status: "Present" } } }
 * 2. Array of records: [ { dateStr: "2026-10-21", studentCode: "STU-1043", status: "Present" } ]
 */
export function computeStudentAttendanceStats(studentOrId, records, studentsList = [], options = {}) {
  let studentObj = null;
  let studentId = "";

  if (typeof studentOrId === "object" && studentOrId !== null) {
    studentObj = studentOrId;
    studentId = studentObj.id || studentObj.studentId;
  } else {
    studentId = String(studentOrId || "");
    studentObj = studentsList.find((s) => s.id === studentId || s.studentId === studentId) || null;
  }

  const joinDate = studentObj?.dateOfJoining ? normalizeDateStr(studentObj.dateOfJoining) : null;
  const vacateDate = studentObj?.dateOfVacating ? normalizeDateStr(studentObj.dateOfVacating) : null;
  const today = normalizeDateStr(new Date());

  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let totalEligible = 0;

  if (Array.isArray(records)) {
    // Array format from backend
    records.forEach((rec) => {
      const d = normalizeDateStr(rec.dateStr || rec.date);
      if (joinDate && d < joinDate) return;
      if (vacateDate && d > vacateDate) return;
      if (d > today) return;

      const stuCode = rec.studentCode || rec.studentId?.studentId || rec.studentId;
      if (stuCode === studentId || rec.studentId?._id === studentObj?._id) {
        totalEligible++;
        if (rec.status === "Present") {
          presentCount++;
        } else if (rec.status === "Absent") {
          absentCount++;
        } else if (rec.status === "Leave") {
          leaveCount++;
          if (!options.leaveAsEligible) {
            totalEligible--; // Excused leave
          }
        }
      }
    });
  } else if (records && typeof records === "object") {
    // Dictionary format: { date: { studentId: entry } }
    const dates = Object.keys(records).sort();
    dates.forEach((d) => {
      if (joinDate && d < joinDate) return;
      if (vacateDate && d > vacateDate) return;
      if (d > today) return;

      const norm = normalizeEntry(records[d]?.[studentId]);
      if (norm && norm.status) {
        totalEligible++;
        if (norm.status === "Present") {
          presentCount++;
        } else if (norm.status === "Absent") {
          absentCount++;
        } else if (norm.status === "Leave") {
          leaveCount++;
          if (!options.leaveAsEligible) {
            totalEligible--; // Excused leave
          }
        }
      }
    });
  }

  if (totalEligible === 0) {
    const isNew = !vacateDate;
    return {
      studentId,
      presentCount: 0,
      absentCount: 0,
      leaveCount: 0,
      totalMarked: 0,
      totalEligibleDays: 0,
      rate: null,
      format: isNew ? "0 / 0 (No roll call yet)" : "0 / 0 (Vacated)",
      analysis: isNew ? "New Joiner (Pending)" : "Vacated",
      badgeColor: "text-tag-dark bg-tag/15 border-tag/30",
    };
  }

  const rate = Math.round((presentCount / totalEligible) * 100);
  const format = `${presentCount} / ${totalEligible} (${rate}%)`;
  const badgeInfo = getAttendanceStatusBadge(rate, totalEligible);

  return {
    studentId,
    presentCount,
    absentCount,
    leaveCount,
    totalMarked: totalEligible,
    totalEligibleDays: totalEligible,
    rate,
    format,
    analysis: badgeInfo.analysis,
    badgeColor: badgeInfo.badgeColor,
  };
}

// A student's attendance %
export function computeAttendancePct(studentOrId, records, studentsList = []) {
  const stats = computeStudentAttendanceStats(studentOrId, records, studentsList);
  return stats.rate;
}

// Formatted string: e.g. "16 / 20 (80%)"
export function formatAttendanceDisplay(studentOrId, records, studentsList = []) {
  const stats = computeStudentAttendanceStats(studentOrId, records, studentsList);
  if (stats.rate === null) return "No data yet";
  return stats.format;
}

// Baseline history builder for legacy seeds
export function buildBaselineHistory(targetPct, joinDateStr = null) {
  const presentDays = Math.round((BASELINE_DAYS * (targetPct ?? 90)) / 100);
  const absentDays = BASELINE_DAYS - presentDays;
  const absentIdx = new Set();
  if (absentDays > 0) {
    const stride = BASELINE_DAYS / absentDays;
    for (let i = 0; i < absentDays; i++) absentIdx.add(Math.floor(i * stride));
  }
  const entries = [];
  for (let i = 1; i <= BASELINE_DAYS; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (joinDateStr && key < joinDateStr) continue;

    entries.push([
      key,
      absentIdx.has(i - 1) ? { status: "Absent", reason: "Not specified" } : { status: "Present", reason: "" },
    ]);
  }
  return entries;
}

/**
 * Utility to export tabular attendance reports to standard CSV format
 */
export function exportAttendanceReportToCsv(filename, headers, rows) {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const headerRow = headers.map(escapeCsv).join(",");
  const dataRows = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headerRow + "\n" + dataRows);

  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
