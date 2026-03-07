import { useState, useCallback, useRef, useEffect } from 'react';
import type { FillInBlankSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';
import { CelebrationOverlay } from '../lesson/CelebrationOverlay';
import { useFirstInteraction } from '../../hooks/useFirstInteraction';

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
  const { isFirst: showHint } = useFirstInteraction('fillInBlank');

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

  const hintId = 'fillinblank-hint';
  const feedbackId = 'fillinblank-feedback';

  return (
    <>
      {showCelebration && <CelebrationOverlay onDone={handleCelebrationDone} />}
      <LessonStep cta={cta} secondaryCta={secondaryCta}>
        <div className="space-y-5" role="form" aria-labelledby="fillinblank-prompt">
          <h3 id="fillinblank-prompt" className="text-xl font-bold text-text-primary leading-snug">
            {section.prompt}
          </h3>

          {showHint && (
            <p className="text-[13px] text-text-muted italic">
              Tip: Type your answer and press Enter or click Check.
            </p>
          )}

          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !submitted && value.trim() && checkAnswer()}
            disabled={canContinue}
            aria-label="Your answer"
            aria-describedby={[
              submitted ? feedbackId : '',
              submitted && !isCorrect && section.hintDetail ? hintId : '',
            ].filter(Boolean).join(' ') || undefined}
            className="w-full px-4 py-3.5 bg-bg-card border-2 border-border rounded-xl text-text-primary font-mono text-[15px] font-medium focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/15 transition-all placeholder:text-text-muted placeholder:font-sans placeholder:font-normal"
            placeholder="Type your answer..."
            autoFocus
          />

          {submitted && (
            <div id={feedbackId} ref={explanationRef} role="status" className={`rounded-xl px-4 py-4 text-[15px] animate-pop-in ${
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

          {submitted && !isCorrect && section.hintDetail && (
            <div id={hintId} className="bg-yellow-soft rounded-lg px-4 py-3 border border-yellow/10 animate-fade-in-up">
              <p className="text-[13px] text-text-secondary leading-relaxed">
                <span className="font-semibold text-yellow font-mono">hint:</span> {section.hintDetail}
              </p>
            </div>
          )}
        </div>
      </LessonStep>
    </>
  );
}
