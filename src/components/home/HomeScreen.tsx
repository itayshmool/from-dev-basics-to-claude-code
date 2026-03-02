import { levels } from '../../data/levels';
import { useProgress } from '../../hooks/useProgress';
import { LEVELS } from '../../lib/constants';

interface HomeScreenProps {
  currentLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}

const LEVEL_EMOJI: Record<number, string> = {
  0: '\u{1F4BB}', // laptop
  1: '\u{1F4DF}', // terminal/pager
  2: '\u{1F4D6}', // open book
  3: '\u{1F500}', // shuffle/git
  4: '\u{2601}\uFE0F',  // cloud
  5: '\u{1F528}', // hammer
  6: '\u{1F916}', // robot
  7: '\u{1F680}', // rocket
};

export function HomeScreen({ currentLessonId, onSelectLesson }: HomeScreenProps) {
  const { isLessonComplete, completedLessons, getLevelCompletedCount } = useProgress();

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <div className="max-w-lg mx-auto px-5 py-8 md:py-12 safe-bottom">
        {/* Hero */}
        <div className="mb-10 animate-stagger-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple flex items-center justify-center" style={{ boxShadow: 'var(--shadow-glow)' }}>
              <span className="text-white text-lg font-bold font-mono">&gt;_</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Terminal Trainer</h1>
              <p className="text-sm text-text-muted">Learn the command line from zero</p>
            </div>
          </div>
        </div>

        {/* Level sections */}
        <div className="space-y-8">
          {LEVELS.map((levelMeta, levelIdx) => {
            const levelData = levels.find(l => l.id === levelMeta.id);
            const completedCount = getLevelCompletedCount(levelMeta.id);
            const totalCount = levelMeta.lessonCount;
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isLevelAvailable = levelData != null;
            const allLevelComplete = completedCount >= totalCount;

            return (
              <div
                key={levelMeta.id}
                className="animate-stagger-in"
                style={{ animationDelay: `${levelIdx * 80}ms` }}
              >
                {/* Level header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{LEVEL_EMOJI[levelMeta.id] ?? '\u{1F4DA}'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-text-primary truncate">
                        {levelMeta.title}
                      </h2>
                      {allLevelComplete && (
                        <span className="flex-shrink-0 text-xs font-bold text-green bg-green-soft px-2 py-0.5 rounded-full">Done</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">{levelMeta.subtitle}</p>
                  </div>
                </div>

                {/* Progress bar for this level */}
                {isLevelAvailable && (
                  <div className="flex items-center gap-2 mb-3 ml-9">
                    <div className="flex-1 h-1.5 bg-bg-card rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-text-muted tabular-nums">{completedCount}/{totalCount}</span>
                  </div>
                )}

                {/* Lessons */}
                {isLevelAvailable && levelData ? (
                  <div className="ml-4 space-y-1.5">
                    {levelData.lessons.map((lesson) => {
                      const isCurrent = lesson.id === currentLessonId;
                      const isDone = isLessonComplete(lesson.id);
                      const canAccess = isDone || isCurrent || isLessonAccessible(lesson.id, completedLessons);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => canAccess && onSelectLesson(lesson.id)}
                          disabled={!canAccess}
                          className={`
                            w-full text-left px-4 py-3.5 rounded-2xl flex items-center gap-3 transition-all
                            ${isCurrent ? 'bg-purple-soft border border-purple/20 animate-glow-pulse' : ''}
                            ${isDone && !isCurrent ? 'bg-bg-card border border-transparent' : ''}
                            ${!canAccess ? 'opacity-35 cursor-not-allowed' : 'active:scale-[0.98]'}
                            ${!isCurrent && !isDone && canAccess ? 'bg-bg-card border border-transparent hover:border-border' : ''}
                          `}
                        >
                          {/* Status icon */}
                          <span className="flex-shrink-0">
                            {isDone ? (
                              <span className="w-7 h-7 rounded-full bg-green flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            ) : isCurrent ? (
                              <span className="w-7 h-7 rounded-full bg-purple flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-white" />
                              </span>
                            ) : canAccess ? (
                              <span className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-text-muted" />
                              </span>
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center">
                                <svg className="w-3 h-3 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </span>

                          {/* Text */}
                          <div className="min-w-0 flex-1">
                            <p className={`text-[15px] font-medium truncate ${
                              isCurrent ? 'text-purple' :
                              isDone ? 'text-text-secondary' :
                              canAccess ? 'text-text-primary' :
                              'text-text-muted'
                            }`}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-text-muted truncate">{lesson.subtitle}</p>
                          </div>

                          {/* Arrow */}
                          {canAccess && !isDone && (
                            <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ml-4 px-4 py-3 bg-bg-card rounded-2xl border border-border">
                    <p className="text-sm text-text-muted italic">Coming soon</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
