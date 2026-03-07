import { useState, useCallback } from 'react';
import { LEVEL_ASSESSMENTS } from '../../data/assessments';
import { useProgress } from '../../hooks/useProgress';
import { useAuth } from '../../contexts/AuthContext';
import { useAchievements } from '../../contexts/AchievementContext';
import { apiFetch } from '../../services/api';
import { levels } from '../../data/levels';
import { LEVELS } from '../../lib/constants';
import { CelebrationOverlay } from '../lesson/CelebrationOverlay';

interface LevelAssessmentProps {
  levelId: number;
  onClose: () => void;
}

export function LevelAssessment({ levelId, onClose }: LevelAssessmentProps) {
  const assessment = LEVEL_ASSESSMENTS.find(a => a.levelId === levelId);
  const levelMeta = LEVELS.find(l => l.id === levelId);
  const levelData = levels.find(l => l.id === levelId);
  const { user } = useAuth();
  const { markLessonComplete, isLessonComplete } = useProgress();
  const { checkForNewAchievements } = useAchievements();

  const [answers, setAnswers] = useState<(number | null)[]>(
    () => new Array(assessment?.questions.length ?? 0).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  if (!assessment || !levelMeta || !levelData) return null;

  const { questions, passingScore } = assessment;
  const allAnswered = answers.every(a => a !== null);

  const correctCount = answers.reduce<number>((sum, a, i) => sum + (a === questions[i].correctIndex ? 1 : 0), 0);
  const score = questions.length > 0 ? correctCount / questions.length : 0;
  const passed = score >= passingScore;

  async function handleSubmit() {
    setSubmitted(true);
    if (!passed) return;

    setCompleting(true);

    // Snapshot current achievements before bulk completion
    let prevEarnedIds: string[] = [];
    if (user) {
      try {
        const res = await apiFetch('/api/progress/achievements');
        if (res.ok) {
          const data = await res.json();
          prevEarnedIds = data.earned.map((a: { id: string }) => a.id);
        }
      } catch { /* ok */ }
    }

    // Mark all lessons in this level as complete
    for (const lesson of levelData!.lessons) {
      if (!isLessonComplete(lesson.id)) {
        markLessonComplete(lesson.id, levelId);
        // Also push to API if logged in
        if (user) {
          try {
            await apiFetch(`/api/progress/${lesson.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sectionIndex: lesson.sections.length, completed: true }),
            });
          } catch { /* fire and forget */ }
        }
      }
    }

    // Check for new achievements
    if (user) {
      await checkForNewAchievements(prevEarnedIds);
    }

    setCompleting(false);
    setShowCelebration(true);
  }

  const handleCelebrationDone = useCallback(() => {
    setShowCelebration(false);
    onClose();
  }, [onClose]);

  return (
    <>
      {showCelebration && <CelebrationOverlay onDone={handleCelebrationDone} message="Level complete!" />}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className="bg-bg-card border border-border rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-mono text-purple uppercase tracking-wider">Test Out</p>
              <h2 className="text-lg font-mono font-semibold text-text-primary">{levelMeta.title}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {!submitted ? (
            <>
              <p className="text-[13px] text-text-muted mb-5">
                Answer {Math.ceil(questions.length * passingScore)} of {questions.length} correctly to skip this level.
              </p>

              <div className="space-y-5">
                {questions.map((q, qi) => (
                  <div key={qi}>
                    <p className="text-[14px] font-medium text-text-primary mb-2">{qi + 1}. {q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <button
                          key={oi}
                          onClick={() => setAnswers(prev => { const next = [...prev]; next[qi] = oi; return next; })}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] border transition-all ${
                            answers[qi] === oi
                              ? 'border-purple bg-purple-soft text-purple font-medium'
                              : 'border-border bg-bg-elevated text-text-secondary hover:border-border-strong'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="w-full mt-6 py-3 rounded-xl font-mono font-semibold text-[15px] transition-all bg-purple text-white disabled:opacity-30 active:scale-[0.98]"
              >
                Check Answers
              </button>
            </>
          ) : (
            <div className="space-y-4">
              {/* Score */}
              <div className={`rounded-xl px-4 py-4 text-center ${passed ? 'bg-green-soft' : 'bg-red-soft'}`}>
                <p className={`text-3xl font-mono font-bold ${passed ? 'text-green' : 'text-red'}`}>
                  {correctCount}/{questions.length}
                </p>
                <p className={`text-sm font-mono mt-1 ${passed ? 'text-green' : 'text-red'}`}>
                  {passed ? 'Passed! All lessons marked complete.' : `Need ${Math.ceil(questions.length * passingScore)} correct to pass.`}
                </p>
              </div>

              {/* Show which ones were wrong */}
              {!passed && (
                <div className="space-y-2">
                  <p className="text-[13px] font-mono text-text-muted">Review these topics:</p>
                  {questions.map((q, qi) => {
                    if (answers[qi] === q.correctIndex) return null;
                    return (
                      <div key={qi} className="text-[13px] text-text-secondary bg-bg-elevated rounded-lg px-3 py-2">
                        <span className="text-red mr-1">&#x2717;</span> {q.question}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-mono font-semibold text-[15px] transition-all bg-bg-elevated text-text-primary hover:bg-bg-card active:scale-[0.98]"
              >
                {passed ? 'Done' : 'Close & Study'}
              </button>
            </div>
          )}

          {completing && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-card/80 rounded-2xl">
              <p className="text-sm font-mono text-text-muted animate-pulse">Marking lessons complete...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
