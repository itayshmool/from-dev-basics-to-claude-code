import { useState, useMemo } from 'react';
import type { MatchSection } from '../../core/lesson/types';

interface ClickMatchProps {
  section: MatchSection;
  onComplete: () => void;
}

const PAIR_COLORS = ['coral', 'teal', 'lavender', 'sky', 'sunshine'] as const;

export function ClickMatch({ section, onComplete }: ClickMatchProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Array<{ left: string; right: string }>>([]);
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null);

  const shuffledRight = useMemo(
    () => [...section.pairs.map((p) => p.right)].sort(() => Math.random() - 0.5),
    [section.pairs]
  );

  const matchedLefts = new Set(matched.map((m) => m.left));
  const matchedRights = new Set(matched.map((m) => m.right));
  const allMatched = matched.length === section.pairs.length;

  function getMatchColor(left: string) {
    const idx = matched.findIndex((m) => m.left === left);
    return PAIR_COLORS[idx % PAIR_COLORS.length];
  }

  function getMatchColorByRight(right: string) {
    const idx = matched.findIndex((m) => m.right === right);
    return PAIR_COLORS[idx % PAIR_COLORS.length];
  }

  function handleLeftClick(left: string) {
    if (matchedLefts.has(left)) return;
    setSelectedLeft(left);
    setWrongPair(null);
  }

  function handleRightClick(right: string) {
    if (matchedRights.has(right) || !selectedLeft) return;
    const isCorrect = section.pairs.some((p) => p.left === selectedLeft && p.right === right);
    if (isCorrect) {
      setMatched([...matched, { left: selectedLeft, right }]);
      setSelectedLeft(null);
      setWrongPair(null);
    } else {
      setWrongPair({ left: selectedLeft, right });
      setTimeout(() => setWrongPair(null), 600);
      setSelectedLeft(null);
    }
  }

  const colorMap: Record<string, string> = {
    coral: 'bg-coral-light border-coral/40 text-coral',
    teal: 'bg-teal-light border-teal/40 text-teal',
    lavender: 'bg-lavender-light border-lavender/40 text-lavender',
    sky: 'bg-sky-light border-sky/40 text-sky',
    sunshine: 'bg-sunshine-light border-sunshine/40 text-text-primary',
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="bg-bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-lavender mb-1">Match the pairs</p>
        <p className="text-sm text-text-secondary">{section.instruction}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {section.pairs.map(({ left }) => {
            const isMatched = matchedLefts.has(left);
            const isSelected = selectedLeft === left;
            const isWrong = wrongPair?.left === left;
            const color = isMatched ? getMatchColor(left) : '';

            return (
              <button
                key={left}
                onClick={() => handleLeftClick(left)}
                disabled={isMatched}
                className={`
                  w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition-all
                  ${isMatched ? colorMap[color] : ''}
                  ${isSelected ? 'border-lavender bg-lavender-light text-lavender ring-2 ring-lavender/20' : ''}
                  ${isWrong ? 'border-coral bg-coral-light text-coral animate-shake' : ''}
                  ${!isMatched && !isSelected && !isWrong ? 'border-border bg-bg-card text-text-primary hover:border-lavender/40 cursor-pointer' : ''}
                `}
              >
                {left}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {shuffledRight.map((right) => {
            const isMatched = matchedRights.has(right);
            const isWrong = wrongPair?.right === right;
            const color = isMatched ? getMatchColorByRight(right) : '';

            return (
              <button
                key={right}
                onClick={() => handleRightClick(right)}
                disabled={isMatched || !selectedLeft}
                className={`
                  w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition-all
                  ${isMatched ? colorMap[color] : ''}
                  ${isWrong ? 'border-coral bg-coral-light text-coral animate-shake' : ''}
                  ${!isMatched && !isWrong && selectedLeft ? 'border-border bg-bg-card text-text-primary hover:border-lavender/40 cursor-pointer' : ''}
                  ${!isMatched && !isWrong && !selectedLeft ? 'border-border bg-bg-card text-text-muted cursor-default' : ''}
                `}
              >
                {right}
              </button>
            );
          })}
        </div>
      </div>

      {allMatched && (
        <div className="space-y-3 animate-pop-in">
          <div className="bg-mint-light border border-mint/20 rounded-2xl px-5 py-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">&#127881;</span>
              <span className="font-bold text-text-primary">All matched correctly! Great job!</span>
            </div>
          </div>
          <button
            onClick={onComplete}
            className="px-7 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Continue &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
