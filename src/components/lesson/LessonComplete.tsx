interface LessonCompleteProps {
  message: string;
  onNext: () => void;
  hasNext: boolean;
}

export function LessonComplete({ message, onNext, hasNext }: LessonCompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-pop-in">
      <div className="w-20 h-20 rounded-3xl bg-mint-light flex items-center justify-center mb-6" style={{ boxShadow: '0 8px 32px rgba(126,198,153,0.3)' }}>
        <span className="text-4xl">&#127881;</span>
      </div>
      <h2 className="text-2xl font-extrabold text-text-primary mb-3">Lesson Complete!</h2>
      <p className="text-text-secondary max-w-md mb-8 leading-relaxed">{message}</p>
      {hasNext && (
        <button
          onClick={onNext}
          className="px-8 py-3 bg-lavender text-white rounded-xl font-bold text-base hover:brightness-110 transition-all active:scale-[0.97]"
          style={{ boxShadow: 'var(--shadow-button)' }}
        >
          Next Lesson &rarr;
        </button>
      )}
    </div>
  );
}
