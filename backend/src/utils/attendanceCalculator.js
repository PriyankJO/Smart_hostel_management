/**
 * Standard Attendance Calculator & Date Utility for Hostel Management System
 * Authoritative source of business logic for attendance percentages,
 * eligible day calculations, month-wise, and year-wise reporting.
 */

/**
 * Normalizes any date input (string, Date, timestamp) to a standard YYYY-MM-DD string.
 * @param {string|Date|number} dateInput
 * @returns {string} YYYY-MM-DD
 */
export function normalizeDateStr(dateInput) {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    // If already in YYYY-MM-DD format (or contains T)
    const clean = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    if (clean.includes('T')) return clean.split('T')[0];
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
    return clean.slice(0, 10);
  }
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput.toISOString().slice(0, 10);
  }
  return '';
}

/**
 * Returns a JavaScript Date object set to UTC 00:00:00.000 for the given date.
 * @param {string|Date|number} dateInput
 * @returns {Date}
 */
export function getUtcStartOfDay(dateInput) {
  const str = normalizeDateStr(dateInput);
  if (!str) return new Date();
  return new Date(`${str}T00:00:00.000Z`);
}

/**
 * Returns the exact number of days in a given year and month (1-indexed: 1 = Jan, 12 = Dec).
 * Properly accounts for leap years in February (e.g. Feb 2024 = 29 days, Feb 2026 = 28 days).
 * @param {number} year e.g. 2026
 * @param {number} month 1 to 12
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  // Passing 0 as day returns the last day of the previous month.
  // In JS Date UTC, month argument is 0-indexed, so month `m` with day 0 gives last day of month `m`.
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Evaluates the attendance status threshold (Good, Low, Critical).
 * Thresholds:
 * - >= 80%: Good (or Excellent if >= 90%)
 * - 60% - 79.9%: Low
 * - < 60%: Critical
 * @param {number|null} rate
 * @param {number} totalEligibleDays
 * @returns {{ label: string, color: string, badge: string }}
 */
export function getAttendanceStatus(rate, totalEligibleDays = 0) {
  if (totalEligibleDays === 0 || rate === null || rate === undefined) {
    return {
      label: 'No Eligible Days',
      level: 'none',
      color: 'text-ink/40 bg-ink/5 border-line',
      badge: 'N/A'
    };
  }

  if (rate >= 90) {
    return {
      label: 'Excellent',
      level: 'good',
      color: 'text-ok bg-ok/10 border-ok/20',
      badge: 'Good (≥90%)'
    };
  }
  if (rate >= 75) {
    return {
      label: 'Good',
      level: 'good',
      color: 'text-navy bg-navy/10 border-navy/20',
      badge: 'Good (75-89%)'
    };
  }
  if (rate >= 60) {
    return {
      label: 'Low',
      level: 'low',
      color: 'text-warn bg-warn/10 border-warn/25',
      badge: 'Low (60-74%)'
    };
  }
  return {
    label: 'Critical',
    level: 'critical',
    color: 'text-red-600 bg-red-50 border-red-200',
    badge: 'Critical (<60%)'
  };
}

/**
 * Core attendance calculation formula:
 * Attendance Percentage = (Number of Present Days / Total Eligible Attendance Days) * 100
 *
 * Rules:
 * 1. Present: Attended day (+1 attended, +1 eligible).
 * 2. Absent: Eligible day but not attended (+1 absent, +1 eligible).
 * 3. Leave: Tracked separately. If leaveAsEligible is true, counted in eligible denominator;
 *    if false (excused leave), excluded from eligible attendance denominator.
 * 4. Dates before joiningDate or after vacatingDate must not count toward eligible attendance.
 * 5. Future dates (after today) must not count toward completed attendance statistics.
 * 6. Dates without recorded attendance are tracked as unrecorded/incomplete.
 * 7. Division by zero yields 0% (N/A) without throwing errors.
 */
