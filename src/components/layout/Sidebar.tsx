import { levels } from '../../data/levels';
import { useProgress } from '../../hooks/useProgress';

interface SidebarProps {
  currentLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}

export function Sidebar({ currentLessonId, onSelectLesson }: SidebarProps) {
  const { isLessonComplete, completedLessons } = useProgress();

  return (
    <aside className="w-72 bg-bg-sidebar border-r border-border overflow-y-auto flex-shrink-0 hidden lg:block">
      <div className="p-4">
        <div className="bg-lavender-light rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-lavender mb-1">Your Journey</p>
          <p className="text-sm text-text-secondary leading-snug">From zero to developer, one step at a time.</p>
        </div>
      </div>

      {levels.map((level) => (
        <div key={level.id} className="pb-2">
          <div className="px-5 py-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-lavender text-white text-xs font-bold flex items-center justify-center">
                {level.id}
              </div>
              <p className="text-sm font-bold text-text-primary">
                {level.title}
              </p>
            </div>
          </div>

          <ul className="px-3">
            {level.lessons.map((lesson, i) => {
              const isCurrent = lesson.id === currentLessonId;
              const isComplete = isLessonComplete(lesson.id);
              const isAvailable = isComplete || isCurrent || isLessonAccessible(lesson.id, completedLessons);

              return (
                <li key={lesson.id}>
                  <button
                    onClick={() => isAvailable && onSelectLesson(lesson.id)}
                    disabled={!isAvailable}
                    className={`
                      w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-xl transition-all mb-0.5
                      ${isCurrent ? 'bg-bg-card text-lavender font-semibold' : ''}
                      ${isComplete && !isCurrent ? 'text-text-secondary' : ''}
                      ${!isAvailable ? 'text-text-muted/50 cursor-not-allowed' : 'hover:bg-bg-card cursor-pointer'}
                      ${!isCurrent && !isComplete && isAvailable ? 'text-text-primary' : ''}
                    `}
                    style={isCurrent ? { boxShadow: 'var(--shadow-card)' } : undefined}
                  >
                    {/* Step indicator */}
                    <span className="flex-shrink-0">
                      {isComplete ? (
                        <span className="w-7 h-7 rounded-full bg-mint-light flex items-center justify-center">
                          <svg className="w-4 h-4 text-mint" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : isCurrent ? (
                        <span className="w-7 h-7 rounded-full bg-lavender flex items-center justify-center animate-glow">
                          <span className="w-2 h-2 rounded-full bg-white" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-border flex items-center justify-center">
                          <span className="text-xs font-bold text-text-muted">{i + 1}</span>
                        </span>
                      )}
                    </span>

                    <span className="truncate">{lesson.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}

function isLessonAccessible(lessonId: string, completedLessons: string[]): boolean {
  if (lessonId === '0.1') return true;
  const [levelStr, orderStr] = lessonId.split('.');
  const prevOrder = parseInt(orderStr) - 1;
  if (prevOrder < 1) return true;
  const prevId = `${levelStr}.${prevOrder}`;
  return completedLessons.includes(prevId);
}
