import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Room from '../models/Room.js';
import {
  normalizeDateStr,
  getUtcStartOfDay,
  getDaysInMonth,
  computePeriodAttendance,
  computeAnnualAttendance,
  getAttendanceStatus
} from '../utils/attendanceCalculator.js';

/**
 * Helper to resolve a student document by either MongoDB _id or string studentId (e.g. STU-1043)
 */
async function resolveStudent(identifier) {
  if (!identifier) return null;
  const isMongoId = mongoose.Types.ObjectId.isValid(identifier);
  if (isMongoId) {
    const s = await Student.findById(identifier).populate('roomId');
    if (s) return s;
  }
  return await Student.findOne({ studentId: identifier }).populate('roomId');
}

/**
 * Re-computes and saves a student's authoritative overall cumulative attendance percentage
 */
export async function recalculateStudentOverallRate(studentId) {
  const student = await Student.findById(studentId).populate('roomId');
  if (!student) return 0;
  if (student.status === 'Vacated' || student.dateOfVacating) {
    student.attendance = 0;
    await student.save();
    return 0;
  }

  const joinDateStr = normalizeDateStr(student.dateOfJoining || student.admissionDate || student.createdAt);
  const vacateDateStr = student.dateOfVacating ? normalizeDateStr(student.dateOfVacating) : null;
  const todayStr = normalizeDateStr(new Date());

  const effectiveEnd = vacateDateStr && vacateDateStr < todayStr ? vacateDateStr : todayStr;

  // Query all attendance records for this student on or after joining
  const query = {
    studentId: student._id,
    dateStr: { $gte: joinDateStr }
  };
  if (vacateDateStr) {
    query.dateStr.$lte = vacateDateStr;
  }

  const records = await Attendance.find(query);

  const stats = computePeriodAttendance({
    student,
    records,
    periodStartDateStr: joinDateStr,
    periodEndDateStr: effectiveEnd,
    todayDateStr: todayStr,
    leaveAsEligible: false
  });

  student.attendance = stats.rate;
  await student.save();
  return stats.rate;
}

/**
 * GET /api/attendance
 * Retrieve attendance records with filters: date, dateStr, studentId, startDate, endDate, status, hostel
 */
