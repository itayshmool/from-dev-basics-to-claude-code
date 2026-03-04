import { useNavigate, Link } from 'react-router-dom';
import { levels } from '../../data/levels';
import { useProgress } from '../../hooks/useProgress';
import { useAuth } from '../../contexts/AuthContext';
import { LEVELS } from '../../lib/constants';

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

export function HomeScreen() {
  const navigate = useNavigate();
  const { isLessonComplete, completedLessons, getLevelCompletedCount, currentSectionIndex, currentLessonId } = useProgress();
  const { user, logout } = useAuth();

  const totalLessons = LEVELS.reduce((sum, l) => sum + l.lessonCount, 0);
  const totalCompleted = completedLessons.length;
  const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto bg-bg-primary relative">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/4 w-[500px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'rgba(255, 107, 53, 0.03)', filter: 'blur(100px)' }}
      />

      <div className="relative max-w-[1400px] mx-auto px-5 py-8 md:px-10 md:py-12 lg:px-16 xl:px-20 safe-bottom">
        {/* Hero */}
        <div className="mb-12 md:mb-16 animate-stagger-in">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-11 h-11 md:w-12 md:h-12 rounded-lg bg-purple-soft border border-purple/20 flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: 'var(--shadow-glow)' }}
            >
              <span className="text-purple text-base md:text-lg font-bold font-mono">&gt;_</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-text-primary tracking-tight font-mono">
                Terminal Trainer
              </h1>
              <p className="text-xs md:text-sm lg:text-base text-text-muted mt-0.5">
                Learn the command line from zero
              </p>
            </div>

            {/* Auth section */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-xs font-mono text-text-muted hidden md:inline">
                    {user.displayName}
                  </span>
                  <button
                    onClick={() => logout()}
                    className="text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-xs font-mono text-purple hover:underline"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>

          {/* Overall progress — desktop */}
          {totalCompleted > 0 && (
            <div className="hidden md:flex items-center gap-3 mt-5 pl-[60px]">
              <span className="text-sm lg:text-base font-mono text-text-muted">
                <span className="text-purple font-semibold">{totalCompleted}</span>
                <span className="opacity-50"> / {totalLessons} completed</span>
              </span>
              <div className="w-32 h-1 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple rounded-full transition-all duration-700"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Level cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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
                className="animate-stagger-in bg-bg-card rounded-xl border border-border hover:border-border-strong transition-colors p-4 md:p-5 lg:p-6"
                style={{ animationDelay: `${levelIdx * 60}ms`, boxShadow: 'var(--shadow-card)' }}
              >
                {/* Level header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg">{LEVEL_EMOJI[levelMeta.id] ?? '\u{1F4DA}'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm lg:text-base font-semibold text-text-primary truncate font-mono">
                        {levelMeta.title}
                      </h2>
                      {allLevelComplete && (
                        <span className="flex-shrink-0 text-[10px] font-bold font-mono text-green bg-green-soft px-1.5 py-0.5 rounded">Done</span>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm text-text-muted truncate mt-0.5">{levelMeta.subtitle}</p>
                  </div>
                </div>

                {/* Progress bar */}
                {isLevelAvailable && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] lg:text-xs font-mono font-semibold text-text-muted tabular-nums">{completedCount}/{totalCount}</span>
                  </div>
                )}

                {/* Lessons */}
                {isLevelAvailable && levelData ? (
                  <div className="space-y-0.5">
                    {levelData.lessons.map((lesson) => {
                      const isDone = isLessonComplete(lesson.id);
                      const isCurrent = lesson.id === currentLessonId;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => navigate(`/lesson/${lesson.id}`)}
                          className={`
                            w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all
                            border border-transparent
                            hover:bg-bg-elevated/50 active:scale-[0.98]
                          `}
                        >
                          {/* Status indicator */}
                          <span className="flex-shrink-0">
                            {isDone ? (
                              <span className="w-5 h-5 rounded-full bg-green-soft flex items-center justify-center">
                                <svg className="w-3 h-3 text-green" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                              </span>
                            )}
                          </span>

                          {/* Text */}
                          <div className="min-w-0 flex-1">
                            <p className={`text-[13px] lg:text-[15px] font-medium truncate ${
                              isDone ? 'text-text-secondary' : 'text-text-primary'
                            }`}>
                              {lesson.title}
                            </p>
                            <p className="text-[11px] lg:text-xs text-text-muted truncate">{lesson.subtitle}</p>
                            {isCurrent && !isDone && currentSectionIndex > 0 && lesson.sections.length > 0 && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden max-w-[100px]">
                                  <div
                                    className="h-full bg-purple rounded-full transition-all duration-300"
                                    style={{ width: `${(currentSectionIndex / lesson.sections.length) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-text-muted tabular-nums">{currentSectionIndex}/{lesson.sections.length}</span>
                              </div>
                            )}
                          </div>

                          {/* Arrow */}
                          {!isDone && (
                            <svg className="w-3.5 h-3.5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-2.5 rounded-lg bg-bg-elevated/30">
                    <p className="text-xs text-text-muted font-mono">Coming soon</p>
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
