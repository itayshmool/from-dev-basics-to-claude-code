import { useState, useMemo, useCallback, useRef } from 'react';
import type { MatchSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';
import { CelebrationOverlay } from '../lesson/CelebrationOverlay';

interface ClickMatchProps {
  section: MatchSection;
  onComplete: () => void;
}

const PAIR_COLORS = ['purple', 'teal', 'blue', 'orange', 'green'] as const;

export function ClickMatch({ section, onComplete }: ClickMatchProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  // Track matches by index into shuffledRight to handle duplicate right-side values
  const [matched, setMatched] = useState<Array<{ left: string; rightIdx: number }>>([]);
  const [wrongPair, setWrongPair] = useState<{ left: string; rightIdx: number } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const shuffledRight = useMemo(
    () => [...section.pairs.map((p) => p.right)].sort(() => Math.random() - 0.5),
    [section.pairs]
  );

  const matchedLefts = new Set(matched.map((m) => m.left));
  const matchedRightIdxs = new Set(matched.map((m) => m.rightIdx));
  const allMatched = matched.length === section.pairs.length;

  function getMatchColor(left: string) {
    const idx = matched.findIndex((m) => m.left === left);
    return PAIR_COLORS[idx % PAIR_COLORS.length];
  }

  function getMatchColorByRightIdx(rightIdx: number) {
    const idx = matched.findIndex((m) => m.rightIdx === rightIdx);
    return PAIR_COLORS[idx % PAIR_COLORS.length];
  }

  function handleLeftClick(left: string) {
    if (matchedLefts.has(left)) return;
    setSelectedLeft(left);
    setWrongPair(null);
    setStatusMessage(`Selected "${left}". Now choose a match on the right.`);
  }

  function handleRightClick(rightIdx: number) {
    if (matchedRightIdxs.has(rightIdx) || !selectedLeft) return;
    const rightValue = shuffledRight[rightIdx];
    const isCorrect = section.pairs.some((p) => p.left === selectedLeft && p.right === rightValue);
    if (isCorrect) {
      const newMatched = [...matched, { left: selectedLeft, rightIdx }];
      setMatched(newMatched);
      setSelectedLeft(null);
      setWrongPair(null);
      setStatusMessage(`Matched "${selectedLeft}" with "${rightValue}".`);
      if (newMatched.length === section.pairs.length) {
        setShowCelebration(true);
      }
    } else {
      setWrongPair({ left: selectedLeft, rightIdx });
      setStatusMessage(`"${selectedLeft}" and "${rightValue}" don't match. Try again.`);
      setTimeout(() => setWrongPair(null), 600);
      setSelectedLeft(null);
    }
  }

  const handleCelebrationDone = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // Keyboard navigation for left column
  function handleLeftKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const availableIndices = section.pairs.map((p, i) => (!matchedLefts.has(p.left) ? i : -1)).filter((i) => i >= 0);
      const currentPos = availableIndices.indexOf(index);
      const nextPos = e.key === 'ArrowDown'
        ? (currentPos + 1) % availableIndices.length
        : (currentPos - 1 + availableIndices.length) % availableIndices.length;
      leftRefs.current[availableIndices[nextPos]]?.focus();
    } else if (e.key === 'Tab' && !e.shiftKey && selectedLeft) {
      e.preventDefault();
      const firstAvailable = shuffledRight.findIndex((_, i) => !matchedRightIdxs.has(i));
      if (firstAvailable >= 0) rightRefs.current[firstAvailable]?.focus();
    }
  }

  // Keyboard navigation for right column
  function handleRightKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const availableIndices = shuffledRight.map((_, i) => (!matchedRightIdxs.has(i) ? i : -1)).filter((i) => i >= 0);
      const currentPos = availableIndices.indexOf(index);
      const nextPos = e.key === 'ArrowDown'
        ? (currentPos + 1) % availableIndices.length
        : (currentPos - 1 + availableIndices.length) % availableIndices.length;
      rightRefs.current[availableIndices[nextPos]]?.focus();
    }
  }

  const colorMap: Record<string, string> = {
    purple: 'bg-purple-soft border-purple/30 text-purple',
    teal: 'bg-teal-soft border-teal/30 text-teal',
    blue: 'bg-blue-soft border-blue/30 text-blue',
    orange: 'bg-orange-soft border-orange/30 text-orange',
    green: 'bg-green-soft border-green/30 text-green',
  };

  const cta = allMatched
    ? { label: 'Continue', onClick: onComplete }
    : undefined;

  return (
    <>
      {showCelebration && <CelebrationOverlay onDone={handleCelebrationDone} />}
      <LessonStep cta={cta}>
        <div className="space-y-5">
          <h3 id="match-instruction" className="text-xl font-bold text-text-primary leading-snug">
            {section.instruction}
          </h3>

          <p className="text-xs text-text-muted tabular-nums">{matched.length}/{section.pairs.length} matched</p>

          {/* Live region for screen reader announcements */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {statusMessage}
          </div>

          <div className="grid grid-cols-2 gap-2.5" role="group" aria-labelledby="match-instruction">
            <div className="space-y-2" role="listbox" aria-label="Items to match">
              {section.pairs.map(({ left }, i) => {
                const isMatched = matchedLefts.has(left);
                const isSelected = selectedLeft === left;
                const isWrong = wrongPair?.left === left;
                const color = isMatched ? getMatchColor(left) : '';

                return (
                  <button
                    key={left}
                    ref={(el) => { leftRefs.current[i] = el; }}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isMatched}
                    onClick={() => handleLeftClick(left)}
                    onKeyDown={(e) => handleLeftKeyDown(e, i)}
                    disabled={isMatched}
                    className={`
                      w-full text-left px-3.5 py-3 rounded-xl border-2 text-[15px] font-medium transition-all leading-snug active:scale-[0.98]
                      ${isMatched ? colorMap[color] : ''}
                      ${isSelected ? 'border-purple bg-purple-soft text-purple' : ''}
                      ${isWrong ? 'border-red bg-red-soft text-red animate-shake' : ''}
                      ${!isMatched && !isSelected && !isWrong ? 'border-border bg-bg-card text-text-primary' : ''}
                    `}
                  >
                    {left}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2" role="listbox" aria-label="Match targets">
              {shuffledRight.map((right, idx) => {
                const isMatched = matchedRightIdxs.has(idx);
                const isWrong = wrongPair?.rightIdx === idx;
                const color = isMatched ? getMatchColorByRightIdx(idx) : '';

                return (
                  <button
                    key={idx}
                    ref={(el) => { rightRefs.current[idx] = el; }}
                    role="option"
                    aria-selected={false}
                    aria-disabled={isMatched || !selectedLeft}
                    onClick={() => handleRightClick(idx)}
                    onKeyDown={(e) => handleRightKeyDown(e, idx)}
                    disabled={isMatched || !selectedLeft}
                    className={`
                      w-full text-left px-3.5 py-3 rounded-xl border-2 text-[15px] font-medium transition-all leading-snug active:scale-[0.98]
                      ${isMatched ? colorMap[color] : ''}
                      ${isWrong ? 'border-red bg-red-soft text-red animate-shake' : ''}
                      ${!isMatched && !isWrong && selectedLeft ? 'border-border bg-bg-card text-text-primary' : ''}
                      ${!isMatched && !isWrong && !selectedLeft ? 'border-transparent bg-bg-card text-text-muted' : ''}
                    `}
                  >
                    {right}
                  </button>
                );
              })}
            </div>
          </div>

          {allMatched && (
            <div className="bg-green-soft rounded-xl px-4 py-4 text-[15px] animate-pop-in">
              <p className="font-medium text-text-primary">All matched correctly!</p>
            </div>
          )}
        </div>
      </LessonStep>
    </>
  );
}
