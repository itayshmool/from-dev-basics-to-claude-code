import type { MilestoneInfo } from '../../core/lesson/types';

interface MilestoneScreenProps {
  milestone: MilestoneInfo;
  levelId: number;
  onContinue?: () => void;
}

export function MilestoneScreen({ milestone, levelId, onContinue }: MilestoneScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 max-w-lg mx-auto animate-pop-in">
      <div className="w-24 h-24 rounded-3xl bg-sunshine-light flex items-center justify-center mb-8" style={{ boxShadow: '0 8px 32px rgba(250,208,0,0.3)' }}>
        <span className="text-5xl">&#127942;</span>
      </div>

      <h2 className="text-3xl font-extrabold text-text-primary mb-2">
        Level {levelId} Complete!
      </h2>
      <h3 className="text-lg font-bold text-lavender mb-8">{milestone.title}</h3>

      <div className="text-left w-full bg-bg-card rounded-2xl border border-border p-6 mb-8" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-mint mb-4">You now understand</p>
        <ul className="space-y-3">
          {milestone.summary.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-text-primary animate-slide-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="w-6 h-6 rounded-lg bg-mint-light text-mint text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                &#10003;
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-sky-light rounded-2xl px-5 py-4 border border-sky/20 w-full mb-8">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">&#128640;</span>
          <p className="text-sm text-text-secondary leading-relaxed text-left">
            <span className="font-bold text-text-primary">Up next: </span>
            {milestone.nextLevelTeaser}
          </p>
        </div>
      </div>

      {onContinue && (
        <button
          onClick={onContinue}
          className="px-8 py-3 bg-lavender text-white rounded-xl font-bold text-base hover:brightness-110 transition-all active:scale-[0.97]"
          style={{ boxShadow: 'var(--shadow-button)' }}
        >
          Continue &rarr;
        </button>
      )}
    </div>
  );
}
