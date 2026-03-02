import { useState, useMemo } from 'react';
import type { MatchSection } from '../../core/lesson/types';

interface ClickMatchProps {
  section: MatchSection;
  onComplete: () => void;
}

const PAIR_COLORS = ['purple', 'teal', 'blue', 'orange', 'green'] as const;

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
    purple: 'bg-purple-soft border-purple/30 text-purple',
    teal: 'bg-teal-soft border-teal/30 text-teal',
    blue: 'bg-blue-soft border-blue/30 text-blue',
    orange: 'bg-orange-soft border-orange/30 text-orange',
    green: 'bg-green-soft border-green/30 text-green',
  };

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="bg-bg-card rounded-xl p-4 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-purple mb-1">Match the pairs</p>
        <p className="text-sm text-text-secondary">{section.instruction}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="space-y-1.5">
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
                  w-full text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all leading-snug active:scale-[0.98]
                  ${isMatched ? colorMap[color] : ''}
                  ${isSelected ? 'border-purple bg-purple-soft text-purple ring-2 ring-purple/15' : ''}
                  ${isWrong ? 'border-red bg-red-soft text-red animate-shake' : ''}
                  ${!isMatched && !isSelected && !isWrong ? 'border-border bg-bg-card text-text-primary' : ''}
                `}
              >
                {left}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
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
                  w-full text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all leading-snug active:scale-[0.98]
                  ${isMatched ? colorMap[color] : ''}
                  ${isWrong ? 'border-red bg-red-soft text-red animate-shake' : ''}
                  ${!isMatched && !isWrong && selectedLeft ? 'border-border bg-bg-card text-text-primary' : ''}
                  ${!isMatched && !isWrong && !selectedLeft ? 'border-border bg-bg-card text-text-muted' : ''}
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
          <div className="bg-green-soft border border-green/15 rounded-xl px-4 py-3.5 text-sm">
            <p className="font-medium text-text-primary">All matched correctly!</p>
          </div>
          <button
            onClick={onComplete}
            className="w-full md:w-auto px-6 py-3 bg-purple text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Continue &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
