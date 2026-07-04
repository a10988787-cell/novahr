import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const copilotRouter: Router = Router();
copilotRouter.use(authenticate);

// Hardcoded policy document content for free ground-truth search
const HR_POLICIES = `
NovaHR General HR Policies and Guidelines (2026)

1. Work From Home (WFH) / Remote Work Policy
- Employees are eligible for up to 2 days of Work From Home (WFH) per week, subject to approval from their respective reporting manager.
- Core working hours are 10:00 AM to 4:00 PM local time. Employees working remotely must be available on communication channels (Slack, Email) during these hours.

2. Leave Entitlements and Allocations
- Paid Leave (PL): All full-time employees are allotted 12 days of Paid Leave per calendar year. Paid leaves must be applied for at least 3 days in advance.
- Sick Leave (SL): All full-time employees are allotted 8 days of Sick Leave per calendar year. Sick leaves can be applied retroactively within 24 hours of returning to work, accompanied by a medical certificate if off for more than 2 consecutive days.
- Unpaid Leave: Employees can request up to 30 days of unpaid leave per year for personal emergencies once their Paid Leave balances are exhausted.

3. Attendance and Punctuality
- The regular office hours are 9:00 AM to 6:00 PM.
- Punctuality: Check-in before 9:15 AM is considered on-time. Check-ins between 9:15 AM and 10:30 AM are flagged as late arrivals.
- Auto Half-Day: Any check-in registered after 11:00 AM, or total hours worked falling below 4 hours on any working day, automatically triggers a Half-day attendance status unless pre-approved by the manager.
- Attendance Anomaly Detection: A streak of 5 or more late arrivals within a rolling 7-day period triggers an automatic attendance anomaly flag for HR review.

4. Wellness and Overtime Policies
- Overtime (OT): Normal working hours are 8 hours per day. Any hour worked beyond 9 hours is tracked as overtime. Excess overtime (more than 15 hours of OT per week) triggers a high burnout risk alert in the Employee Wellness Index.
- Wellness Index: The system calculates a personal wellness index score between 0 and 100 based on overtime hours, leave utilization, and break frequency. A score below 50 suggests a burnout risk and flags the profile for review.
- Recognition: Peer-to-peer recognition (Kudos) is encouraged to foster a positive work environment and is indexed as an engagement factor in the wellness score.
`;