export const getAttendance = async (req, res, next) => {
  try {
    const { date, dateStr, studentId, startDate, endDate, status, hostel } = req.query;
    let query = {};

    const targetDateStr = dateStr || (date ? normalizeDateStr(date) : null);
    if (targetDateStr) {
      query.dateStr = targetDateStr;
    } else if (startDate && endDate) {
      query.dateStr = {
        $gte: normalizeDateStr(startDate),
        $lte: normalizeDateStr(endDate)
      };
    }

    if (studentId) {
      const student = await resolveStudent(studentId);
      if (student) {
        query.studentId = student._id;
      } else {
        // No matching student found
        return res.json({ success: true, count: 0, data: [] });
      }
    }

    if (status) {
      query.status = status;
    }

    if (hostel) {
      query.hostelName = { $regex: hostel, $options: 'i' };
    }

    const records = await Attendance.find(query)
      .populate('studentId', 'studentId name roomId dateOfJoining dateOfVacating status')
      .populate('markedBy', 'name username role')
      .sort({ dateStr: -1, studentCode: 1 });

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance/rollcall-sheet
 * Returns all active hostel students eligible for attendance roll call on a specific date.
 * Excludes students who have vacated prior to this date.
 * Includes existing marked attendance for the date if available.
 */
export const getRollCallSheet = async (req, res, next) => {
  try {
    const targetDateStr = normalizeDateStr(req.query.date) || normalizeDateStr(new Date());

    // 1. Fetch active students eligible for roll call.
    // Exclude students who have vacated the hostel.
    const allStudents = await Student.find({
      status: { $ne: 'Vacated' },
      dateOfVacating: null,
      $or: [
        { dateOfJoining: { $lte: new Date(`${targetDateStr}T23:59:59.999Z`) } },
        { dateOfJoining: null }
      ]
    }).populate('roomId');

    const eligibleStudents = allStudents.filter((s) => {
      // Exclude vacated students directly
      if (s.status === 'Vacated' || s.dateOfVacating) {
        return false;
      }
      const joinStr = normalizeDateStr(s.dateOfJoining || s.admissionDate || s.createdAt);
      if (joinStr && targetDateStr < joinStr) {
        return false; // Not joined yet on this date
      }
      return true;
    });

    // 2. Fetch any already saved attendance records for this date
    const studentIds = eligibleStudents.map((s) => s._id);
    const existingRecords = await Attendance.find({
      studentId: { $in: studentIds },
      dateStr: targetDateStr
    });

    const recordMap = new Map();
    existingRecords.forEach((r) => {
      recordMap.set(r.studentId.toString(), r);
    });

    // 3. Assemble response sheet
    const sheet = eligibleStudents.map((s) => {
      const existing = recordMap.get(s._id.toString());
      return {
        studentMongoId: s._id,
        studentId: s.studentId,
        name: s.name,
        roomNumber: s.roomId ? s.roomId.roomNumber : '',
        hostelName: s.roomId?.block ? `Block ${s.roomId.block}` : 'Main Hostel',
        dateOfJoining: s.dateOfJoining,
        dateOfVacating: s.dateOfVacating,
        status: s.status,
        attendanceStatus: existing ? existing.status : 'Present', // default to Present for quick marking
        remarks: existing ? existing.remarks : '',
        isSaved: Boolean(existing),
        lastMarkedAt: existing?.updatedAt || null
      };
    });

    res.json({
      success: true,
      date: targetDateStr,
      totalEligible: sheet.length,
      data: sheet
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/attendance
 * Save or update batch attendance roll call for a date.
 * Enforces validation:
 * - Prevents marking for dates after checkout date.
 * - Prevents marking for dates before joining date.
 * - Prevents duplicates via unique index and findOneAndUpdate with dateStr.
 * - Authoritative cumulative attendance rate re-calculated.
 */
export const saveAttendance = async (req, res, next) => {
  try {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records)) {
      res.status(400);
      throw new Error('Date and records array are required');
    }

    const dateStr = normalizeDateStr(date);
    if (!dateStr) {
      res.status(400);
      throw new Error('Valid date in YYYY-MM-DD format is required');
    }

    const targetDateUtc = getUtcStartOfDay(dateStr);
    const todayStr = normalizeDateStr(new Date());

    // Completed attendance cannot be marked for future dates
    if (dateStr > todayStr) {
      res.status(400);
      throw new Error(`Cannot record completed attendance for future dates (target: ${dateStr}, today: ${todayStr}).`);
    }

    const savedResults = [];
    const skippedRecords = [];

    for (const item of records) {
      if (!item.studentId) continue;
      const student = await resolveStudent(item.studentId);
      if (!student) {
        skippedRecords.push({ studentId: item.studentId, reason: 'Student not found' });
        continue;
      }

      // 1. Check joining date
      const joinStr = normalizeDateStr(student.dateOfJoining || student.admissionDate || student.createdAt);
      if (joinStr && dateStr < joinStr) {
        skippedRecords.push({
          studentId: student.studentId,
          reason: `Date ${dateStr} is prior to joining date ${joinStr}`
        });
        continue;
      }

      // 2. Check checkout / vacating status
      // Once a student vacates, they are strictly ineligible for attendance marking
      if (student.status === 'Vacated' || student.dateOfVacating) {
        skippedRecords.push({
          studentId: student.studentId,
          reason: `Student ${student.name} (${student.studentId}) has vacated the hostel. Vacated students cannot be marked for attendance.`
        });
        continue;
      }

      // 3. Validate status
      const validStatuses = ['Present', 'Absent', 'Leave'];
      const status = validStatuses.includes(item.status) ? item.status : 'Present';

      const roomNumber = student.roomId ? student.roomId.roomNumber : '';
      const hostelName = student.roomId?.block ? `Block ${student.roomId.block}` : 'Main Hostel';

      // 4. Upsert attendance record using unique key (studentId + dateStr)
      const doc = await Attendance.findOneAndUpdate(
        { studentId: student._id, dateStr },
        {
          studentCode: student.studentId,
          studentName: student.name,
          hostelName,
          roomNumber,
          date: targetDateUtc,
          dateStr,
          status,
          remarks: item.remarks || '',
          markedBy: req.user?._id
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      savedResults.push(doc);

      // 5. Recalculate student overall cumulative attendance
      await recalculateStudentOverallRate(student._id);
    }

    res.json({
      success: true,
      message: `Attendance saved for ${savedResults.length} student(s) on ${dateStr}`,
      savedCount: savedResults.length,
      skippedCount: skippedRecords.length,
      skippedDetails: skippedRecords,
      data: savedResults
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/attendance/:id
 * Edit an existing individual attendance record (status, remarks)
 */
export const updateSingleAttendance = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Attendance record not found');
    }

    const student = await Student.findById(record.studentId);
    if (!student) {
      res.status(404);
      throw new Error('Associated student not found');
    }

    // Verify student was not vacated
    if (student.status === 'Vacated' || student.dateOfVacating) {
      res.status(400);
      throw new Error(`Student ${student.name} (${student.studentId}) has vacated the hostel. Attendance cannot be edited or recorded for vacated students.`);
    }

    if (status) {
      if (!['Present', 'Absent', 'Leave'].includes(status)) {
        res.status(400);
        throw new Error("Invalid status. Allowed values: 'Present', 'Absent', 'Leave'");
      }
      record.status = status;
    }
    if (remarks !== undefined) {
      record.remarks = remarks;
    }
    record.markedBy = req.user?._id;
    await record.save();

    // Recalculate student rate
    await recalculateStudentOverallRate(student._id);

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance/month-wise
 * Comprehensive month-wise attendance report for an individual student.
 * Query params: studentId, year, month, leaveAsEligible
 */
export const getMonthWiseAttendanceReport = async (req, res, next) => {
  try {
    const { studentId, year, month, leaveAsEligible } = req.query;

    if (!studentId) {
      res.status(400);
      throw new Error('studentId query parameter is required');
    }

    const student = await resolveStudent(studentId);
    if (!student) {
      res.status(404);
      throw new Error(`Student not found for identifier: ${studentId}`);
    }

    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth() + 1;

    const rptYear = year ? parseInt(year, 10) : currentYear;
    const rptMonth = month ? parseInt(month, 10) : currentMonth;

    if (isNaN(rptYear) || rptYear < 2000 || rptYear > 2100) {
      res.status(400);
      throw new Error('Valid year is required (e.g. 2026)');
    }
    if (isNaN(rptMonth) || rptMonth < 1 || rptMonth > 12) {
      res.status(400);
      throw new Error('Valid month is required (1 to 12)');
    }

    // Determine days in this specific month (handling leap years)
    const daysInMonth = getDaysInMonth(rptYear, rptMonth);
    const monthStr = String(rptMonth).padStart(2, '0');
    const periodStart = `${rptYear}-${monthStr}-01`;
    const periodEnd = `${rptYear}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

    // Fetch student's attendance records for this month
    const records = await Attendance.find({
      studentId: student._id,
      dateStr: { $gte: periodStart, $lte: periodEnd }
    }).sort({ dateStr: 1 });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const report = computePeriodAttendance({
      student,
      records,
      periodStartDateStr: periodStart,
      periodEndDateStr: periodEnd,
      todayDateStr: normalizeDateStr(new Date()),
      leaveAsEligible: leaveAsEligible === 'true'
    });

    res.json({
      success: true,
      data: {
        ...report,
        year: rptYear,
        month: rptMonth,
        monthName: monthNames[rptMonth - 1],
        daysInMonth
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance/year-wise
 * Comprehensive year-wise attendance report for an individual student.
 * Uses weighted calculation across all eligible dates in the year.
 * Query params: studentId, year, leaveAsEligible
 */
export const getYearWiseAttendanceReport = async (req, res, next) => {
  try {
    const { studentId, year, leaveAsEligible } = req.query;

    if (!studentId) {
      res.status(400);
      throw new Error('studentId query parameter is required');
    }

    const student = await resolveStudent(studentId);
    if (!student) {
      res.status(404);
      throw new Error(`Student not found for identifier: ${studentId}`);
    }

    const rptYear = year ? parseInt(year, 10) : new Date().getUTCFullYear();
    if (isNaN(rptYear) || rptYear < 2000 || rptYear > 2100) {
      res.status(400);
      throw new Error('Valid year is required (e.g. 2026)');
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const yearStart = `${rptYear}-01-01`;
    const yearEnd = `${rptYear}-12-31`;

    // Fetch all attendance records for the entire year
    const yearRecords = await Attendance.find({
      studentId: student._id,
      dateStr: { $gte: yearStart, $lte: yearEnd }
    }).sort({ dateStr: 1 });

    const todayStr = normalizeDateStr(new Date());

    // Generate monthly breakdowns
    const monthlyBreakdown = [];
    for (let m = 1; m <= 12; m++) {
      const daysInM = getDaysInMonth(rptYear, m);
      const mStr = String(m).padStart(2, '0');
      const mStart = `${rptYear}-${mStr}-01`;
      const mEnd = `${rptYear}-${mStr}-${String(daysInM).padStart(2, '0')}`;

      const mRecords = yearRecords.filter((r) => r.dateStr >= mStart && r.dateStr <= mEnd);

      const mStats = computePeriodAttendance({
        student,
        records: mRecords,
        periodStartDateStr: mStart,
        periodEndDateStr: mEnd,
        todayDateStr: todayStr,
        leaveAsEligible: leaveAsEligible === 'true'
      });

      monthlyBreakdown.push({
        month: m,
        monthName: monthNames[m - 1],
        daysInMonth: daysInM,
        totalEligibleDays: mStats.totalEligibleDays,
        presentDays: mStats.presentDays,
        absentDays: mStats.absentDays,
        leaveDays: mStats.leaveDays,
        unrecordedDays: mStats.unrecordedDays,
        recordedDays: mStats.recordedDays,
        rate: mStats.rate,
        status: mStats.status,
        badgeColor: mStats.badgeColor
      });
    }

    // Weighted annual calculation
    const annualStats = computeAnnualAttendance(monthlyBreakdown);

    res.json({
      success: true,
      data: {
        studentId: student.studentId,
        studentMongoId: student._id,
        studentName: student.name,
        room: student.roomId ? student.roomId.roomNumber : '',
        hostel: student.roomId?.block ? `Block ${student.roomId.block}` : 'Main Hostel',
        dateOfJoining: student.dateOfJoining,
        dateOfVacating: student.dateOfVacating,
        isVacated: Boolean(student.dateOfVacating),
        year: rptYear,
        ...annualStats,
        monthlyBreakdown,
        chartData: monthlyBreakdown.map((m) => ({
          month: m.monthName.slice(0, 3),
          fullMonth: m.monthName,
          rate: m.totalEligibleDays > 0 ? m.rate : 0,
          present: m.presentDays,
          absent: m.absentDays,
          leave: m.leaveDays,
          eligible: m.totalEligibleDays
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance/analysis
 * Full Attendance Rate Analysis across all students (active & vacated)
 */
export const getAttendanceAnalysis = async (req, res, next) => {
  try {
    const students = await Student.find().populate('roomId');
    const todayStr = normalizeDateStr(new Date());

    const analysisList = await Promise.all(
      students.map(async (student) => {
        const joinStr = normalizeDateStr(student.dateOfJoining || student.admissionDate || student.createdAt);
        const vacateStr = student.dateOfVacating ? normalizeDateStr(student.dateOfVacating) : null;
        const effectiveEnd = vacateStr && vacateStr < todayStr ? vacateStr : todayStr;

        const records = await Attendance.find({
          studentId: student._id,
          dateStr: {
            $gte: joinStr,
            ...(vacateStr ? { $lte: vacateStr } : {})
          }
        }).sort({ dateStr: 1 });

        const stats = computePeriodAttendance({
          student,
          records,
          periodStartDateStr: joinStr,
          periodEndDateStr: effectiveEnd,
          todayDateStr: todayStr,
          leaveAsEligible: false
        });

        return {
          studentMongoId: student._id,
          studentId: student.studentId,
          name: student.name,
          room: student.roomId ? student.roomId.roomNumber : '',
          hostel: student.roomId?.block ? `Block ${student.roomId.block}` : 'Main Hostel',
          dateOfJoining: student.dateOfJoining,
          dateOfVacating: student.dateOfVacating,
          status: student.status,
          isVacated: Boolean(student.dateOfVacating),
          presentCount: stats.presentDays,
          absentCount: stats.absentDays,
          leaveCount: stats.leaveDays,
          unrecordedCount: stats.unrecordedDays,
          totalDays: stats.totalEligibleDays,
          rate: stats.totalEligibleDays > 0 ? stats.rate : null,
          format: stats.totalEligibleDays > 0 ? `${stats.presentDays} / ${stats.totalEligibleDays} (${stats.rate}%)` : '0 / 0 (No eligible days)',
          rateAnalysis: stats.status,
          badgeColor: stats.badgeColor
        };
      })
    );

    const activeResidents = analysisList.filter((a) => !a.isVacated);
    const activeWithData = activeResidents.filter((a) => a.rate !== null);
    const overallRate = activeWithData.length > 0
      ? Math.round(activeWithData.reduce((acc, curr) => acc + curr.rate, 0) / activeWithData.length)
      : 0;

    res.json({
      success: true,
      summary: {
        totalStudents: students.length,
        activeStudents: activeResidents.length,
        vacatedStudents: analysisList.filter((a) => a.isVacated).length,
        overallRate,
        highAttendanceCount: activeResidents.filter((a) => a.rate !== null && a.rate >= 90).length,
        averageAttendanceCount: activeResidents.filter((a) => a.rate !== null && a.rate >= 75 && a.rate < 90).length,
        lowAttendanceCount: activeResidents.filter((a) => a.rate !== null && a.rate < 75).length,
        newJoinersCount: activeResidents.filter((a) => a.totalDays === 0).length
      },
      data: analysisList
    });
  } catch (error) {
    next(error);
  }
};
