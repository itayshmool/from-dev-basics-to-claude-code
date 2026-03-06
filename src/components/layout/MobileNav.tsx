import { levels } from '../../data/levels';
import { useProgress } from '../../hooks/useProgress';
import { LEVELS, getLevelDisplayNumber } from '../../lib/constants';

interface MobileNavProps {
  currentLessonId: string;
  currentLevel: number;
  onSelectLesson: (lessonId: string) => void;
  showLessons: boolean;
  onToggleLessons: () => void;
}

export function MobileNav({ currentLessonId, currentLevel, onSelectLesson, showLessons, onToggleLessons }: MobileNavProps) {
  const { isLessonComplete, completedLessons, getLevelCompletedCount } = useProgress();

  const levelInfo = LEVELS[currentLevel];
  const completed = getLevelCompletedCount(currentLevel);
  const total = levelInfo?.lessonCount ?? 1;
  const pct = Math.round((completed / total) * 100);

  return (
    <>
      {/* Overlay */}
      {showLessons && (
        <div
          className="fixed inset-0 bg-bg-overlay z-40 animate-fade-in"
          onClick={onToggleLessons}
        />
      )}

      {/* Slide-up drawer */}
      {showLessons && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
          <div className="bg-bg-secondary rounded-t-2xl max-h-[70dvh] flex flex-col" style={{ boxShadow: 'var(--shadow-float)' }}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border-strong" />
            </div>

            <div className="px-5 pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-text-primary">Lessons</h3>
                <button
                  onClick={onToggleLessons}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg-card transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-3 py-2 safe-bottom">
              {levels.map((level) => (
                <div key={level.id} className="mb-3">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <span className="w-5 h-5 rounded-md bg-purple text-white text-[10px] font-bold flex items-center justify-center">
                      {getLevelDisplayNumber(level.id)}
                    </span>
                    <span className="text-xs font-semibold text-text-muted">{level.title}</span>
                  </div>

                  {level.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    const isDone = isLessonComplete(lesson.id);
                    const canAccess = isDone || isCurrent || isLessonAccessible(lesson.id, completedLessons);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => canAccess && onSelectLesson(lesson.id)}
                        disabled={!canAccess}
                        className={`
                          w-full text-left px-3 py-3 text-sm flex items-center gap-3 rounded-xl transition-all mb-0.5
                          ${isCurrent ? 'bg-purple-soft text-purple font-semibold' : ''}
                          ${isDone && !isCurrent ? 'text-text-muted' : ''}
                          ${!canAccess ? 'text-text-muted/30 cursor-not-allowed' : 'active:scale-[0.98]'}
                          ${!isCurrent && !isDone && canAccess ? 'text-text-secondary' : ''}
                        `}
                      >
                        <span className="flex-shrink-0">
                          {isDone ? (
                            <span className="w-6 h-6 rounded-full bg-green-soft flex items-center justify-center">
                              <svg className="w-3.5 h-3.5 text-green" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          ) : isCurrent ? (
                            <span className="w-6 h-6 rounded-full bg-purple flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-border flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                            </span>
                          )}
                        </span>
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="bg-bg-secondary border-t border-border safe-bottom">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple flex items-center justify-center" style={{ boxShadow: 'var(--shadow-button)' }}>
              <span className="text-white text-sm font-bold leading-none">&gt;_</span>
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary leading-tight">Level {getLevelDisplayNumber(currentLevel)}</p>
              <p className="text-[10px] text-text-muted leading-tight">{levelInfo?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-text-muted">{pct}%</span>
            </div>

            <button
              onClick={onToggleLessons}
              className="w-9 h-9 rounded-xl bg-bg-card flex items-center justify-center active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
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
