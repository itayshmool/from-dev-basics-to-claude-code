import { useState, useCallback, useRef, useEffect } from 'react';
import type { FillInBlankSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';
import { CelebrationOverlay } from '../lesson/CelebrationOverlay';

interface FillInBlankProps {
  section: FillInBlankSection;
  onComplete: () => void;
}

export function FillInBlank({ section, onComplete }: FillInBlankProps) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const explanationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitted) {
      setTimeout(() => explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }, [submitted]);

  function checkAnswer() {
    const normalize = (s: string) => section.caseSensitive ? s.trim() : s.trim().toLowerCase();
    const input = normalize(value);
    const correct = normalize(section.answer);
    const alternates = (section.acceptAlternates || []).map(normalize);

    const result = input === correct || alternates.includes(input);
    setIsCorrect(result);
    setSubmitted(true);
    setAttempts((a) => a + 1);
    if (result) {
      setShowCelebration(true);
    }
  }

  function handleTryAgain() {
    setValue('');
    setSubmitted(false);
  }

  const handleCelebrationDone = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const canContinue = submitted && (isCorrect || attempts >= 2);

  const cta = canContinue
    ? { label: 'Continue', onClick: onComplete }
    : !submitted
      ? { label: 'Check', onClick: checkAnswer, disabled: !value.trim() }
      : undefined;

  const secondaryCta = submitted && !isCorrect && attempts < 2
    ? { label: 'Try Again', onClick: handleTryAgain }
    : undefined;

  return (
    <>
      {showCelebration && <CelebrationOverlay onDone={handleCelebrationDone} />}
      <LessonStep cta={cta} secondaryCta={secondaryCta}>
        <div className="space-y-5">
          <h3 className="text-xl font-bold text-text-primary leading-snug">
            {section.prompt}
          </h3>

          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !submitted && value.trim() && checkAnswer()}
            disabled={canContinue}
            className="w-full px-4 py-3.5 bg-bg-card border-2 border-border rounded-xl text-text-primary font-mono text-[15px] font-medium focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/15 transition-all placeholder:text-text-muted placeholder:font-sans placeholder:font-normal"
            placeholder="Type your answer..."
            autoFocus
          />

          {submitted && (
            <div ref={explanationRef} className={`rounded-xl px-4 py-4 text-[15px] animate-pop-in ${
              isCorrect ? 'bg-green-soft' : 'bg-red-soft'
            }`}>
              <p className="text-text-primary">
                {isCorrect
                  ? 'Correct!'
                  : attempts >= 2
                    ? <>The answer is: <code className="px-1.5 py-0.5 bg-bg-card rounded-md font-mono font-medium text-purple">{section.answer}</code></>
                    : 'Not quite \u2014 try again!'
                }
              </p>
            </div>
          )}
        </div>
      </LessonStep>
    </>
  );
}
