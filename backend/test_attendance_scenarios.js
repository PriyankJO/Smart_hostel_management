import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import connectDB from './src/config/db.js';
import Attendance from './src/models/Attendance.js';
import Student from './src/models/Student.js';
import Room from './src/models/Room.js';
import User from './src/models/User.js';
import {
  computePeriodAttendance,
  computeAnnualAttendance,
  getDaysInMonth,
  normalizeDateStr,
  getUtcStartOfDay
} from './src/utils/attendanceCalculator.js';
import {
  saveAttendance,
  getMonthWiseAttendanceReport,
  getYearWiseAttendanceReport,
  getRollCallSheet
} from './src/controllers/attendanceController.js';
import { checkoutStudent, updateStudent, deleteStudent } from './src/controllers/studentController.js';

async function runTestSuite() {
  console.log('========================================================');
  console.log('       STUDENT ATTENDANCE MODULE COMPREHENSIVE TESTS     ');
  console.log('========================================================\n');

  await connectDB();
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // Scenario 1: Basic attendance
  // A student has 20 eligible attendance days, 16 Present days, and 4 Absent days.
  // Expected attendance percentage: 80%.
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 1: Basic Attendance Calculation ---');
  {
    const mockStudent = {
      _id: new mongoose.Types.ObjectId(),
      studentId: 'TEST-SCENARIO-1',
      name: 'Scenario 1 Student',
      dateOfJoining: '2026-09-01',
      dateOfVacating: null
    };
    const mockRecords = [];
    for (let i = 1; i <= 16; i++) {
      mockRecords.push({ dateStr: `2026-09-${String(i).padStart(2, '0')}`, status: 'Present' });
    }
    for (let i = 17; i <= 20; i++) {
      mockRecords.push({ dateStr: `2026-09-${String(i).padStart(2, '0')}`, status: 'Absent' });
    }

    const res = computePeriodAttendance({
      student: mockStudent,
      records: mockRecords,
      periodStartDateStr: '2026-09-01',
      periodEndDateStr: '2026-09-20',
      todayDateStr: '2026-09-20'
    });

    assert(res.totalEligibleDays === 20, `Total eligible days is 20 (got: ${res.totalEligibleDays})`);
    assert(res.presentDays === 16, `Present days is 16 (got: ${res.presentDays})`);
    assert(res.absentDays === 4, `Absent days is 4 (got: ${res.absentDays})`);
    assert(res.rate === 80, `Expected attendance percentage is exactly 80% (got: ${res.rate}%)`);
    assert(res.status === 'Good', `Status classification is Good (got: ${res.status})`);
  }

  // -------------------------------------------------------------------------
  // Scenario 2: Month-wise report
  // A student has 15 eligible attendance days in a selected month, with 12 Present days.
  // Expected attendance percentage: 80%.
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Month-Wise Report ---');
  {
    const mockStudent = {
      _id: new mongoose.Types.ObjectId(),
      studentId: 'TEST-SCENARIO-2',
      name: 'Scenario 2 Student',
      dateOfJoining: '2026-04-01',
      dateOfVacating: '2026-04-15' // vacated after 15th
    };
    const mockRecords = [];
    for (let i = 1; i <= 12; i++) {
      mockRecords.push({ dateStr: `2026-04-${String(i).padStart(2, '0')}`, status: 'Present' });
    }
    for (let i = 13; i <= 15; i++) {
      mockRecords.push({ dateStr: `2026-04-${String(i).padStart(2, '0')}`, status: 'Absent' });
    }

    const res = computePeriodAttendance({
      student: mockStudent,
      records: mockRecords,
      periodStartDateStr: '2026-04-01',
      periodEndDateStr: '2026-04-30',
      todayDateStr: '2026-04-30'
    });

    assert(res.totalEligibleDays === 15, `Eligible days in April up to checkout is 15 (got: ${res.totalEligibleDays})`);
    assert(res.presentDays === 12, `Present days is 12 (got: ${res.presentDays})`);
    assert(res.rate === 80, `Attendance percentage is 80% (got: ${res.rate}%)`);
    assert(res.dailyBreakdown.length === 30, `April has 30 days in breakdown (got: ${res.dailyBreakdown.length})`);
    const day16 = res.dailyBreakdown.find(d => d.date === '2026-04-16');
    assert(day16.isEligible === false && day16.status === 'Vacated', `Day 16 after checkout is flagged as Vacated & ineligible`);
  }

  // -------------------------------------------------------------------------
  // Scenario 3: Year-wise report
  // A student has 200 eligible attendance days during the year, with 170 Present days.
  // Expected annual attendance percentage: 85%.
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Weighted Year-Wise Report ---');
  {
    const monthlyData = [
      { totalEligibleDays: 20, presentDays: 17, absentDays: 3, leaveDays: 0 },
      { totalEligibleDays: 20, presentDays: 17, absentDays: 3, leaveDays: 0 },
      { totalEligibleDays: 20, presentDays: 17, absentDays: 3, leaveDays: 0 },
      { totalEligibleDays: 20, presentDays: 17, absentDays: 3, leaveDays: 0 },
      { totalEligibleDays: 20, presentDays: 17, absentDays: 3, leaveDays: 0 },
      { totalEligibleDays: 20, presentDays: 17, absentDays: 3, leaveDays: 0 },
      { totalEligibleDays: 20, presentDays: 17, absentDays: 3, leaveDays: 0 },
      { totalEligibleDays: 20, presentDays: 17, absentDays: 3, leaveDays: 0 },
      { totalEligibleDays: 20, presentDays: 17, absentDays: 3, leaveDays: 0 },
      { totalEligibleDays: 20, presentDays: 17, absentDays: 3, leaveDays: 0 },
      { totalEligibleDays: 0, presentDays: 0, absentDays: 0, leaveDays: 0 },
      { totalEligibleDays: 0, presentDays: 0, absentDays: 0, leaveDays: 0 }
    ];

    const annual = computeAnnualAttendance(monthlyData);
    assert(annual.annualEligibleDays === 200, `Annual eligible days sum is 200 (got: ${annual.annualEligibleDays})`);
    assert(annual.annualPresentDays === 170, `Annual present days is 170 (got: ${annual.annualPresentDays})`);
    assert(annual.annualRate === 85, `Expected weighted annual percentage is exactly 85% (got: ${annual.annualRate}%)`);
    assert(annual.status === 'Good', `Annual status is Good (got: ${annual.status})`);
  }

  // -------------------------------------------------------------------------
  // Scenario 4: Student vacates the hostel
  // A student checks out on 15 June.
  // Historical attendance preserved, excluded from future attendance marking,
  // dates after 15 June excluded from completed attendance.
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Hostel Vacating & Checkout Integration ---');
  {
    // Create temporary student for checkout test
    const dummyUser = await User.create({
      username: `test_vacate_${Date.now()}`,
      password: 'Password@123',
      role: 'student',
      name: 'Vacate Test Student'
    });

    const dummyRoom = await Room.create({
      roomNumber: `VR-${Date.now()}`,
      block: 'T',
      capacity: 2,
      occupied: 1,
      type: 'Single'
    });

    const student = await Student.create({
      studentId: `STU-VAC-${Date.now()}`,
      userId: dummyUser._id,
      name: 'Vacate Test Student',
      roomId: dummyRoom._id,
      dateOfJoining: getUtcStartOfDay('2026-06-01'),
      status: 'Active'
    });

    // Mark attendance for 2026-06-10 and 2026-06-15 (both Present)
    await Attendance.create({
      studentId: student._id,
      studentCode: student.studentId,
      studentName: student.name,
      roomNumber: dummyRoom.roomNumber,
      date: getUtcStartOfDay('2026-06-10'),
      dateStr: '2026-06-10',
      status: 'Present'
    });
    await Attendance.create({
      studentId: student._id,
      studentCode: student.studentId,
      studentName: student.name,
      roomNumber: dummyRoom.roomNumber,
      date: getUtcStartOfDay('2026-06-15'),
      dateStr: '2026-06-15',
      status: 'Present'
    });

    // Execute official checkout on 15 June 2026
    let checkoutRes = null;
    await checkoutStudent(
      { params: { id: student._id }, body: { checkoutDate: '2026-06-15', reason: 'Graduated' }, user: { _id: dummyUser._id } },
      { json: (d) => { checkoutRes = d; } },
      (err) => { throw err; }
    );

    assert(checkoutRes.success === true, 'Checkout endpoint returned success');
    assert(checkoutRes.deletedAttendanceCount === 2, `Checkout deletedAttendanceCount reported 2 records removed (got: ${checkoutRes.deletedAttendanceCount})`);

    const updatedStudent = await Student.findById(student._id);
    assert(updatedStudent.status === 'Vacated', `Student status updated to Vacated (got: ${updatedStudent.status})`);
    assert(updatedStudent.roomId === null, 'Student roomId released to null');
    assert(updatedStudent.attendance === 0, `Student cumulative attendance reset to 0% (got: ${updatedStudent.attendance}%)`);
    assert(normalizeDateStr(updatedStudent.dateOfVacating) === '2026-06-15', 'Checkout date stored as 2026-06-15');

    const updatedRoom = await Room.findById(dummyRoom._id);
    assert(updatedRoom.occupied === 0, `Room occupied count decremented to 0 (got: ${updatedRoom.occupied})`);

    // Verify historical attendance was DIRECTLY REMOVED from DB
    const hist = await Attendance.find({ studentId: student._id });
    assert(hist.length === 0, `Once student vacates, attendance records are directly removed: 0 records found in DB (got: ${hist.length})`);

    // Verify roll-call sheet excludes student directly
    let rollCallRes = null;
    await getRollCallSheet(
      { query: { date: '2026-06-16' } },
      { json: (d) => { rollCallRes = d; } },
      (err) => { throw err; }
    );
    const inSheet = rollCallRes.data.some(s => s.studentId === student.studentId);
    assert(inSheet === false, 'Student is automatically excluded from roll-call sheet once vacated');

    // Attempt to mark attendance after checkout date should be rejected
    let saveRes = null;
    await saveAttendance(
      { body: { date: '2026-06-16', records: [{ studentId: student.studentId, status: 'Present' }] }, user: { _id: dummyUser._id } },
      { json: (d) => { saveRes = d; } },
      (err) => { throw err; }
    );
    assert(saveRes.savedCount === 0 && saveRes.skippedCount === 1, 'Attendance marking for vacated student is strictly rejected / skipped');

    // Clean up temporary documents
    await User.findByIdAndDelete(dummyUser._id);
    await Room.findByIdAndDelete(dummyRoom._id);
    await Student.findByIdAndDelete(student._id);
    await Attendance.deleteMany({ studentId: student._id });
  }

  // -------------------------------------------------------------------------
  // Scenario 5: Missing / Incomplete attendance
  // A student has 10 scheduled eligible attendance days, but attendance was
  // recorded for only 8 days.
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Missing / Incomplete Attendance Handling ---');
  {
    const mockStudent = {
      _id: new mongoose.Types.ObjectId(),
      studentId: 'TEST-SCENARIO-5',
      name: 'Scenario 5 Student',
      dateOfJoining: '2026-10-01',
      dateOfVacating: null
    };
    // 8 days recorded: 6 Present, 2 Absent out of 10 days
    const mockRecords = [];
    for (let i = 1; i <= 6; i++) {
      mockRecords.push({ dateStr: `2026-10-${String(i).padStart(2, '0')}`, status: 'Present' });
    }
    for (let i = 7; i <= 8; i++) {
      mockRecords.push({ dateStr: `2026-10-${String(i).padStart(2, '0')}`, status: 'Absent' });
    }
    // Days 9 and 10 have no records recorded!

    const res = computePeriodAttendance({
      student: mockStudent,
      records: mockRecords,
      periodStartDateStr: '2026-10-01',
      periodEndDateStr: '2026-10-10',
      todayDateStr: '2026-10-10'
    });

    assert(res.totalEligibleDays === 10, `Total eligible days is 10 (got: ${res.totalEligibleDays})`);
    assert(res.presentDays === 6, `Present days is 6 (got: ${res.presentDays})`);
    assert(res.absentDays === 2, `Absent days is 2 (got: ${res.absentDays})`);
    assert(res.unrecordedDays === 2, `Clearly flags 2 unrecorded days (got: ${res.unrecordedDays})`);
    assert(res.rate === 60, `Rate does not silently assume unrecorded as Present: 6/10 = 60% (got: ${res.rate}%)`);
  }

  // -------------------------------------------------------------------------
  // Scenario 6: Duplicate attendance prevention
  // Attempt to mark the same student's attendance twice on the same date.
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 6: Duplicate Attendance Prevention ---');
  {
    const firstStudent = await Student.findOne();
    if (firstStudent) {
      const testDateStr = '2026-10-10';

      // First mark: Present
      await Attendance.findOneAndUpdate(
        { studentId: firstStudent._id, dateStr: testDateStr },
        {
          studentCode: firstStudent.studentId,
          studentName: firstStudent.name,
          date: getUtcStartOfDay(testDateStr),
          dateStr: testDateStr,
          status: 'Present',
          remarks: 'First mark'
        },
        { upsert: true, new: true }
      );

      // Second mark on same date: Absent (should update, not duplicate)
      await Attendance.findOneAndUpdate(
        { studentId: firstStudent._id, dateStr: testDateStr },
        {
          status: 'Absent',
          remarks: 'Updated mark'
        },
        { upsert: true, new: true }
      );

      const recordsOnDate = await Attendance.find({
        studentId: firstStudent._id,
        dateStr: testDateStr
      });

      assert(recordsOnDate.length === 1, `Exactly 1 record exists on date, duplicate prevented (got: ${recordsOnDate.length})`);
      assert(recordsOnDate[0].status === 'Absent', `Record was cleanly updated to Absent (got: ${recordsOnDate[0].status})`);
    } else {
      console.log('[SKIP] No student in DB to test duplicate');
    }
  }

  // -------------------------------------------------------------------------
  // Scenario 7: Re-admission
  // A student vacates the hostel and later receives a new allocation.
  // Previous attendance history remains intact, new allocation period determines eligibility.
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 7: Re-admission & Multiple Stay Periods ---');
  {
    const dummyUser = await User.create({
      username: `test_readmit_${Date.now()}`,
      password: 'Password@123',
      role: 'student',
      name: 'Readmit Test Student'
    });

    // Stay 1: Jan 1 to Mar 31 2026
    const student = await Student.create({
      studentId: `STU-READMIT-${Date.now()}`,
      userId: dummyUser._id,
      name: 'Readmit Test Student',
      dateOfJoining: getUtcStartOfDay('2026-01-01'),
      status: 'Active'
    });

    // Old attendance record in stay 1
    await Attendance.create({
      studentId: student._id,
      studentCode: student.studentId,
      studentName: student.name,
      date: getUtcStartOfDay('2026-01-15'),
      dateStr: '2026-01-15',
      status: 'Present'
    });

    // Vacate student via official checkout
    await checkoutStudent(
      { params: { id: student._id }, body: { checkoutDate: '2026-03-31' }, user: { _id: dummyUser._id } },
      { json: () => {} },
      (err) => { throw err; }
    );
    const vacatedRecords = await Attendance.find({ studentId: student._id });
    assert(vacatedRecords.length === 0, 'Stay 1 attendance records were directly removed upon vacating');

    // Readmission on Aug 1 2026 (dateOfJoining updated, dateOfVacating cleared, status set to Active)
    student.dateOfJoining = getUtcStartOfDay('2026-08-01');
    student.dateOfVacating = null;
    student.status = 'Active';
    await student.save();

    // New attendance in stay 2
    await Attendance.create({
      studentId: student._id,
      studentCode: student.studentId,
      studentName: student.name,
      date: getUtcStartOfDay('2026-08-10'),
      dateStr: '2026-08-10',
      status: 'Present'
    });

    const totalRecords = await Attendance.find({ studentId: student._id });
    assert(totalRecords.length === 1, `Active re-admitted stay records only new stay attendance (got: ${totalRecords.length})`);

    // Report for August 2026 reflects new stay period
    const resAug = computePeriodAttendance({
      student,
      records: totalRecords,
      periodStartDateStr: '2026-08-01',
      periodEndDateStr: '2026-08-31',
      todayDateStr: '2026-08-31'
    });
    assert(resAug.presentDays === 1, `August stay reflects attendance from new joining date (got: ${resAug.presentDays} present)`);

    // Clean up
    await User.findByIdAndDelete(dummyUser._id);
    await Student.findByIdAndDelete(student._id);
    await Attendance.deleteMany({ studentId: student._id });
  }

  // -------------------------------------------------------------------------
  // Scenario 8: Direct Attendance Removal on Student Status Update & Deletion
  // Setting status to 'Vacated' directly clears all attendance records.
  // Deleting a student directly removes all attendance records from DB.
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 8: Direct Attendance Removal on Vacate & Deletion ---');
  {
    const dummyUser = await User.create({
      username: `test_vac_del_${Date.now()}`,
      password: 'Password@123',
      role: 'student',
      name: 'Vacate Delete Student'
    });

    const student = await Student.create({
      studentId: `STU-VACDEL-${Date.now()}`,
      userId: dummyUser._id,
      name: 'Vacate Delete Student',
      dateOfJoining: getUtcStartOfDay('2026-05-01'),
      status: 'Active'
    });

    // Mark 3 days attendance
    for (let day = 1; day <= 3; day++) {
      await Attendance.create({
        studentId: student._id,
        studentCode: student.studentId,
        studentName: student.name,
        date: getUtcStartOfDay(`2026-05-0${day}`),
        dateStr: `2026-05-0${day}`,
        status: 'Present'
      });
    }

    const beforeVacate = await Attendance.find({ studentId: student._id });
    assert(beforeVacate.length === 3, `3 attendance records exist before vacating (got: ${beforeVacate.length})`);

    // 1. Update status to 'Vacated' via updateStudent
    await updateStudent(
      { params: { id: student._id }, body: { status: 'Vacated', dateOfVacating: '2026-05-15' }, user: { _id: dummyUser._id } },
      { json: () => {} },
      (err) => { throw err; }
    );

    const afterVacate = await Attendance.find({ studentId: student._id });
    assert(afterVacate.length === 0, `All attendance records directly removed upon updating status to Vacated (got: ${afterVacate.length})`);

    // 2. Add a record and test deleteStudent
    await Attendance.create({
      studentId: student._id,
      studentCode: student.studentId,
      studentName: student.name,
      date: getUtcStartOfDay('2026-05-20'),
      dateStr: '2026-05-20',
      status: 'Present'
    });

    await deleteStudent(
      { params: { id: student._id } },
      { json: () => {} },
      (err) => { throw err; }
    );

    const afterDelete = await Attendance.find({ studentId: student._id });
    assert(afterDelete.length === 0, `All attendance records directly removed upon student deletion (got: ${afterDelete.length})`);

    await User.findByIdAndDelete(dummyUser._id);
  }

  // -------------------------------------------------------------------------
  // Edge Case Tests: Leap years, zero eligible days, division by zero
  // -------------------------------------------------------------------------
  console.log('\n--- Edge Case Validations ---');
  {
    // Leap year February (2024 has 29 days, 2026 has 28 days)
    const feb2024 = getDaysInMonth(2024, 2);
    const feb2026 = getDaysInMonth(2026, 2);
    assert(feb2024 === 29, `Leap year Feb 2024 has 29 days (got: ${feb2024})`);
    assert(feb2026 === 28, `Non-leap year Feb 2026 has 28 days (got: ${feb2026})`);

    // Zero eligible days division-by-zero protection
    const zeroRes = computePeriodAttendance({
      student: { dateOfJoining: '2027-01-01', dateOfVacating: null },
      records: [],
      periodStartDateStr: '2026-05-01',
      periodEndDateStr: '2026-05-31',
      todayDateStr: '2026-05-31'
    });
    assert(zeroRes.totalEligibleDays === 0, `Zero eligible days counted when period is before joining`);
    assert(zeroRes.rate === 0, `Rate handles division by zero safely without NaN (got: ${zeroRes.rate}%)`);
    assert(zeroRes.status === 'No Eligible Days', `Status indicates No Eligible Days`);
  }

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