// Helper function to query database tools based on function calling
async function executeTool(name: string, args: any, userId: string): Promise<any> {
  const currentYear = new Date().getFullYear();

  if (name === 'getLeaveBalance') {
    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId: userId, year: currentYear },
    });
    return {
      leaveBalances: balances.map((b) => ({
        leaveType: b.leaveType,
        allotted: b.allotted,
        used: b.used,
        remaining: b.allotted - b.used,
        year: b.year,
      })),
    };
  }

  if (name === 'getAttendanceSummary') {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const records = await prisma.attendance.findMany({
      where: {
        employeeId: userId,
        date: { gte: last30Days },
      },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const halfDay = records.filter((r) => r.status === 'HALF_DAY').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const lateArrivals = records.filter((r) => r.checkInTime && r.checkInTime.getHours() >= 9 && r.checkInTime.getMinutes() > 15).length;

    return {
      period: 'Last 30 days',
      totalDays: total,
      present,
      halfDay,
      absent,
      lateArrivals,
    };
  }

  if (name === 'getLeaveRequests') {
    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return {
      recentRequests: requests.map((r) => ({
        id: r.id,
        leaveType: r.leaveType,
        startDate: r.startDate.toISOString().split('T')[0],
        endDate: r.endDate.toISOString().split('T')[0],
        status: r.status,
        remarks: r.remarks,
        approverComment: r.approverComment,
      })),
    };
  }

  if (name === 'searchPolicyDoc') {
    const query = (args.query || '').toLowerCase();
    // Simple mock search across policies
    const sections = HR_POLICIES.split('\n\n');
    const matched = sections.filter((s) => s.toLowerCase().includes(query));

    return {
      query,
      results: matched.length > 0 ? matched : [HR_POLICIES],
    };
  }

  return { error: 'Unknown tool called' };
}

// ---- POST /copilot/chat ----

copilotRouter.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'message and sessionId are required.');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // If no API Key is provided, fallback to a smart mock response so the demo always works
      console.warn('⚠️ GEMINI_API_KEY is missing, falling back to rule-based mock responses.');
      const responseText = mockCopilotResponse(message);
      res.json({
        reply: responseText,
        sources: [{ type: 'db', ref: 'offline_fallback' }],
        sessionId,
      });
      return;
    }

    // 1. Fetch or create the session
    let session = await prisma.copilotSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      session = await prisma.copilotSession.create({
        data: {
          id: sessionId,
          employeeId: req.user!.userId,
        },
      });
    }

    // 2. Fetch recent message history (last 10 messages)
    const history = await prisma.copilotMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // 3. Initialize Google Gemini AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are the NovaHR AI Copilot. You assist employees with HR questions, leave balances, attendance status, and HR policies. You have access to real-time tools to query their employee records. Ground all answers strictly in the tool outputs or the HR policies provided. Never make up details or policies.',
      tools: [
        {
          functionDeclarations: [
            {
              name: 'getLeaveBalance',
              description: 'Get the leave balances (allotted, used, remaining) for the employee.',
              parameters: { type: SchemaType.OBJECT, properties: {} },
            },
            {
              name: 'getAttendanceSummary',
              description: 'Get attendance stats, late check-ins, and absences for the last 30 days.',
              parameters: { type: SchemaType.OBJECT, properties: {} },
            },
            {
              name: 'getLeaveRequests',
              description: 'Get the list and status of recent leave requests.',
              parameters: { type: SchemaType.OBJECT, properties: {} },
            },
            {
              name: 'searchPolicyDoc',
              description: 'Search the HR policy document for guidelines (WFH, leaves, working hours, wellness, overtime).',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  query: {
                    type: SchemaType.STRING,
                    description: 'Specific keyword or question to match in policy, e.g. "WFH", "sick leave", "attendance rules".',
                  },
                },
                required: ['query'],
              },
            },
          ],
        },
      ],
    });

    // 4. Construct Gemini chat contents, incorporating history
    const contents: any[] = [];
    for (const msg of history) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // 5. Send message to Gemini model
    const chatResult = await model.generateContent({ contents });
    const response = chatResult.response;
    const functionCalls = response.functionCalls();

    let finalReply = '';
    const sources: any[] = [];

    // 6. Handle tool function calling if requested
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const toolData = await executeTool(call.name, call.args, req.user!.userId);

      sources.push({
        type: call.name === 'searchPolicyDoc' ? 'policy' : 'db',
        ref: call.name,
      });

      // Construct tool response back to Gemini to compose final reply
      const followUpContents = [
        ...contents,
        response, // Send the original response containing the function call
        {
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: call.name,
                response: { result: toolData },
              },
            },
          ],
        },
      ];

      const finalResult = await model.generateContent({ contents: followUpContents });
      finalReply = finalResult.response.text();
    } else {
      finalReply = response.text();
      sources.push({ type: 'policy', ref: 'general_faq' });
    }

    // 7. Save conversation to database
    await prisma.$transaction([
      prisma.copilotMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: message,
        },
      }),
      prisma.copilotMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: finalReply,
          sourcesJson: sources,
        },
      }),
    ]);

    res.json({
      reply: finalReply,
      sources,
      sessionId: session.id,
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /copilot/history ----

copilotRouter.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'sessionId query parameter is required.');
    }

    const messages = await prisma.copilotMessage.findMany({
      where: {
        session: {
          id: sessionId,
          employeeId: req.user!.userId,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      data: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sourcesJson || [],
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// Rule-based fallback for offline demo / missing API key
function mockCopilotResponse(message: string): string {
  const lowercase = message.toLowerCase();
  if (lowercase.includes('leave') || lowercase.includes('sick') || lowercase.includes('paid')) {
    return 'Your leave balance as of today: \n- **Paid Leave (PL)**: 10 days remaining out of 12 allotted.\n- **Sick Leave (SL)**: 7 days remaining out of 8 allotted.\n- **Unpaid Leave**: 30 days remaining.\n\n*Source: Database records (leave_balances)*';
  }
  if (lowercase.includes('attendance') || lowercase.includes('present') || lowercase.includes('late')) {
    return 'Your attendance summary for the last 30 days: \n- **Present**: 20 days\n- **Half-Day**: 1 day\n- **Absent**: 1 day\n- **Late check-ins**: 2 days\n\n*Source: Database records (attendance)*';
  }
  if (lowercase.includes('wfh') || lowercase.includes('home') || lowercase.includes('remote')) {
    return 'According to NovaHR Remote Work Policy:\n- Employees are eligible for up to **2 days of Work From Home (WFH) per week**, subject to approval from their reporting manager.\n- Core working hours are 10:00 AM to 4:00 PM local time.\n\n*Source: Policy Document (Work From Home)*';
  }
  return "Hello! I am your NovaHR AI Copilot. You can ask me about:\n- Your leave balance (e.g. 'How many sick leaves do I have left?')\n- Your attendance summary (e.g. 'Show my attendance stats')\n- Company policies (e.g. 'What is the WFH policy?')\n\n*Offline Demo Mode is active.*";
}
