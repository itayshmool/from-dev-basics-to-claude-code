import type { ReactNode } from 'react';

interface CtaAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface LessonStepProps {
  children: ReactNode;
  cta?: CtaAction;
  secondaryCta?: CtaAction;
}

export function LessonStep({ children, cta, secondaryCta }: LessonStepProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 md:px-8">
        <div className="max-w-lg mx-auto">
          {children}
        </div>
      </div>

      {/* Bottom-fixed CTA bar */}
      {(cta || secondaryCta) && (
        <div className="flex-shrink-0 border-t border-border bg-bg-primary px-5 py-4 safe-bottom md:px-8">
          <div className="max-w-lg mx-auto flex gap-3">
            {secondaryCta && (
              <button
                onClick={secondaryCta.onClick}
                className="flex-1 px-5 py-3.5 bg-bg-card text-text-primary border border-border rounded-2xl text-[15px] font-semibold active:scale-[0.98] transition-all"
              >
                {secondaryCta.label}
              </button>
            )}
            {cta && (
              <button
                onClick={cta.onClick}
                disabled={cta.disabled}
                className="flex-1 px-5 py-3.5 bg-purple text-white rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={!cta.disabled ? { boxShadow: 'var(--shadow-button)' } : undefined}
              >
                {cta.label}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
