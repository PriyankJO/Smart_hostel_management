import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Hostel Management API is running'
  });
});

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import canteenRoutes from './routes/canteenRoutes.js';
import messRoutes from './routes/messRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/canteen', canteenRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/attendance', attendanceRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
