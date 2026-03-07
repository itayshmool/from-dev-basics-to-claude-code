import { useState, useEffect } from 'react';

interface LessonCompleteProps {
  message: string;
  onNext: () => void;
  onHome: () => void;
  hasNext: boolean;
}

function ConfettiParticle({ delay, left }: { delay: number; left: number }) {
  const colors = ['#FF6B35', '#22C55E', '#3B82F6', '#EAB308', '#14B8A6'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 6;

  return (
    <div
      className="absolute rounded-sm pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: `${left}%`,
        top: -10,
        opacity: 0,
        animation: `confetti-fall 1.5s ease-in ${delay}ms forwards`,
      }}
    />
  );
}

export function LessonComplete({ message, onNext, onHome, hasNext }: LessonCompleteProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col bg-bg-primary relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <ConfettiParticle
              key={i}
              delay={i * 60}
              left={5 + Math.random() * 90}
            />
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-pop-in">
        <div className="w-20 h-20 rounded-full bg-green-soft flex items-center justify-center mb-6">
          <span className="text-4xl">&#127881;</span>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Lesson Complete!</h2>
        <p className="text-[15px] text-text-secondary max-w-sm leading-relaxed">{message}</p>
      </div>

      <div className="flex-shrink-0 px-5 py-4 safe-bottom md:px-8 animate-fade-in-up" style={{ animationDelay: '800ms', animationFillMode: 'backwards' }}>
        <div className="max-w-lg mx-auto space-y-2.5">
          {hasNext && (
            <button
              onClick={onNext}
              className="w-full px-5 py-3.5 bg-purple text-white rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98]"
              style={{ boxShadow: 'var(--shadow-button)' }}
            >
              Next Lesson
            </button>
          )}
          <button
            onClick={onHome}
            className="w-full px-5 py-3.5 bg-bg-card text-text-secondary border border-border rounded-xl text-[15px] font-medium transition-all active:scale-[0.98]"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
