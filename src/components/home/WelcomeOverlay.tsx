import { useState } from 'react';
import { ClaudeIcon } from '../icons/ClaudeIcon';

const ONBOARDING_KEY = 'onboarding-dismissed';

interface WelcomeOverlayProps {
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: '\u{1F4BB}',
    title: 'Interactive Lessons',
    description: 'Learn by doing. Each lesson walks you through commands step by step with quizzes and exercises.',
  },
  {
    icon: '\u{1F3AF}',
    title: 'Track Your Progress',
    description: 'Your progress is saved automatically. Pick up where you left off anytime.',
  },
  {
    icon: '\u{1F680}',
    title: '8 Levels, 102 Lessons',
    description: 'From basic navigation to building with AI tools. Go at your own pace.',
  },
];

export function useOnboardingSeen() {
  const seen = localStorage.getItem(ONBOARDING_KEY) === 'true';
  const markSeen = () => localStorage.setItem(ONBOARDING_KEY, 'true');
  return { seen, markSeen };
}

export function WelcomeOverlay({ onDismiss }: WelcomeOverlayProps) {
  const [step, setStep] = useState(0);

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onDismiss();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to From Zero to Claude Code"
    >
      <div className="bg-bg-card border border-border rounded-2xl max-w-md w-[90vw] p-6 md:p-8 animate-pop-in">
        {/* Header */}
        {step === 0 && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-soft border border-purple/20 flex items-center justify-center flex-shrink-0">
              <ClaudeIcon className="w-6 h-6 text-purple" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-text-primary">Welcome!</h2>
              <p className="text-xs text-text-muted">Let&apos;s get you started</p>
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="text-center py-4" key={step}>
          <div className="text-4xl mb-4">{STEPS[step].icon}</div>
          <h3 className="text-lg font-bold text-text-primary mb-2">{STEPS[step].title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{STEPS[step].description}</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-purple' : 'w-1.5 bg-bg-elevated'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {step < STEPS.length - 1 && (
            <button
              onClick={onDismiss}
              className="flex-1 px-4 py-3 text-sm font-mono text-text-muted hover:text-text-primary transition-colors rounded-xl"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 bg-purple text-white rounded-xl text-sm font-semibold font-mono transition-all active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            {step < STEPS.length - 1 ? 'Next' : "Let's Go!"}
          </button>
        </div>
      </div>
    </div>
  );
}
