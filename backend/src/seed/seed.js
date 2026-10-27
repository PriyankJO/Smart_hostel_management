import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import connectDB from '../config/db.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Staff from '../models/Staff.js';
import Room from '../models/Room.js';
import Fee from '../models/Fee.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Complaint from '../models/Complaint.js';
import Visitor from '../models/Visitor.js';
import Notice from '../models/Notice.js';
import Salary from '../models/Salary.js';
import CanteenTransaction from '../models/CanteenTransaction.js';
import MessMenu from '../models/MessMenu.js';
import CanteenItem from '../models/CanteenItem.js';
import FinanceTransaction from '../models/FinanceTransaction.js';

import { staffAccounts, wardens, students, rooms, fees, leaveRequests, complaints, visitors, messMenu, notices, canteenTransactions, salaryRecords, staffAttendanceRecords, canteenMenuItems, financeTransactions } from '../../../frontend/src/data/mockData.js';

const seedData = async () => {
  try {
    await connectDB();

    // Clear DB
    await User.deleteMany();
    await Student.deleteMany();
    await Staff.deleteMany();
    await Room.deleteMany();
    await Fee.deleteMany();
    await Attendance.deleteMany();
    await Leave.deleteMany();
    await Complaint.deleteMany();
    await Visitor.deleteMany();
    await Notice.deleteMany();
    await Salary.deleteMany();
    await CanteenTransaction.deleteMany();
    await MessMenu.deleteMany();
    await CanteenItem.deleteMany();
    await FinanceTransaction.deleteMany();

    console.log('Database Cleared');

    const createdUsers = {};
    const createdRooms = {};
    const createdStudents = {};
    const createdStaff = {};

    // 1. Seed Rooms
    for (const r of rooms) {
      const room = await Room.create({
        roomNumber: r.number,
        block: r.block,
        capacity: r.capacity,
        type: r.type,
        occupied: 0,
        status: 'Available'
      });
      createdRooms[r.number] = room;
    }
    console.log('Rooms seeded');

    // 2. Seed Staff Accounts (Users + Staff profile)
    for (const s of staffAccounts) {
      const pword = s.role === 'admin' ? 'Admin@123' : 
                   s.role === 'warden' ? 'Warden@123' : 
                   s.role === 'accountant' ? 'Accountant@123' : 
                   (s.role === 'canteen_manager' || s.role === 'canteen') ? 'Canteen@123' : 'Staff@123';

      const user = await User.create({
        username: s.username,
        email: s.email,
        password: pword,
        role: s.role,
        name: s.name,
        phone: s.phone,
        dob: s.dob
      });
      createdUsers[s.username] = user;

      const staff = await Staff.create({
        staffId: s.id,
        userId: user._id,
        username: s.username,
        name: s.name,
        role: s.role,
        phone: s.phone,
        email: s.email,
        dob: s.dob,
        shift: s.shift
      });
      createdStaff[s.id] = staff;
    }
    console.log('Staff seeded');

    // 3. Seed Students
    for (const s of students) {
      const user = await User.create({
        username: s.id,
        password: 'Student@123',
        role: 'student',
        name: s.name,
        phone: s.phone,
        dob: s.dob
      });

      const studentData = {
        studentId: s.id,
        userId: user._id,
        name: s.name,
        course: s.course,
        phone: s.phone,
        dob: s.dob,
        fatherName: s.fatherName,
        address: s.address,
        feeStatus: s.feeStatus || 'Due',
        attendance: s.attendance || 0,
        dateOfJoining: s.dateOfJoining ? new Date(s.dateOfJoining) : new Date("2026-01-05"),
        dateOfVacating: s.dateOfVacating ? new Date(s.dateOfVacating) : null,
        status: s.dateOfVacating ? 'Vacated' : 'Active'
      };

      if (s.room && createdRooms[s.room]) {
        studentData.roomId = createdRooms[s.room]._id;
        
        // Update room occupation
        createdRooms[s.room].occupied += 1;
        if (createdRooms[s.room].occupied >= createdRooms[s.room].capacity) {
          createdRooms[s.room].status = 'Full';
        }
        await createdRooms[s.room].save();
      }

      const student = await Student.create(studentData);
      createdStudents[s.id] = student;

      if (student.roomId) {
        createdRooms[s.room].students.push(student._id);
        await createdRooms[s.room].save();
      }
    }
    console.log('Students seeded');

    // 4. Seed Fees
    for (const f of fees) {
      if (createdStudents[f.studentId]) {
        await Fee.create({
          receiptId: f.id,
          studentId: createdStudents[f.studentId]._id,
          amount: f.amount,
          date: f.date === '—' ? new Date() : new Date(f.date),
          status: f.status
        });
      }
    }
    console.log('Fees seeded');

    // 5. Seed Leave Requests
    for (const l of leaveRequests) {
      if (!l.isStaff && createdStudents[l.studentId]) {
        await Leave.create({
          leaveId: l.id,
          studentId: createdStudents[l.studentId]._id,
          from: new Date(l.from),
          to: new Date(l.to),
          reason: l.reason,
          status: l.status === 'Approved' ? 'Approved' : l.status === 'Rejected' ? 'Rejected' : 'Pending'
        });
      }
    }
    console.log('Leaves seeded');

    // 6. Seed Complaints
    for (const c of complaints) {
      const student = Object.values(createdStudents).find(s => s.name === c.student);
      if (student) {
        await Complaint.create({
          complaintId: c.id,
          studentId: student._id,
          roomId: student.roomId,
          category: c.category,
          detail: c.detail,
          status: c.status,
          priority: 'Medium'
        });
      }
    }
    console.log('Complaints seeded');

    // 7. Seed Visitors
    for (const v of visitors) {
      const student = Object.values(createdStudents).find(s => s.name === v.toMeet);
      if (student) {
        await Visitor.create({
          visitorId: v.id,
          name: v.name,
          phone: '9999999999',
          studentId: student._id,
          purpose: v.purpose,
          checkIn: new Date(v.in.replace('—', new Date().toISOString())),
          status: v.out === '—' ? 'Active' : 'Checked Out',
          checkOut: v.out !== '—' ? new Date(v.out) : undefined
        });
      }
    }
    console.log('Visitors seeded');

    // 8. Seed Notices
    for (const n of notices) {
      await Notice.create({
        title: n.title,
        description: n.content,
        date: new Date(n.date),
        tag: n.tag,
      });
    }
    console.log('Notices seeded');

    // 9. Seed Salary
    for (const s of salaryRecords) {
      if (createdStaff[s.staffId]) {
        await Salary.create({
          salaryId: s.id,
          staffId: createdStaff[s.staffId]._id,
          month: s.month,
          basic: s.basic,
          allowances: s.allowances,
          deductions: s.deductions,
          netPay: s.netPay,
          status: s.status,
          paidOn: s.paidOn ? new Date(s.paidOn) : undefined
        });
      }
    }
    console.log('Salaries seeded');

    // 10. Seed Canteen Transactions
    for (const c of canteenTransactions) {
      await CanteenTransaction.create({
        transactionId: c.id,
        date: new Date(c.date),
        description: c.description,
        category: c.category,
        type: c.type,
        amount: c.amount
      });
    }
    console.log('Canteen Transactions seeded');

    // 11. Seed Mess Menu
    for (const [day, meals] of Object.entries(messMenu)) {
      await MessMenu.create({
        day,
        breakfast: meals.breakfast,
        lunch: meals.lunch,
        dinner: meals.dinner
      });
    }
    console.log('Mess Menu seeded');

    // 12. Seed Canteen Menu Items
    for (const itm of canteenMenuItems) {
      await CanteenItem.create({
        itemId: itm.id,
        name: itm.name,
        category: itm.category,
        price: itm.price,
        isVeg: itm.isVeg,
        status: itm.status,
        mealTiming: itm.mealTiming,
        description: itm.description
      });
    }
    console.log('Canteen Menu Items seeded');

    // 13. Seed Finance Transactions
    for (const f of financeTransactions) {
      await FinanceTransaction.create({
        transactionId: f.id,
        title: f.title,
        category: f.category,
        type: f.type,
        amount: f.amount,
        date: new Date(f.date),
        paymentMethod: f.paymentMethod,
        payerPayee: f.payerPayee,
        reference: f.reference,
        status: f.status,
        notes: f.notes
      });
    }
    console.log('Finance Transactions seeded');

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

seedData();
