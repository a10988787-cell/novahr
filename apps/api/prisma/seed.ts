import { PrismaClient, Role, LeaveType, LeaveStatus, AttendanceStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.kudos.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.emailToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.copilotMessage.deleteMany();
  await prisma.copilotSession.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 1. Create Departments
  const deptEng = await prisma.department.create({ data: { name: 'Engineering' } });
  const deptHr = await prisma.department.create({ data: { name: 'Human Resources' } });
  const deptSales = await prisma.department.create({ data: { name: 'Sales' } });

  console.log('🏢 Created departments.');

  // Hash standard password for all seeded users
  const passwordHash = await bcrypt.hash('Password@123', 12);

  // 2. Create Managers & HR Admin
  const ritikLead = await prisma.employee.create({
    data: {
      employeeCode: 'EMP1001',
      name: 'Ritik Kalal',
      email: 'ritik@novahr.dev',
      passwordHash,
      role: Role.ADMIN,
      departmentId: deptHr.id,
      phone: '+919876543210',
      address: '123 Team Lead Lane, Udaipur, India',
      emailVerified: true,
      status: 'active',
    },
  });

  const engManager = await prisma.employee.create({
    data: {
      employeeCode: 'EMP1002',
      name: 'Arjun Sharma',
      email: 'arjun@novahr.dev',
      passwordHash,
      role: Role.MANAGER,
      departmentId: deptEng.id,
      phone: '+919876543211',
      address: '456 Dev Drive, Bangalore, India',
      emailVerified: true,
      status: 'active',
    },
  });

  const hrOfficer = await prisma.employee.create({
    data: {
      employeeCode: 'EMP1003',
      name: 'Priya Patel',
      email: 'priya@novahr.dev',
      passwordHash,
      role: Role.HR,
      departmentId: deptHr.id,
      phone: '+919876543212',
      address: '789 People Ops Way, Mumbai, India',
      emailVerified: true,
      status: 'active',
    },
  });

  const salesManager = await prisma.employee.create({
    data: {
      employeeCode: 'EMP1004',
      name: 'Vikram Singh',
      email: 'vikram@novahr.dev',
      passwordHash,
      role: Role.MANAGER,
      departmentId: deptSales.id,
      phone: '+919876543213',
      address: '101 Deal Court, Delhi, India',
      emailVerified: true,
      status: 'active',
    },
  });

  console.log('👤 Created leaders and managers.');

  // 3. Create Engineering Employees
  const engEmployeesData = [
    { name: 'Rahul Verma', email: 'rahul@novahr.dev', code: 'EMP1005' },
    { name: 'Sneha Reddy', email: 'sneha@novahr.dev', code: 'EMP1006' },
    { name: 'Amit Kumar', email: 'amit@novahr.dev', code: 'EMP1007' },
    { name: 'Divya Joshi', email: 'divya@novahr.dev', code: 'EMP1008' },
    { name: 'Karan Malhotra', email: 'karan@novahr.dev', code: 'EMP1009' },
    { name: 'Neha Gupta', email: 'neha@novahr.dev', code: 'EMP1010' },
  ];

  const engEmployees = [];
  for (const emp of engEmployeesData) {
    const created = await prisma.employee.create({
      data: {
        employeeCode: emp.code,
        name: emp.name,
        email: emp.email,
        passwordHash,
        role: Role.EMPLOYEE,
        departmentId: deptEng.id,
        managerId: engManager.id,
        emailVerified: true,
        status: 'active',
      },
    });
    engEmployees.push(created);
  }

  // 4. Create Sales Employees
  const salesEmployeesData = [
    { name: 'Rohan Mehra', email: 'rohan@novahr.dev', code: 'EMP1011' },
    { name: 'Anjali Desai', email: 'anjali@novahr.dev', code: 'EMP1012' },
    { name: 'Sanjay Dutt', email: 'sanjay@novahr.dev', code: 'EMP1013' },
    { name: 'Meera Sen', email: 'meera@novahr.dev', code: 'EMP1014' },
  ];

  const salesEmployees = [];
  for (const emp of salesEmployeesData) {
    const created = await prisma.employee.create({
      data: {
        employeeCode: emp.code,
        name: emp.name,
        email: emp.email,
        passwordHash,
        role: Role.EMPLOYEE,
        departmentId: deptSales.id,
        managerId: salesManager.id,
        emailVerified: true,
        status: 'active',
      },
    });
    salesEmployees.push(created);
  }

  const allEmployees = [ritikLead, engManager, hrOfficer, salesManager, ...engEmployees, ...salesEmployees];
  console.log(`👥 Created ${allEmployees.length} total employees.`);

  // 5. Create Leave Balances
  const currentYear = new Date().getFullYear();
  for (const emp of allEmployees) {
    await prisma.leaveBalance.createMany({
      data: [
        { employeeId: emp.id, leaveType: LeaveType.PAID, allotted: 12, used: 2, year: currentYear },
        { employeeId: emp.id, leaveType: LeaveType.SICK, allotted: 8, used: 1, year: currentYear },
        { employeeId: emp.id, leaveType: LeaveType.UNPAID, allotted: 30, used: 0, year: currentYear },
      ],
    });
  }
  console.log('📅 Allotted leave balances.');

  // 6. Create Attendance History (60 Days)
  console.log('⏰ Seeding attendance records (this may take a few seconds)...');
  const batchSize = 1000;
  let attendanceBatch = [];

  for (let i = 60; i >= 0; i--) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - i);
    currentDate.setHours(0, 0, 0, 0);

    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    for (const emp of allEmployees) {
      // Seed regular check-in/out
      let status = AttendanceStatus.PRESENT;
      let checkIn: Date | null = new Date(currentDate);
      let checkOut: Date | null = new Date(currentDate);

      // Random delay or absence patterns
      const rand = Math.random();

      // Check-in details
      if (rand < 0.05) {
        // Absent
        status = AttendanceStatus.ABSENT;
        checkIn = null;
        checkOut = null;
      } else if (rand < 0.12) {
        // Half-day
        status = AttendanceStatus.HALF_DAY;
        checkIn.setHours(9, 0, 0, 0); // 9:00 AM
        checkOut.setHours(13, 0, 0, 0); // 1:00 PM (4 hours worked)
      } else {
        // Present
        // Shift start is 9:00 AM. Regular check-ins are between 8:45 AM and 9:15 AM
        const checkInMin = rand < 0.18 ? 30 : -15; // some late arrivals
        checkIn.setHours(9, checkInMin + Math.floor(Math.random() * 20), 0, 0);
        checkOut.setHours(18, Math.floor(Math.random() * 30), 0, 0); // around 6:00 PM
      }

      // Add anomaly flags for some users to test detection
      let anomalyFlag = false;
      let anomalyReason: string | null = null;

      // Rahul Verma (EMP1005) has a late check-in streak in the last 7 days
      if (emp.employeeCode === 'EMP1005' && i <= 7) {
        anomalyFlag = true;
        anomalyReason = 'Late check-in streak: 5 late check-ins in the last 7 days.';
        if (checkIn) checkIn.setHours(10, 30 + Math.floor(Math.random() * 15), 0, 0);
      }

      // Sneha Reddy (EMP1006) has a geolocation mismatch flag
      if (emp.employeeCode === 'EMP1006' && i === 3) {
        anomalyFlag = true;
        anomalyReason = 'Geolocation mismatch: Check-in registered 25km outside geofence boundary.';
      }

      attendanceBatch.push({
        employeeId: emp.id,
        date: currentDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        status,
        geoFlag: emp.employeeCode === 'EMP1006' && i === 3,
        anomalyFlag,
        anomalyReason,
        reviewed: false,
      });

      if (attendanceBatch.length >= batchSize) {
        await prisma.attendance.createMany({ data: attendanceBatch });
        attendanceBatch = [];
      }
    }
  }

  if (attendanceBatch.length > 0) {
    await prisma.attendance.createMany({ data: attendanceBatch });
  }
  console.log('⏰ Seeded attendance records.');

  // 7. Create Leave Requests
  await prisma.leaveRequest.createMany({
    data: [
      {
        employeeId: engEmployees[0].id, // Rahul
        leaveType: LeaveType.PAID,
        startDate: new Date('2026-07-10'),
        endDate: new Date('2026-07-12'),
        remarks: 'Family trip',
        status: LeaveStatus.PENDING,
      },
      {
        employeeId: engEmployees[1].id, // Sneha
        leaveType: LeaveType.SICK,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-02'),
        remarks: 'Fever',
        status: LeaveStatus.APPROVED,
        approverId: engManager.id,
        approverComment: 'Get well soon!',
      },
      {
        employeeId: salesEmployees[0].id, // Rohan
        leaveType: LeaveType.UNPAID,
        startDate: new Date('2026-07-15'),
        endDate: new Date('2026-07-20'),
        remarks: 'Personal urgent work',
        status: LeaveStatus.PENDING,
      },
    ],
  });
  console.log('✉️ Seeded leave requests.');

  // 8. Create Kudos
  await prisma.kudos.createMany({
    data: [
      {
        fromEmployeeId: engEmployees[0].id,
        toEmployeeId: engEmployees[1].id,
        message: 'Thanks for helping with the DB migration!',
      },
      {
        fromEmployeeId: ritikLead.id,
        toEmployeeId: engManager.id,
        message: 'Excellent leadership in sprint delivery!',
      },
    ],
  });
  console.log('🎉 Seeded kudos.');

  // 9. Create Skills
  for (const emp of engEmployees) {
    await prisma.skill.createMany({
      data: [
        { employeeId: emp.id, skillName: 'React', proficiency: 'advanced' },
        { employeeId: emp.id, skillName: 'Node.js', proficiency: 'intermediate' },
        { employeeId: emp.id, skillName: 'PostgreSQL', proficiency: 'intermediate' },
      ],
    });
  }
  console.log('🛠️ Seeded skill tags.');

  // 10. Seed Wellness Scores
  for (const emp of allEmployees) {
    const isAtRisk = emp.employeeCode === 'EMP1005'; // Rahul (high attrition risk)
    const score = isAtRisk ? 42.50 : 85.00;
    await prisma.wellnessScore.create({
      data: {
        employeeId: emp.id,
        score,
        factorsJson: {
          overtimeHours: isAtRisk ? 28 : 5,
          leaveUtilization: isAtRisk ? 90 : 25,
          daysSinceLastBreak: isAtRisk ? 22 : 4,
          daysSinceLastKudos: isAtRisk ? 30 : 2,
        },
      },
    });
  }
  console.log('❤️ Seeded wellness scores.');

  console.log('🌟 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
