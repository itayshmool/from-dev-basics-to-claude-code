import { useState } from 'react';
import type { QuizSection } from '../../core/lesson/types';

interface QuizProps {
  section: QuizSection;
  onComplete: () => void;
}

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
    <div className="space-y-3 animate-fade-in-up">
      <div className="bg-bg-card rounded-xl p-4 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-lavender mb-1">Question</p>
        <p className="text-[15px] font-semibold text-text-primary leading-snug">
          {section.question}
        </p>
      </div>

      <div className="space-y-2">
        {section.options.map((option, i) => {
          const isSelected = selected === i;
          const showResult = submitted;
          const isThisCorrect = i === section.correctIndex;

          let style = 'border border-border bg-bg-card';
          if (isSelected && !showResult) style = 'border-2 border-lavender bg-lavender-light';
          if (showResult && isThisCorrect) style = 'border-2 border-mint bg-mint-light';
          if (showResult && isSelected && !isThisCorrect) style = 'border-2 border-coral bg-coral-light animate-shake';
          if (showResult && !isSelected && !isThisCorrect) style = 'border border-border bg-bg-card opacity-40';

          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-sm transition-all flex items-center gap-3 active:scale-[0.98] ${style}`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                showResult && isThisCorrect ? 'bg-mint text-white' :
                showResult && isSelected && !isThisCorrect ? 'bg-coral text-white' :
                isSelected ? 'bg-lavender text-white' :
                'bg-bg-secondary text-text-muted'
              }`}>
                {showResult && isThisCorrect ? '\u2713' : showResult && isSelected && !isThisCorrect ? '\u2717' : LABELS[i]}
              </span>
              <span className={`font-medium leading-snug ${
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
        <div className={`rounded-xl px-4 py-3.5 text-sm animate-pop-in ${
          isCorrect ? 'bg-mint-light border border-mint/15' : 'bg-coral-light border border-coral/15'
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

      <div className="flex gap-2 pt-1">
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className="w-full md:w-auto px-6 py-3 bg-lavender text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={selected !== null ? { boxShadow: 'var(--shadow-button)' } : undefined}
          >
            Check Answer
          </button>
        )}

        {submitted && !isCorrect && attempts < 2 && (
          <button
            onClick={handleTryAgain}
            className="w-full md:w-auto px-6 py-3 bg-bg-card text-text-primary border border-border rounded-xl text-sm font-semibold active:scale-[0.98] transition-all"
          >
            Try Again
          </button>
        )}

        {submitted && (isCorrect || attempts >= 2) && (
          <button
            onClick={onComplete}
            className="w-full md:w-auto px-6 py-3 bg-lavender text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Continue &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
