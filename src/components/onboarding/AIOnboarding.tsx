import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import type { OnboardingPlan } from '../../hooks/useOnboardingPlan';
import { LEVELS } from '../../lib/constants';

const PRIORITY_STYLES: Record<string, { label: string; cls: string }> = {
  high: { label: 'Priority', cls: 'text-purple bg-purple/10 border-purple/20' },
  medium: { label: 'Useful', cls: 'text-blue bg-blue/10 border-blue/20' },
  low: { label: 'Optional', cls: 'text-text-muted bg-bg-elevated border-border' },
  skip: { label: 'Skip', cls: 'text-text-muted/50 bg-bg-elevated/50 border-border line-through' },
};

export function AIOnboarding() {
  const navigate = useNavigate();
  const [background, setBackground] = useState('');
  const [plan, setPlan] = useState<OnboardingPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [featureEnabled, setFeatureEnabled] = useState(true);

  // Load existing plan + check enabled on mount
  useEffect(() => {
    Promise.all([
      apiFetch('/api/onboarding/plan').then((r) => (r.ok ? r.json() : null)),
      apiFetch('/api/onboarding/enabled').then((r) => (r.ok ? r.json() : { enabled: false })),
    ])
      .then(([planData, enabledData]) => {
        setFeatureEnabled(enabledData?.enabled ?? false);
        if (planData?.plan) {
          setPlan(planData.plan);
          setBackground(planData.userPrompt || '');
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  async function handleGenerate() {
    if (background.trim().length < 10) {
      setError('Please write at least a few sentences about your background.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/onboarding/generate', {
        method: 'POST',
        body: JSON.stringify({ background: background.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="text-text-muted text-sm font-mono">Loading...</p>
      </div>
    );
  }

  if (!featureEnabled) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary px-4">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-lg font-mono font-semibold text-text-primary mb-2">
            AI Onboarding Unavailable
          </h1>
          <p className="text-sm text-text-muted mb-6">
            The AI-powered personalized learning plan is currently disabled. Please check back later.
          </p>
          <Link to="/" className="text-sm font-mono text-purple hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const recommendedSet = new Set(plan?.recommendedLessons ?? []);

  return (
    <div className="min-h-full bg-bg-primary">
      {/* Header */}
      <div className="border-b border-border bg-bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-mono font-semibold text-text-primary">
              Personalized Learning Plan
            </h1>
            <p className="text-[11px] text-text-muted">
              AI-powered path through the curriculum
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Input section */}
        <div className="bg-bg-card rounded-xl border border-border p-5 md:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-mono font-semibold text-text-primary mb-1">
            Tell us about yourself
          </h2>
          <p className="text-xs text-text-muted mb-4">
            Describe your background, role, technical experience, and what you hope to learn.
            The more detail you provide, the better your plan will be. you can add linkedin
            profile URL in the prompt as well for example
            "https://www.linkedin.com/in/itayshmool/" .
          </p>

          <textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder={'e.g., "I\'m a business operations manager, tech savvy but not a developer. I use ChatGPT daily but have never used a terminal or Claude Code. I want to automate parts of my workflow."'}
            className="w-full h-32 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-purple/40 resize-none font-sans"
            disabled={loading}
          />

          {error && (
            <p className="text-red text-xs mt-2">{error}</p>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleGenerate}
              disabled={loading || background.trim().length < 10}
              className="px-4 py-2 bg-purple text-white text-sm font-mono font-medium rounded-lg hover:bg-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </span>
              ) : plan ? (
                'Regenerate Plan'
              ) : (
                'Generate My Plan'
              )}
            </button>
            {plan && (
              <button
                onClick={() => navigate('/dashboard/plan')}
                className="px-4 py-2 text-sm font-mono text-text-muted hover:text-text-primary transition-colors"
              >
                View in Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Plan display */}
        {plan && (
          <>
            {/* Summary */}
            <div className="bg-bg-card rounded-xl border border-purple/15 p-5 md:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-sm text-text-primary leading-relaxed">{plan.summary}</p>
              <p className="text-[11px] text-text-muted mt-3 font-mono">
                {plan.recommendedLessons.length} lessons recommended for you
              </p>
            </div>

            {/* Level breakdown */}
            <div className="space-y-3">
              <h2 className="text-sm font-mono font-semibold text-text-primary">
                Your Level-by-Level Breakdown
              </h2>

              {LEVELS.map((level) => {
                const levelNote = plan.levelNotes.find((ln) => ln.levelId === level.id);
                if (!levelNote) return null;

                const priority = levelNote.priority;
                const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;
                const levelLessons = getLessonsForLevel(level.id);
                const recommended = levelLessons.filter((l) => recommendedSet.has(l.id));

                return (
                  <div
                    key={level.id}
                    className={`bg-bg-card rounded-xl border border-border p-4 md:p-5 ${priority === 'skip' ? 'opacity-50' : ''}`}
                    style={{ boxShadow: 'var(--shadow-card)' }}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-mono font-medium text-text-primary">
                            Level {level.displayNumber}: {level.title}
                          </h3>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${style.cls}`}
                          >
                            {style.label}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{levelNote.note}</p>
                      </div>
                    </div>

                    {recommended.length > 0 && priority !== 'skip' && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
                          Recommended lessons ({recommended.length}/{level.lessonCount})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {recommended.map((lesson) => (
                            <Link
                              key={lesson.id}
                              to={`/lesson/${lesson.id}`}
                              className="text-[11px] font-mono text-purple hover:text-purple/80 bg-purple/5 hover:bg-purple/10 px-2 py-1 rounded transition-colors"
                            >
                              {lesson.id} {lesson.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="text-center pb-8">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple text-white text-sm font-mono font-medium rounded-lg hover:bg-purple/90 transition-colors"
              >
                Start Learning
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Minimal lesson info for display (built from static data)
interface LessonInfo {
  id: string;
  title: string;
}

// We need a simple mapping from level ID to lesson IDs + titles
// This is imported from the static levels data
import { levels as levelData } from '../../data/levels';

function getLessonsForLevel(levelId: number): LessonInfo[] {
  const level = levelData.find((l) => l.id === levelId);
  if (!level) return [];
  return level.lessons.map((l) => ({ id: l.id, title: l.title }));
}
