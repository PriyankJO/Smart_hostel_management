import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import connectDB from '../config/db.js';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Room from '../models/Room.js';
import { normalizeDateStr, getUtcStartOfDay } from '../utils/attendanceCalculator.js';
import { recalculateStudentOverallRate } from '../controllers/attendanceController.js';

async function migrate() {
  try {
    await connectDB();
    console.log('--- Starting Attendance Migration & Synchronization ---');

    // 1. Enrich existing attendance records
    const existingRecords = await Attendance.find().populate({
      path: 'studentId',
      populate: { path: 'roomId' }
    });

    console.log(`Found ${existingRecords.length} existing attendance records in DB.`);
    let enrichedCount = 0;

    for (const doc of existingRecords) {
      let changed = false;
      if (!doc.dateStr && doc.date) {
        doc.dateStr = normalizeDateStr(doc.date);
        changed = true;
      }
      if (doc.studentId) {
        const student = doc.studentId;
        if (!doc.studentCode && student.studentId) {
          doc.studentCode = student.studentId;
          changed = true;
        }
        if (!doc.studentName && student.name) {
          doc.studentName = student.name;
          changed = true;
        }
        if (!doc.roomNumber && student.roomId?.roomNumber) {
          doc.roomNumber = student.roomId.roomNumber;
          changed = true;
        }
        if (!doc.hostelName && student.roomId?.block) {
          doc.hostelName = `Block ${student.roomId.block}`;
          changed = true;
        }
      }
      if (changed) {
        await doc.save();
        enrichedCount++;
      }
    }
    console.log(`Enriched ${enrichedCount} existing records with student metadata & dateStr.`);

    // 2. Ensure indexes
    try {
      await Attendance.syncIndexes();
      console.log('Attendance collection indexes synchronized successfully.');
    } catch (idxErr) {
      console.warn('Index sync notice:', idxErr.message);
    }

    // 3. Seed historical baseline records for students with no records
    const students = await Student.find().populate('roomId');
    console.log(`Checking attendance coverage for ${students.length} students...`);

    const todayStr = normalizeDateStr(new Date());

    for (const student of students) {
      // Ensure dateOfJoining is a valid past date (e.g. from 2026-01-05 if defaulted to today)
      const currentJoin = normalizeDateStr(student.dateOfJoining);
      if (!currentJoin || currentJoin >= todayStr) {
        student.dateOfJoining = getUtcStartOfDay('2026-01-05');
        student.admissionDate = getUtcStartOfDay('2026-01-05');
        await student.save();
      }

      const joinStr = normalizeDateStr(student.dateOfJoining);
      const vacateStr = student.dateOfVacating ? normalizeDateStr(student.dateOfVacating) : null;

      const studentRecordsCount = await Attendance.countDocuments({ studentId: student._id });
      
      // If student has very few or no records, seed a realistic 30-day history leading up to today
      // respecting their joining date and vacating date
      if (studentRecordsCount < 5) {
        console.log(`Generating realistic baseline history for ${student.name} (${student.studentId})...`);
        const targetRate = student.attendance || 85;
        let createdForStudent = 0;

        for (let i = 25; i >= 1; i--) {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() - i);
          const dStr = normalizeDateStr(d);

          if (dStr < joinStr) continue;
          if (vacateStr && dStr > vacateStr) continue;

          // Check if record already exists for this date
          const exists = await Attendance.findOne({ studentId: student._id, dateStr: dStr });
          if (!exists) {
            // Determine status based on target rate
            const isPresent = (i % 7 !== 0) && (Math.random() * 100 < targetRate);
            const status = isPresent ? 'Present' : (i % 5 === 0 ? 'Leave' : 'Absent');
            const remarks = status === 'Leave' ? 'Approved medical leave' : (status === 'Absent' ? 'Unexcused' : '');

            await Attendance.create({
              studentId: student._id,
              studentCode: student.studentId,
              studentName: student.name,
              hostelName: student.roomId?.block ? `Block ${student.roomId.block}` : 'Main Hostel',
              roomNumber: student.roomId ? student.roomId.roomNumber : '',
              date: getUtcStartOfDay(dStr),
              dateStr: dStr,
              status,
              remarks
            });
            createdForStudent++;
          }
        }
        console.log(`Created ${createdForStudent} attendance records for ${student.name}.`);
      }

      // Authoritative recalculation of student rate
      await recalculateStudentOverallRate(student._id);
    }

    const totalRecords = await Attendance.countDocuments();
    console.log(`--- Migration Complete! Total attendance records in DB: ${totalRecords} ---`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
