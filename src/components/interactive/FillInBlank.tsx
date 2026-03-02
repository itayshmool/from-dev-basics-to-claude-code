import { useState } from 'react';
import type { FillInBlankSection } from '../../core/lesson/types';

interface FillInBlankProps {
  section: FillInBlankSection;
  onComplete: () => void;
}

export function FillInBlank({ section, onComplete }: FillInBlankProps) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);

  function checkAnswer() {
    const normalize = (s: string) => section.caseSensitive ? s.trim() : s.trim().toLowerCase();
    const input = normalize(value);
    const correct = normalize(section.answer);
    const alternates = (section.acceptAlternates || []).map(normalize);

    const result = input === correct || alternates.includes(input);
    setIsCorrect(result);
    setSubmitted(true);
    setAttempts((a) => a + 1);
  }

  function handleTryAgain() {
    setValue('');
    setSubmitted(false);
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="bg-bg-card rounded-xl p-4 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-lavender mb-1">Fill in the blank</p>
        <p className="text-[15px] font-semibold text-text-primary leading-snug">
          {section.prompt}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !submitted && value.trim() && checkAnswer()}
          disabled={submitted && (isCorrect || attempts >= 2)}
          className="flex-1 px-4 py-3 bg-bg-card border border-border rounded-xl text-text-primary font-mono text-sm font-medium focus:outline-none focus:border-lavender focus:ring-2 focus:ring-lavender/15 transition-all placeholder:text-text-muted placeholder:font-normal"
          placeholder="Type your answer..."
          autoFocus
        />
        {!submitted && (
          <button
            onClick={checkAnswer}
            disabled={!value.trim()}
            className="px-6 py-3 bg-lavender text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={value.trim() ? { boxShadow: 'var(--shadow-button)' } : undefined}
          >
            Check
          </button>
        )}
      </div>

      {submitted && (
        <div className={`rounded-xl px-4 py-3.5 text-sm animate-pop-in ${
          isCorrect ? 'bg-mint-light border border-mint/15' : 'bg-coral-light border border-coral/15'
        }`}>
          <p className="text-text-primary">
            {isCorrect
              ? 'Correct!'
              : attempts >= 2
                ? <>The answer is: <code className="px-1 py-0.5 bg-bg-card rounded font-mono font-medium text-lavender">{section.answer}</code></>
                : 'Not quite \u2014 try again!'
            }
          </p>
        </div>
      )}

      <div className="flex gap-2">
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
