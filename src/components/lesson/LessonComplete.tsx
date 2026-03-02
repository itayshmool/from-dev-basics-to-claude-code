interface LessonCompleteProps {
  message: string;
  onNext: () => void;
  onHome: () => void;
  hasNext: boolean;
}

export function LessonComplete({ message, onNext, onHome, hasNext }: LessonCompleteProps) {
  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-pop-in">
        <div className="w-20 h-20 rounded-full bg-green-soft flex items-center justify-center mb-6">
          <span className="text-4xl">&#127881;</span>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Lesson Complete!</h2>
        <p className="text-[15px] text-text-secondary max-w-sm leading-relaxed">{message}</p>
      </div>

      <div className="flex-shrink-0 px-5 py-4 safe-bottom md:px-8">
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
