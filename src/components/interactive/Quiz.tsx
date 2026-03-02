import { useState } from 'react';
import type { QuizSection } from '../../core/lesson/types';

interface QuizProps {
  section: QuizSection;
  onComplete: () => void;
}

const OPTION_COLORS = [
  { bg: 'bg-coral-light', border: 'border-coral/30', activeBg: 'bg-coral-light', text: 'text-coral' },
  { bg: 'bg-teal-light', border: 'border-teal/30', activeBg: 'bg-teal-light', text: 'text-teal' },
  { bg: 'bg-lavender-light', border: 'border-lavender/30', activeBg: 'bg-lavender-light', text: 'text-lavender' },
  { bg: 'bg-sunshine-light', border: 'border-sunshine/30', activeBg: 'bg-sunshine-light', text: 'text-sunshine' },
];

const LABELS = ['A', 'B', 'C', 'D'];

export function Quiz({ section, onComplete }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const isCorrect = selected === section.correctIndex;

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
    setAttempts((a) => a + 1);
  }

  function handleTryAgain() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="bg-bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-lavender mb-1">Question</p>
        <p className="text-base font-bold text-text-primary leading-snug">
          {section.question}
        </p>
      </div>

      <div className="space-y-2.5">
        {section.options.map((option, i) => {
          const colors = OPTION_COLORS[i % OPTION_COLORS.length];
          const isSelected = selected === i;
          const showResult = submitted;
          const isThisCorrect = i === section.correctIndex;

          let style = `border ${colors.border} bg-bg-card hover:${colors.bg} cursor-pointer`;
          if (isSelected && !showResult) {
            style = `border-2 ${colors.border} ${colors.activeBg} cursor-pointer`;
          }
          if (showResult && isThisCorrect) {
            style = 'border-2 border-mint bg-mint-light';
          }
          if (showResult && isSelected && !isThisCorrect) {
            style = 'border-2 border-coral bg-coral-light animate-shake';
          }
          if (showResult && !isSelected && !isThisCorrect) {
            style = 'border border-border bg-bg-card opacity-50';
          }

          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              className={`w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all flex items-center gap-3 ${style}`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                showResult && isThisCorrect ? 'bg-mint text-white' :
                showResult && isSelected && !isThisCorrect ? 'bg-coral text-white' :
                isSelected ? `${colors.bg} ${colors.text}` :
                'bg-border/50 text-text-muted'
              }`}>
                {showResult && isThisCorrect ? '&#10003;' : showResult && isSelected && !isThisCorrect ? '&#10007;' : LABELS[i]}
              </span>
              <span className={`font-medium ${
                showResult && isThisCorrect ? 'text-mint' :
                showResult && isSelected && !isThisCorrect ? 'text-coral' :
                'text-text-primary'
              }`}>
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className={`rounded-2xl px-5 py-4 text-sm animate-pop-in ${
          isCorrect
            ? 'bg-mint-light border border-mint/20'
            : 'bg-coral-light border border-coral/20'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none flex-shrink-0">
              {isCorrect ? '\u{1F389}' : attempts >= 2 ? '\u{1F4A1}' : '\u{1F914}'}
            </span>
            <p className={isCorrect ? 'text-text-primary' : 'text-text-primary'}>
              {isCorrect
                ? section.explanation
                : attempts >= 2
                  ? `The correct answer is "${section.options[section.correctIndex]}". ${section.explanation}`
                  : 'Not quite — give it another try!'
              }
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className="px-7 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={selected !== null ? { boxShadow: 'var(--shadow-button)' } : undefined}
          >
            Check Answer
          </button>
        )}

        {submitted && !isCorrect && attempts < 2 && (
          <button
            onClick={handleTryAgain}
            className="px-7 py-2.5 bg-bg-card text-text-primary border-2 border-border rounded-xl text-sm font-bold hover:bg-border/20 transition-all active:scale-[0.97]"
          >
            Try Again
          </button>
        )}

        {submitted && (isCorrect || attempts >= 2) && (
          <button
            onClick={onComplete}
            className="px-7 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Continue &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
