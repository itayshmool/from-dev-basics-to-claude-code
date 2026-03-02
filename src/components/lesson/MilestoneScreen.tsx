import type { MilestoneInfo } from '../../core/lesson/types';

interface MilestoneScreenProps {
  milestone: MilestoneInfo;
  levelId: number;
  onContinue?: () => void;
}

export function MilestoneScreen({ milestone, levelId, onContinue }: MilestoneScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 md:py-16 px-5 max-w-md mx-auto animate-pop-in">
      <div className="w-20 h-20 rounded-2xl bg-sunshine-light flex items-center justify-center mb-6" style={{ boxShadow: '0 4px 16px rgba(246,197,66,0.2)' }}>
        <span className="text-4xl">&#127942;</span>
      </div>

      <h2 className="text-2xl font-bold text-text-primary mb-1">
        Level {levelId} Complete!
      </h2>
      <h3 className="text-sm font-semibold text-lavender mb-6">{milestone.title}</h3>

      <div className="text-left w-full bg-bg-card rounded-xl border border-border p-4 mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-mint mb-3">You now understand</p>
        <ul className="space-y-2.5">
          {milestone.summary.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm text-text-primary animate-slide-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="w-5 h-5 rounded-md bg-mint-light text-mint text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                &#10003;
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-sky-light rounded-xl px-4 py-3.5 border border-sky/15 w-full mb-6">
        <div className="flex items-start gap-2.5">
          <span className="text-base flex-shrink-0">&#128640;</span>
          <p className="text-sm text-text-secondary leading-relaxed text-left">
            <span className="font-semibold text-text-primary">Up next: </span>
            {milestone.nextLevelTeaser}
          </p>
        </div>
      </div>

      {onContinue && (
        <button
          onClick={onContinue}
          className="w-full max-w-xs px-6 py-3 bg-lavender text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all active:scale-[0.98]"
          style={{ boxShadow: 'var(--shadow-button)' }}
        >
          Continue &rarr;
        </button>
      )}
    </div>
  );
}
