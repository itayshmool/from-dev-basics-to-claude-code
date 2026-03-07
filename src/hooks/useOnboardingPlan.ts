import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export interface OnboardingPlan {
  summary: string;
  recommendedLessons: string[];
  levelNotes: {
    levelId: number;
    note: string;
    priority: 'high' | 'medium' | 'low' | 'skip';
  }[];
}

interface OnboardingPlanData {
  userPrompt: string;
  plan: OnboardingPlan;
  createdAt: string;
  updatedAt: string;
}

export function useOnboardingPlan() {
  const { user } = useAuth();
  const [data, setData] = useState<OnboardingPlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (import.meta.env.VITE_USE_API !== 'true') return;

    let cancelled = false;
    setLoading(true);

    Promise.all([
      apiFetch('/api/onboarding/plan').then(r => (r.ok ? r.json() : null)),
      apiFetch('/api/onboarding/enabled').then(r => (r.ok ? r.json() : { enabled: false })),
    ])
      .then(([planData, enabledData]) => {
        if (cancelled) return;
        if (planData) setData(planData);
        setEnabled(enabledData?.enabled ?? false);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const plan = data?.plan ?? null;
  const recommendedLessons = new Set(plan?.recommendedLessons ?? []);

  return { plan, data, loading, enabled, recommendedLessons };
}
