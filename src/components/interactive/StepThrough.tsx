import { useState, useEffect, useCallback } from 'react';
import type { StepThroughSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';
import { CelebrationOverlay } from '../lesson/CelebrationOverlay';

interface StepThroughProps {
  section: StepThroughSection;
  onComplete: () => void;
}

export function StepThrough({ section, onComplete }: StepThroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const totalSteps = section.steps.length;
  const step = section.steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const hasReachedEnd = maxReached >= totalSteps - 1;

  function handleNext() {
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (nextStep === totalSteps - 1 && maxReached < totalSteps - 1) {
        setShowCelebration(true);
      }
      setMaxReached(prev => Math.max(prev, nextStep));
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  // Keyboard navigation: arrow keys for prev/next
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentStep > 0) {
        setCurrentStep(prev => prev - 1);
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentStep < totalSteps - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        if (nextStep === totalSteps - 1 && maxReached < totalSteps - 1) {
          setShowCelebration(true);
        }
        setMaxReached(prev => Math.max(prev, nextStep));
      }
    }
  }, [currentStep, totalSteps, maxReached]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const cta = hasReachedEnd
    ? { label: 'Continue', onClick: onComplete }
    : undefined;

  return (
    <LessonStep cta={cta}>
      {showCelebration && (
        <CelebrationOverlay message="All steps complete!" onDone={() => setShowCelebration(false)} />
      )}
      <div className="space-y-5" role="region" aria-labelledby="stepthrough-instruction" aria-roledescription="step-by-step guide">
        {/* Instruction */}
        <h3 id="stepthrough-instruction" className="text-xl font-bold text-text-primary leading-snug">
          {section.instruction}
        </h3>

        {/* Step counter */}
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-text-secondary font-medium" aria-live="polite">
            Step {currentStep + 1} of {totalSteps}
          </span>

          {/* Progress dots */}
          <div className="flex items-center gap-0">
            {section.steps.map((_, i) => (
              <button
                key={i}
                onClick={() => i <= maxReached && setCurrentStep(i)}
                disabled={i > maxReached}
                aria-label={`Go to step ${i + 1}${i === currentStep ? ' (current)' : ''}`}
                className="min-w-[28px] min-h-[28px] flex items-center justify-center"
              >
                <span className={`
                  block w-2 h-2 rounded-full transition-all
                  ${i === currentStep
                    ? 'bg-purple w-5'
                    : i <= maxReached
                      ? 'bg-purple/40 hover:bg-purple/60 cursor-pointer'
                      : 'bg-border cursor-not-allowed'
                  }
                `} />
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-purple rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step card */}
        <div
          key={currentStep}
          className="animate-fade-in-up bg-bg-card rounded-xl border border-purple/20 overflow-hidden"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {/* Step number badge + title */}
          <div className="flex items-start gap-3 px-5 pt-5 pb-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple/10 text-purple flex items-center justify-center text-[14px] font-bold font-mono">
              {currentStep + 1}
            </span>
            <h4 className="text-[17px] font-bold font-mono text-text-primary leading-snug pt-0.5">
              {step.title}
            </h4>
          </div>

          {/* Step description */}
          <div className="px-5 pb-5 pl-16">
            <p className="text-[15px] text-text-secondary leading-relaxed">
              {step.description}
            </p>

            {/* Highlight callout (optional) */}
            {step.highlight && (
              <div className="mt-3 bg-purple-soft rounded-lg px-3.5 py-2.5 border border-purple/10">
                <code className="text-[14px] font-mono text-purple">
                  {step.highlight}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[14px] font-medium transition-all active:scale-[0.98]
              ${currentStep === 0
                ? 'bg-bg-card text-text-muted border border-border cursor-not-allowed opacity-40'
                : 'bg-bg-card text-text-primary border border-border hover:border-border-strong hover:bg-bg-elevated'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={isLastStep}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[14px] font-medium transition-all active:scale-[0.98]
              ${isLastStep
                ? 'bg-bg-card text-text-muted border border-border cursor-not-allowed opacity-40'
                : 'bg-purple/10 text-purple border border-purple/20 hover:bg-purple/15 hover:border-purple/30'
              }
            `}
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Completion note when last step reached */}
        {hasReachedEnd && (
          <div className="bg-green-soft rounded-xl px-4 py-3 animate-pop-in">
            <p className="text-[14px] text-green font-medium">
              All steps reviewed! Continue when you're ready.
            </p>
          </div>
        )}
      </div>
    </LessonStep>
  );
}