export function computePeriodAttendance({
  student,
  records = [],
  periodStartDateStr,
  periodEndDateStr,
  todayDateStr = normalizeDateStr(new Date()),
  leaveAsEligible = false
}) {
  const joinDateStr = normalizeDateStr(student.dateOfJoining || student.admissionDate || student.createdAt);
  const vacateDateStr = student.dateOfVacating ? normalizeDateStr(student.dateOfVacating) : null;

  // Determine effective eligible window
  // Start: at or after student join date and period start
  const windowStart = joinDateStr && joinDateStr > periodStartDateStr ? joinDateStr : periodStartDateStr;
  
  // End: cannot exceed student checkout date, period end, or today
  let windowEnd = periodEndDateStr;
  if (todayDateStr && todayDateStr < windowEnd) {
    windowEnd = todayDateStr;
  }
  if (vacateDateStr && vacateDateStr < windowEnd) {
    windowEnd = vacateDateStr;
  }

  // Map existing records by YYYY-MM-DD
  const recordMap = new Map();
  for (const r of records) {
    const dStr = normalizeDateStr(r.dateStr || r.date);
    if (dStr) {
      recordMap.set(dStr, r);
    }
  }

  // Iterate every day in the full period to build daily audit and summary
  const dailyBreakdown = [];
  let presentDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let unrecordedDays = 0;
  let totalEligibleDays = 0;

  // Generate day strings from periodStartDateStr to periodEndDateStr
  const currentCursor = new Date(`${periodStartDateStr}T00:00:00.000Z`);
  const endCursor = new Date(`${periodEndDateStr}T00:00:00.000Z`);

  while (currentCursor <= endCursor) {
    const curStr = currentCursor.toISOString().slice(0, 10);
    const dayOfWeek = currentCursor.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const record = recordMap.get(curStr);

    let isEligible = true;
    let ineligibilityReason = '';
    let dayStatus = 'Unrecorded';
    let remarks = record?.remarks || '';

    if (joinDateStr && curStr < joinDateStr) {
      isEligible = false;
      ineligibilityReason = `Joined on ${joinDateStr}`;
      dayStatus = 'Not Joined Yet';
    } else if (vacateDateStr && curStr > vacateDateStr) {
      isEligible = false;
      ineligibilityReason = `Vacated on ${vacateDateStr}`;
      dayStatus = 'Vacated';
    } else if (curStr > todayDateStr) {
      isEligible = false;
      ineligibilityReason = 'Future date';
      dayStatus = 'Upcoming';
    }

    if (isEligible) {
      totalEligibleDays++;
      if (record) {
        if (record.status === 'Present') {
          presentDays++;
          dayStatus = 'Present';
        } else if (record.status === 'Absent') {
          absentDays++;
          dayStatus = 'Absent';
        } else if (record.status === 'Leave') {
          leaveDays++;
          dayStatus = 'Leave';
          // If leave is excused and not eligible, reduce denominator
          if (!leaveAsEligible) {
            totalEligibleDays--;
          }
        }
      } else {
        unrecordedDays++;
        dayStatus = 'Unrecorded';
      }
    }

    dailyBreakdown.push({
      date: curStr,
      dayOfWeek,
      dayNumber: currentCursor.getUTCDate(),
      isEligible,
      ineligibilityReason,
      status: dayStatus,
      remarks,
      recordId: record?._id || null,
      updatedAt: record?.updatedAt || null
    });

    currentCursor.setUTCDate(currentCursor.getUTCDate() + 1);
  }

  // Calculate percentage: (Present / Total Eligible) * 100
  const rate = totalEligibleDays > 0
    ? Number(((presentDays / totalEligibleDays) * 100).toFixed(1))
    : 0;

  const statusInfo = getAttendanceStatus(rate, totalEligibleDays);

  return {
    studentId: student.studentId,
    studentMongoId: student._id,
    studentName: student.name,
    room: student.roomId?.roomNumber || student.room || '',
    hostel: student.roomId?.block ? `Block ${student.roomId.block}` : 'Main Hostel',
    dateOfJoining: student.dateOfJoining,
    dateOfVacating: student.dateOfVacating,
    isVacated: Boolean(student.dateOfVacating),
    periodStart: periodStartDateStr,
    periodEnd: periodEndDateStr,
    totalEligibleDays,
    presentDays,
    absentDays,
    leaveDays,
    unrecordedDays,
    recordedDays: presentDays + absentDays + leaveDays,
    rate,
    status: statusInfo.label,
    statusLevel: statusInfo.level,
    badgeColor: statusInfo.color,
    badgeText: statusInfo.badge,
    formula: `(${presentDays} Present / ${totalEligibleDays} Eligible) × 100 = ${rate}%`,
    dailyBreakdown
  };
}

/**
 * Weighted Annual Attendance Percentage:
 * Annual Percentage = (Total Present Days Across Eligible Dates / Total Eligible Attendance Days Across the Year) * 100
 *
 * @param {Array} monthlySummaries Array of 12 month summary objects
 * @returns {Object} Annual statistics
 */
export function computeAnnualAttendance(monthlySummaries) {
  let annualEligibleDays = 0;
  let annualPresentDays = 0;
  let annualAbsentDays = 0;
  let annualLeaveDays = 0;
  let annualUnrecordedDays = 0;

  monthlySummaries.forEach((m) => {
    annualEligibleDays += m.totalEligibleDays || 0;
    annualPresentDays += m.presentDays || 0;
    annualAbsentDays += m.absentDays || 0;
    annualLeaveDays += m.leaveDays || 0;
    annualUnrecordedDays += m.unrecordedDays || 0;
  });

  const annualRate = annualEligibleDays > 0
    ? Number(((annualPresentDays / annualEligibleDays) * 100).toFixed(1))
    : 0;

  const statusInfo = getAttendanceStatus(annualRate, annualEligibleDays);

  return {
    annualEligibleDays,
    annualPresentDays,
    annualAbsentDays,
    annualLeaveDays,
    annualUnrecordedDays,
    annualRecordedDays: annualPresentDays + annualAbsentDays + annualLeaveDays,
    annualRate,
    status: statusInfo.label,
    statusLevel: statusInfo.level,
    badgeColor: statusInfo.color,
    badgeText: statusInfo.badge,
    formula: `(${annualPresentDays} Present / ${annualEligibleDays} Eligible) × 100 = ${annualRate}%`
  };
}
