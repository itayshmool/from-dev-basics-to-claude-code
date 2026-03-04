import { useState, useEffect } from 'react';

interface CelebrationOverlayProps {
  onDone: () => void;
  message?: string;
}

export function CelebrationOverlay({ onDone, message = 'Correct!' }: CelebrationOverlayProps) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('out'), 600);
    const doneTimer = setTimeout(onDone, 900);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className={`flex flex-col items-center gap-3 ${phase === 'in' ? 'animate-celebration-in' : 'animate-celebration-out'}`}>
        <div className="w-20 h-20 rounded-full bg-green flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-2xl font-bold text-green">{message}</p>
      </div>
    </div>
  );
}
