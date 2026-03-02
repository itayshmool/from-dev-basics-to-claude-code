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
    <div className="space-y-4 animate-fade-in-up">
      <div className="bg-bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-lavender mb-1">Fill in the blank</p>
        <p className="text-base font-bold text-text-primary leading-snug">
          {section.prompt}
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !submitted && value.trim() && checkAnswer()}
          disabled={submitted && (isCorrect || attempts >= 2)}
          className="flex-1 px-5 py-3 bg-bg-card border-2 border-border rounded-xl text-text-primary font-mono text-sm font-bold focus:outline-none focus:border-lavender focus:ring-2 focus:ring-lavender/20 transition-all placeholder:text-text-muted placeholder:font-normal"
          placeholder="Type your answer..."
          autoFocus
        />
        {!submitted && (
          <button
            onClick={checkAnswer}
            disabled={!value.trim()}
            className="px-6 py-3 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={value.trim() ? { boxShadow: 'var(--shadow-button)' } : undefined}
          >
            Check
          </button>
        )}
      </div>

      {submitted && (
        <div className={`rounded-2xl px-5 py-4 text-sm animate-pop-in ${
          isCorrect ? 'bg-mint-light border border-mint/20' : 'bg-coral-light border border-coral/20'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none flex-shrink-0">
              {isCorrect ? '\u{2705}' : attempts >= 2 ? '\u{1F4A1}' : '\u{274C}'}
            </span>
            <p className="text-text-primary font-medium">
              {isCorrect
                ? 'Correct!'
                : attempts >= 2
                  ? <>The answer is: <code className="px-1.5 py-0.5 bg-bg-card rounded-md font-mono font-bold text-lavender">{section.answer}</code></>
                  : 'Not quite — try again!'
              }
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
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
