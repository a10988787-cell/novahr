import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes.js';
import { employeeRouter } from './routes/employee.routes.js';
import { attendanceRouter } from './routes/attendance.routes.js';
import { leaveRouter } from './routes/leave.routes.js';
import { payrollRouter } from './routes/payroll.routes.js';
import { wellnessRouter } from './routes/wellness.routes.js';
import { kudosRouter } from './routes/kudos.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { copilotRouter } from './routes/copilot.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8000;

// ---- Middleware ----
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ---- Health Check ----
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'novahr-api',
    timestamp: new Date().toISOString(),
  });
});

// ---- API Routes ----
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/employees', employeeRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/leave', leaveRouter);
app.use('/api/v1/payroll', payrollRouter);
app.use('/api/v1/wellness', wellnessRouter);
app.use('/api/v1/kudos', kudosRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/copilot', copilotRouter);

// ---- Error Handler (must be last) ----
app.use(errorHandler);

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`\n🚀 NovaHR API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/v1/health\n`);
});

export default app;
