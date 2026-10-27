import fs from 'fs';
import path from 'path';

const dirs = [
  'src/config',
  'src/controllers',
  'src/middleware',
  'src/models',
  'src/routes',
  'src/utils',
  'src/seed'
];

const files = {
  'src/config/db.js': '',
  'src/controllers/authController.js': '',
  'src/controllers/studentController.js': '',
  'src/controllers/staffController.js': '',
  'src/controllers/wardenController.js': '',
  'src/controllers/roomController.js': '',
  'src/controllers/feeController.js': '',
  'src/controllers/attendanceController.js': '',
  'src/controllers/leaveController.js': '',
  'src/controllers/complaintController.js': '',
  'src/controllers/maintenanceController.js': '',
  'src/controllers/visitorController.js': '',
  'src/controllers/noticeController.js': '',
  'src/controllers/salaryController.js': '',
  'src/controllers/canteenController.js': '',
  'src/controllers/messController.js': '',
  'src/controllers/reportController.js': '',
  'src/controllers/dashboardController.js': '',
  'src/middleware/authMiddleware.js': '',
  'src/middleware/roleMiddleware.js': '',
  'src/middleware/errorMiddleware.js': '',
  'src/middleware/validationMiddleware.js': '',
  'src/models/User.js': '',
  'src/models/Student.js': '',
  'src/models/Staff.js': '',
  'src/models/Warden.js': '',
  'src/models/Room.js': '',
  'src/models/Fee.js': '',
  'src/models/Attendance.js': '',
  'src/models/Leave.js': '',
  'src/models/Complaint.js': '',
  'src/models/Maintenance.js': '',
  'src/models/Visitor.js': '',
  'src/models/Notice.js': '',
  'src/models/Salary.js': '',
  'src/models/CanteenTransaction.js': '',
  'src/models/MessMenu.js': '',
  'src/models/RoomHistory.js': '',
  'src/routes/authRoutes.js': '',
  'src/routes/studentRoutes.js': '',
  'src/routes/staffRoutes.js': '',
  'src/routes/wardenRoutes.js': '',
  'src/routes/roomRoutes.js': '',
  'src/routes/feeRoutes.js': '',
  'src/routes/attendanceRoutes.js': '',
  'src/routes/leaveRoutes.js': '',
  'src/routes/complaintRoutes.js': '',
  'src/routes/maintenanceRoutes.js': '',
  'src/routes/visitorRoutes.js': '',
  'src/routes/noticeRoutes.js': '',
  'src/routes/salaryRoutes.js': '',
  'src/routes/canteenRoutes.js': '',
  'src/routes/messRoutes.js': '',
  'src/routes/reportRoutes.js': '',
  'src/routes/dashboardRoutes.js': '',
  'src/utils/generateToken.js': '',
  'src/utils/generateId.js': '',
  'src/utils/pagination.js': '',
  'src/seed/seed.js': '',
  'src/app.js': '',
  'server.js': '',
  '.env': '',
  '.env.example': '',
  'README.md': ''
};

const baseDir = process.cwd();

dirs.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

for (const [file, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
  }
}

console.log('Scaffold complete.');
