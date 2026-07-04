import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validators.js';

export const authRouter: Router = Router();

// ---- Helper: generate tokens ----

function generateAccessToken(payload: { userId: string; email: string; role: string; sessionId: string }): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new AppError(500, 'CONFIG_ERROR', 'JWT_ACCESS_SECRET not configured');
  return jwt.sign(payload, secret as jwt.Secret, { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any });
}

function generateRefreshToken(payload: { userId: string; sessionId: string }): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new AppError(500, 'CONFIG_ERROR', 'JWT_REFRESH_SECRET not configured');
  return jwt.sign(payload, secret as jwt.Secret, { expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any });
}

// ---- POST /auth/signup ----

authRouter.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = signupSchema.parse(req.body);

    // Check if email already exists
    const existing = await prisma.employee.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists.');
    }

    // Check if employee code already exists
    const existingCode = await prisma.employee.findUnique({ where: { employeeCode: data.employeeId } });
    if (existingCode) {
      throw new AppError(409, 'EMPLOYEE_ID_EXISTS', 'An account with this Employee ID already exists.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        employeeCode: data.employeeId,
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      },
    });

    // Create email verification token
    const verificationToken = uuidv4();
    await prisma.emailToken.create({
      data: {
        email: data.email,
        token: verificationToken,
        type: 'verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Initialize leave balances for current year
    const currentYear = new Date().getFullYear();
    await prisma.leaveBalance.createMany({
      data: [
        { employeeId: employee.id, leaveType: 'PAID', allotted: 12, used: 0, year: currentYear },
        { employeeId: employee.id, leaveType: 'SICK', allotted: 8, used: 0, year: currentYear },
        { employeeId: employee.id, leaveType: 'UNPAID', allotted: 30, used: 0, year: currentYear },
      ],
    });

    // TODO: Send verification email (Resend/SendGrid integration)
    console.log(`[EMAIL] Verification token for ${data.email}: ${verificationToken}`);

    res.status(201).json({
      message: 'Account created successfully. Please verify your email.',
      employeeId: employee.id,
      // In dev, return token for testing; remove in production
      ...(process.env.NODE_ENV === 'development' && { verificationToken }),
    });
  } catch (err) {
    next(err);
  }
});

// ---- POST /auth/verify-email ----

authRouter.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);

    const emailToken = await prisma.emailToken.findUnique({ where: { token } });
    if (!emailToken || emailToken.type !== 'verification') {
      throw new AppError(400, 'INVALID_TOKEN', 'Invalid or expired verification token.');
    }
    if (emailToken.used) {
      throw new AppError(400, 'TOKEN_USED', 'This verification token has already been used.');
    }
    if (emailToken.expiresAt < new Date()) {
      throw new AppError(400, 'TOKEN_EXPIRED', 'Verification token has expired. Please request a new one.');
    }

    // Mark email as verified
    await prisma.employee.update({
      where: { email: emailToken.email },
      data: { emailVerified: true },
    });

    // Mark token as used
    await prisma.emailToken.update({
      where: { id: emailToken.id },
      data: { used: true },
    });

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
});

