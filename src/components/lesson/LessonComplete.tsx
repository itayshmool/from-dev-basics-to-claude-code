interface LessonCompleteProps {
  message: string;
  onNext: () => void;
  hasNext: boolean;
}

export function LessonComplete({ message, onNext, hasNext }: LessonCompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 md:py-16 px-6 animate-pop-in">
      <div className="w-16 h-16 rounded-2xl bg-mint-light flex items-center justify-center mb-5" style={{ boxShadow: '0 4px 16px rgba(72,187,120,0.2)' }}>
        <span className="text-3xl">&#127881;</span>
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Lesson Complete!</h2>
      <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">{message}</p>
      {hasNext && (
        <button
          onClick={onNext}
          className="w-full max-w-xs px-6 py-3 bg-lavender text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all active:scale-[0.98]"
          style={{ boxShadow: 'var(--shadow-button)' }}
        >
          Next Lesson &rarr;
        </button>
      )}
    </div>
  );
}
