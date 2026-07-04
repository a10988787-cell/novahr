import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const wellnessRouter: Router = Router();
wellnessRouter.use(authenticate);

// ---- GET /wellness/me ----

wellnessRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const latestScore = await prisma.wellnessScore.findFirst({
      where: { employeeId: req.user!.userId },
      orderBy: { computedAt: 'desc' },
    });

    if (!latestScore) {
      res.json({
        score: null,
        message: 'No wellness data available yet. It will be computed based on your attendance and leave patterns.',
      });
      return;
    }

    res.json({
      score: Number(latestScore.score),
      factors: latestScore.factorsJson,
      computedAt: latestScore.computedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /wellness/team-summary (Admin/HR/Manager) ----

wellnessRouter.get('/team-summary', authorize('ADMIN', 'HR', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Placeholder: Member D will implement the wellness scoring job
    res.json({
      message: 'Team wellness summary — to be implemented by AI/Innovation Lead.',
      data: [],
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /risk/attrition (Admin/HR) ----

wellnessRouter.get('/risk/attrition', authorize('ADMIN', 'HR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Placeholder: Member D will implement the attrition risk scoring
    res.json({
      message: 'Attrition risk shortlist — to be implemented by AI/Innovation Lead.',
      data: [],
    });
  } catch (err) {
    next(err);
  }
});
