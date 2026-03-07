import { Link } from 'react-router-dom';
import { useOnboardingPlan } from '../../hooks/useOnboardingPlan';
import { LEVELS } from '../../lib/constants';

const PRIORITY_STYLES: Record<string, { label: string; cls: string }> = {
  high: { label: 'Priority', cls: 'text-purple bg-purple/10 border-purple/20' },
  medium: { label: 'Useful', cls: 'text-blue bg-blue/10 border-blue/20' },
  low: { label: 'Optional', cls: 'text-text-muted bg-bg-elevated border-border' },
  skip: { label: 'Skip', cls: 'text-text-muted/50 bg-bg-elevated/50 border-border line-through' },
};

export function DashboardPlan() {
  const { plan, data, loading, enabled } = useOnboardingPlan();

  if (loading) {
    return <p className="text-text-muted text-sm font-mono">Loading plan...</p>;
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-text-primary font-mono">My Learning Plan</h1>

        <div className="bg-bg-card rounded-xl border border-border p-6 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-3xl mb-3">🧭</p>
          <h2 className="text-sm font-mono font-semibold text-text-primary mb-1">
            No plan yet
          </h2>
          <p className="text-xs text-text-muted mb-4 max-w-sm mx-auto">
            {enabled
              ? 'Get a personalized learning plan based on your background and goals. AI will recommend the best path through the curriculum.'
              : 'The AI learning plan feature is currently unavailable. Check back later.'}
          </p>
          {enabled && (
            <Link
              to="/onboarding/ai"
              className="inline-block px-4 py-2 bg-purple text-white text-sm font-mono font-medium rounded-lg hover:bg-purple/90 transition-colors"
            >
              Create My Plan
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary font-mono">My Learning Plan</h1>
        {enabled && (
          <Link
            to="/onboarding/ai"
            className="text-xs font-mono text-purple hover:underline flex-shrink-0"
          >
            Update plan
          </Link>
        )}
      </div>

      {/* Summary */}
      <div className="bg-bg-card rounded-xl border border-purple/15 p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-sm text-text-primary leading-relaxed">{plan.summary}</p>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-[11px] text-text-muted font-mono">
            {plan.recommendedLessons.length} lessons recommended
          </span>
          {data?.updatedAt && (
            <span className="text-[11px] text-text-muted font-mono">
              Updated {new Date(data.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Level breakdown */}
      <div className="space-y-3">
        {LEVELS.map((level) => {
          const levelNote = plan.levelNotes.find((ln) => ln.levelId === level.id);
          if (!levelNote) return null;

          const style = PRIORITY_STYLES[levelNote.priority] || PRIORITY_STYLES.low;
          const recommendedCount = plan.recommendedLessons.filter((id) => {
            const num = parseFloat(id);
            if (level.id === 45) return id.startsWith('4b.');
            return Math.floor(num) === level.id;
          }).length;

          return (
            <div
              key={level.id}
              className={`bg-bg-card rounded-xl border border-border p-4 ${levelNote.priority === 'skip' ? 'opacity-50' : ''}`}
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-mono font-medium text-text-primary">
                  Level {level.displayNumber}: {level.title}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${style.cls}`}
                >
                  {style.label}
                </span>
                {recommendedCount > 0 && levelNote.priority !== 'skip' && (
                  <span className="text-[10px] font-mono text-text-muted">
                    {recommendedCount}/{level.lessonCount} lessons
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1">{levelNote.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