// ---- POST /auth/login ----

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const employee = await prisma.employee.findUnique({ where: { email: data.email } });
    if (!employee) {
      // Don't leak whether the email exists
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    if (!employee.emailVerified) {
      throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email before logging in.');
    }

    const isValidPassword = await bcrypt.compare(data.password, employee.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // Create session
    const sessionId = uuidv4();
    const refreshToken = generateRefreshToken({ userId: employee.id, sessionId });

    await prisma.session.create({
      data: {
        id: sessionId,
        employeeId: employee.id,
        refreshToken,
        userAgent: (req.headers['user-agent'] as string) || null,
        ipAddress: (req.ip as string) || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Generate access token
    const accessToken = generateAccessToken({
      userId: employee.id,
      email: employee.email,
      role: employee.role,
      sessionId,
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth',
    });

    res.json({
      accessToken,
      user: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        departmentId: employee.departmentId,
        managerId: employee.managerId,
        phone: employee.phone,
        address: employee.address,
        photoUrl: employee.photoUrl,
        status: employee.status,
        createdAt: employee.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---- POST /auth/refresh ----

authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new AppError(401, 'NO_REFRESH_TOKEN', 'No refresh token provided.');
    }

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new AppError(500, 'CONFIG_ERROR', 'JWT_REFRESH_SECRET not configured');

    let decoded: { userId: string; sessionId: string };
    try {
      decoded = jwt.verify(refreshToken, secret) as { userId: string; sessionId: string };
    } catch {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
    }

    // Verify session exists and token matches
    const session = await prisma.session.findUnique({ where: { id: decoded.sessionId } });
    if (!session || session.refreshToken !== refreshToken) {
      throw new AppError(401, 'SESSION_INVALID', 'Session is invalid or has been revoked.');
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      throw new AppError(401, 'SESSION_EXPIRED', 'Session has expired. Please log in again.');
    }

    // Get employee
    const employee = await prisma.employee.findUnique({ where: { id: decoded.userId } });
    if (!employee) {
      throw new AppError(401, 'USER_NOT_FOUND', 'User no longer exists.');
    }

    // Issue new access token
    const accessToken = generateAccessToken({
      userId: employee.id,
      email: employee.email,
      role: employee.role,
      sessionId: decoded.sessionId,
    });

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

// ---- POST /auth/forgot-password ----

authRouter.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Always return success to prevent email enumeration
    const employee = await prisma.employee.findUnique({ where: { email } });

    if (employee) {
      const resetToken = uuidv4();
      await prisma.emailToken.create({
        data: {
          email,
          token: resetToken,
          type: 'password_reset',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
      });

      // TODO: Send password reset email
      console.log(`[EMAIL] Password reset token for ${email}: ${resetToken}`);
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In dev, return token for testing
      ...(process.env.NODE_ENV === 'development' && employee && {
        resetToken: (await prisma.emailToken.findFirst({
          where: { email, type: 'password_reset' },
          orderBy: { createdAt: 'desc' },
        }))?.token,
      }),
    });
  } catch (err) {
    next(err);
  }
});

// ---- POST /auth/reset-password ----

authRouter.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    const emailToken = await prisma.emailToken.findUnique({ where: { token } });
    if (!emailToken || emailToken.type !== 'password_reset') {
      throw new AppError(400, 'INVALID_TOKEN', 'Invalid or expired reset token.');
    }
    if (emailToken.used) {
      throw new AppError(400, 'TOKEN_USED', 'This reset token has already been used.');
    }
    if (emailToken.expiresAt < new Date()) {
      throw new AppError(400, 'TOKEN_EXPIRED', 'Reset token has expired. Please request a new one.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.employee.update({
      where: { email: emailToken.email },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.emailToken.update({
      where: { id: emailToken.id },
      data: { used: true },
    });

    // Revoke all sessions (force re-login after password change)
    const employee = await prisma.employee.findUnique({ where: { email: emailToken.email } });
    if (employee) {
      await prisma.session.deleteMany({ where: { employeeId: employee.id } });
    }

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    next(err);
  }
});

// ---- POST /auth/logout ----

authRouter.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Delete the current session
    if (req.user?.sessionId) {
      await prisma.session.delete({ where: { id: req.user.sessionId } }).catch(() => {});
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });

    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

// ---- GET /auth/sessions ----

authRouter.get('/sessions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { employeeId: req.user!.userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: sessions.map((s) => ({
        ...s,
        isCurrent: s.id === req.user!.sessionId,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /auth/sessions/:id ----

authRouter.delete('/sessions/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id as string } });
    if (!session || session.employeeId !== req.user!.userId) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found.');
    }

    await prisma.session.delete({ where: { id: req.params.id as string } });

    res.json({ message: 'Session revoked successfully.' });
  } catch (err) {
    next(err);
  }
});
