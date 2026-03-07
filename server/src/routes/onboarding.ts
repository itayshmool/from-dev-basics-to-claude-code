import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { aiOnboardingPlans, aiOnboardingLog, siteSettings } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { generateOnboardingPlan } from '../lib/onboardingGenerator.js';

export const onboardingRouter = Router();

onboardingRouter.use(requireAuth);

const generateSchema = z.object({
  background: z.string().min(10).max(2000),
});

// POST /api/onboarding/generate — generate a personalized plan
onboardingRouter.post(
  '/generate',
  asyncHandler(async (req, res) => {
    // Check if feature is enabled
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'ai_onboarding_enabled'));

    if (!setting || setting.value !== true) {
      throw new AppError(503, 'AI onboarding is currently disabled');
    }

    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Please provide a background description (10-2000 characters)');
    }

    const userId = req.user!.userId;

    try {
      const { plan, inputTokens, outputTokens, model } = await generateOnboardingPlan(
        parsed.data.background,
        userId,
      );

      // Upsert plan (one per user)
      await db
        .insert(aiOnboardingPlans)
        .values({
          userId,
          userPrompt: parsed.data.background,
          plan,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: aiOnboardingPlans.userId,
          set: {
            userPrompt: parsed.data.background,
            plan,
            updatedAt: new Date(),
          },
        });

      // Log usage
      await db.insert(aiOnboardingLog).values({
        userId,
        prompt: parsed.data.background,
        response: JSON.stringify(plan),
        inputTokens,
        outputTokens,
        model,
      });

      res.json({ plan });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      if (message.includes('Rate limit')) throw new AppError(429, message);
      if (message.includes('not configured')) throw new AppError(503, message);
      throw new AppError(500, `AI generation failed: ${message}`);
    }
  }),
);

// GET /api/onboarding/plan — get the user's saved plan
onboardingRouter.get(
  '/plan',
  asyncHandler(async (req, res) => {
    const [row] = await db
      .select()
      .from(aiOnboardingPlans)
      .where(eq(aiOnboardingPlans.userId, req.user!.userId));

    if (!row) {
      res.json(null);
      return;
    }

    res.json({
      userPrompt: row.userPrompt,
      plan: row.plan,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }),
);

// GET /api/onboarding/enabled — check if feature is enabled
onboardingRouter.get(
  '/enabled',
  asyncHandler(async (_req, res) => {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'ai_onboarding_enabled'));

    res.json({ enabled: setting?.value === true });
  }),
);
