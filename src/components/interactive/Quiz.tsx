import { useState, useCallback, useRef, useEffect } from 'react';
import type { QuizSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';
import { CelebrationOverlay } from '../lesson/CelebrationOverlay';
import { useFirstInteraction } from '../../hooks/useFirstInteraction';

interface QuizProps {
  section: QuizSection;
  onComplete: () => void;
}

const LABELS = ['A', 'B', 'C', 'D'];

export function Quiz({ section, onComplete }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const explanationRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { isFirst: showHint } = useFirstInteraction('quiz');

  const isCorrect = selected === section.correctIndex;
  const canContinue = submitted && (isCorrect || attempts >= 2);

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
    setAttempts((a) => a + 1);
    if (selected === section.correctIndex) {
      setShowCelebration(true);
    }
  }

  function handleTryAgain() {
    setSelected(null);
    setSubmitted(false);
  }

  const handleCelebrationDone = useCallback(() => {
    setShowCelebration(false);
  }, []);

  useEffect(() => {
    if (submitted) {
      setTimeout(() => explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }, [submitted]);

  // Keyboard navigation for options
  function handleOptionKeyDown(e: React.KeyboardEvent, index: number) {
    if (submitted) return;
    const count = section.options.length;
    let nextIndex = index;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (index + 1) % count;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (index - 1 + count) % count;
    } else if (e.key === ' ') {
      e.preventDefault();
      setSelected(index);
      return;
    } else {
      return;
    }

    setFocusedIndex(nextIndex);
    setSelected(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }

  // Number key shortcuts (1-4)
  useEffect(() => {
    if (submitted) return;
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= section.options.length) {
        const idx = num - 1;
        setSelected(idx);
        setFocusedIndex(idx);
        optionRefs.current[idx]?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitted, section.options.length]);

  const cta = canContinue
    ? { label: 'Continue', onClick: onComplete }
    : !submitted
      ? { label: 'Check Answer', onClick: handleSubmit, disabled: selected === null }
      : undefined;

  const secondaryCta = submitted && !isCorrect && attempts < 2
    ? { label: 'Try Again', onClick: handleTryAgain }
    : undefined;

  return (
    <>
      {showCelebration && <CelebrationOverlay onDone={handleCelebrationDone} />}
      <LessonStep cta={cta} secondaryCta={secondaryCta}>
        <div className="space-y-5">
          <h3 id="quiz-question" className="text-xl font-bold text-text-primary leading-snug">
            {section.question}
          </h3>

          {showHint && (
            <p className="text-[13px] text-text-muted italic" aria-live="polite">
              Tip: Select an answer, then press Check Answer. Use arrow keys or number keys to navigate.
            </p>
          )}

          <div className="space-y-2.5" role="radiogroup" aria-labelledby="quiz-question">
            {section.options.map((option, i) => {
              const isSelected = selected === i;
              const showResult = submitted;
              const isThisCorrect = i === section.correctIndex;

              let style = 'border-2 border-border bg-bg-card';
              if (isSelected && !showResult) style = 'border-2 border-purple bg-purple-soft';
              if (showResult && isThisCorrect) style = 'border-2 border-green bg-green-soft';
              if (showResult && isSelected && !isThisCorrect) style = 'border-2 border-red bg-red-soft animate-shake';
              if (showResult && !isSelected && !isThisCorrect) style = 'border-2 border-transparent bg-bg-card opacity-40';

              return (
                <button
                  key={i}
                  ref={(el) => { optionRefs.current[i] = el; }}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={i === focusedIndex ? 0 : -1}
                  onClick={() => !submitted && setSelected(i)}
                  onKeyDown={(e) => handleOptionKeyDown(e, i)}
                  disabled={submitted}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-[15px] transition-all flex items-center gap-3.5 active:scale-[0.98] ${style}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    showResult && isThisCorrect ? 'bg-green text-white' :
                    showResult && isSelected && !isThisCorrect ? 'bg-red text-white' :
                    isSelected ? 'bg-purple text-white' :
                    'bg-bg-elevated text-text-muted'
                  }`}>
                    {showResult && isThisCorrect ? '\u2713' : showResult && isSelected && !isThisCorrect ? '\u2717' : LABELS[i]}
                  </span>
                  <span className={`font-medium leading-snug ${
                    showResult && isThisCorrect ? 'text-green' :
                    showResult && isSelected && !isThisCorrect ? 'text-red' :
                    'text-text-primary'
                  }`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {submitted && (
            <div ref={explanationRef} className={`rounded-xl px-4 py-4 text-[15px] animate-pop-in ${
              isCorrect ? 'bg-green-soft' : 'bg-red-soft'
            }`}>
              <p className="text-text-primary leading-relaxed">
                {isCorrect
                  ? section.explanation
                  : attempts >= 2
                    ? `The correct answer is "${section.options[section.correctIndex]}". ${section.explanation}`
                    : 'Not quite \u2014 give it another try!'
                }
              </p>
            </div>
          )}
        </div>
      </LessonStep>
    </>
  );
}
