import { type ReactNode, useEffect } from 'react';

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
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && cta && !cta.disabled) {
        e.preventDefault();
        cta.onClick();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cta]);

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 md:px-12 lg:px-20 xl:px-28">
        <div className="max-w-3xl mx-auto">
          {children}
        </div>
      </div>

      {/* Bottom-fixed CTA bar */}
      {(cta || secondaryCta) && (
        <div className="flex-shrink-0 border-t border-border bg-bg-primary/80 backdrop-blur-sm px-6 py-4 safe-bottom md:px-12 lg:px-20 xl:px-28">
          <div className="max-w-3xl mx-auto flex gap-3">
            {secondaryCta && (
              <button
                onClick={secondaryCta.onClick}
                className="flex-1 px-5 py-3 bg-bg-card text-text-primary border border-border rounded-lg text-[14px] lg:text-[16px] font-medium hover:border-border-strong active:scale-[0.98] transition-all"
              >
                {secondaryCta.label}
              </button>
            )}
            {cta && (
              <button
                onClick={cta.onClick}
                disabled={cta.disabled}
                className="flex-1 px-5 py-3 bg-purple text-white rounded-lg text-[14px] lg:text-[16px] font-semibold transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
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
