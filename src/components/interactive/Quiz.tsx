import { useState, useCallback } from 'react';
import type { QuizSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';
import { CelebrationOverlay } from '../lesson/CelebrationOverlay';

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
          <h3 className="text-xl font-bold text-text-primary leading-snug">
            {section.question}
          </h3>

          <div className="space-y-2.5">
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
                  onClick={() => !submitted && setSelected(i)}
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
            <div className={`rounded-xl px-4 py-4 text-[15px] animate-pop-in ${
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
