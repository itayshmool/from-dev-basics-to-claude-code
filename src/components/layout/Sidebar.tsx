import { levels } from '../../data/levels';
import { useProgress } from '../../hooks/useProgress';
import { getLevelDisplayNumber } from '../../lib/constants';

interface SidebarProps {
  currentLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}

export function Sidebar({ currentLessonId, onSelectLesson }: SidebarProps) {
  const { isLessonComplete, completedLessons } = useProgress();

  return (
    <aside className="w-64 bg-bg-secondary border-r border-border overflow-y-auto flex-shrink-0">
      <div className="px-4 pt-5 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Your journey</p>
      </div>

      {levels.map((level) => (
        <div key={level.id} className="pb-2">
          <div className="px-4 py-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-purple text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {getLevelDisplayNumber(level.id)}
              </span>
              <p className="text-xs font-semibold text-text-primary truncate">{level.title}</p>
            </div>
          </div>

          <ul className="px-2">
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
                      w-full text-left px-2.5 py-2 text-[13px] flex items-center gap-2.5 rounded-lg transition-all mb-px
                      ${isCurrent ? 'bg-purple-soft text-purple font-semibold' : ''}
                      ${isComplete && !isCurrent ? 'text-text-muted' : ''}
                      ${!isAvailable ? 'text-text-muted/30 cursor-not-allowed' : 'hover:bg-bg-card cursor-pointer'}
                      ${!isCurrent && !isComplete && isAvailable ? 'text-text-secondary' : ''}
                    `}
                  >
                    <span className="flex-shrink-0">
                      {isComplete ? (
                        <span className="w-5 h-5 rounded-full bg-green-soft flex items-center justify-center">
                          <svg className="w-3 h-3 text-green" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : isCurrent ? (
                        <span className="w-5 h-5 rounded-full bg-purple flex items-center justify-center animate-pulse-ring">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-border flex items-center justify-center">
                          <span className="text-[9px] font-bold text-text-muted">{i + 1}</span>
                        </span>
                      )}
                    </span>
                    <span className="truncate leading-tight">{lesson.title}</span>
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
