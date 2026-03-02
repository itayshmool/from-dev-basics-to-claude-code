import type { MilestoneInfo } from '../../core/lesson/types';

interface MilestoneScreenProps {
  milestone: MilestoneInfo;
  levelId: number;
  onContinue?: () => void;
}

export function MilestoneScreen({ milestone, levelId, onContinue }: MilestoneScreenProps) {
  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <div className="flex-1 overflow-y-auto px-5 py-8 md:px-8">
        <div className="max-w-md mx-auto flex flex-col items-center text-center animate-pop-in">
          <div className="w-24 h-24 rounded-full bg-yellow-soft flex items-center justify-center mb-6">
            <span className="text-5xl">&#127942;</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">
            Level {levelId} Complete!
          </h2>
          <h3 className="text-[15px] font-semibold text-purple mb-8">{milestone.title}</h3>

          <div className="text-left w-full bg-bg-card rounded-xl border border-border p-5 mb-6">
            <p className="text-xs font-semibold text-green mb-4">You now understand</p>
            <ul className="space-y-3">
              {milestone.summary.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[15px] text-text-secondary animate-slide-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="w-6 h-6 rounded-lg bg-green-soft text-green text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    &#10003;
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-soft rounded-xl px-4 py-4 w-full text-left">
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">&#128640;</span>
              <p className="text-[15px] text-text-secondary leading-relaxed">
                <span className="font-semibold text-text-primary">Up next: </span>
                {milestone.nextLevelTeaser}
              </p>
            </div>
          </div>
        </div>
      </div>

      {onContinue && (
        <div className="flex-shrink-0 px-5 py-4 safe-bottom md:px-8">
          <div className="max-w-lg mx-auto">
            <button
              onClick={onContinue}
              className="w-full px-5 py-3.5 bg-purple text-white rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98]"
              style={{ boxShadow: 'var(--shadow-button)' }}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
