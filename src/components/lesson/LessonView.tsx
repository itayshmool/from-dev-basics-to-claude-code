import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLessonEngine } from '../../hooks/useLessonEngine';
import { validateLesson } from '../../core/lesson/LessonEngine';
import { useProgress } from '../../hooks/useProgress';
import { getLessonById, getLevelForLesson, levels as allLevels } from '../../data/levels';
import { LEVELS } from '../../lib/constants';
import { SectionRenderer } from './SectionRenderer';
import { LessonComplete } from './LessonComplete';
import { MilestoneScreen } from './MilestoneScreen';
import { LessonProgressBar } from './LessonProgressBar';
import { BugReportModal, type BugReportContext } from './BugReportModal';
import { TerminalProvider, useTerminal } from '../../core/terminal/TerminalContext';
import { pushCompletion } from '../../services/progressSync';
import { useAchievements } from '../../contexts/AchievementContext';
import { apiFetch } from '../../services/api';

/** Renders BugReportModal inside TerminalProvider scope so it can access terminal context */
function TerminalBugReport({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  sectionIndex,
  totalSections,
  currentSection,
}: {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
  sectionIndex: number;
  totalSections: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentSection: any;
}) {
  const { history, vfs, lastCommand } = useTerminal();

  const context: BugReportContext = {
    lessonId,
    lessonTitle,
    sectionIndex,
    totalSections,
    instruction: currentSection?.instruction || currentSection?.prompt,
    validation: currentSection?.validation,
    terminalHistory: history.slice(-30).map((l) => ({ type: l.type, text: l.text })),
    lastCommand,
    vfsState: vfs.toJSON('/'),
    cwd: vfs.getCwd(),
  };

  return <BugReportModal isOpen={isOpen} onClose={onClose} context={context} />;
}

export function LessonView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const lesson = lessonId ? getLessonById(lessonId) : null;
  const level = lessonId ? getLevelForLesson(lessonId) : null;
  const { currentSectionIndex, markLessonComplete, setCurrentLesson, setCurrentSection } = useProgress();
  const engine = useLessonEngine(lesson, currentSectionIndex);
  const { checkForNewAchievements } = useAchievements();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);

  // Dev-time content validation
  useEffect(() => {
    if (import.meta.env.DEV && lesson) {
      const warnings = validateLesson(lesson);
      warnings.forEach(w => console.warn(`[LessonValidation] ${w}`));
    }
  }, [lesson]);

  const isComplete = engine?.isLessonComplete() ?? false;
  const isLastLesson = level ? level.lessons[level.lessons.length - 1].id === lessonId : false;
  const showMilestone = isComplete && isLastLesson && lesson?.milestone;
  const showCompletion = isComplete && !showMilestone;

  // Set current lesson on mount
  useEffect(() => {
    if (lessonId) {
      setCurrentLesson(lessonId, 0);
    }
  }, [lessonId, setCurrentLesson]);

  const handleExitLesson = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleExitLesson();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExitLesson]);

  if (!lesson || !engine || !level || !lessonId) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Lesson not found.
      </div>
    );
  }

  const eng = engine;
  const les = lesson;

  const currentSection = eng.getCurrentSection();
  const sectionIndex = eng.getCurrentSectionIndex();
  const totalSections = les.sections.length;

  function handleSectionComplete() {
    setIsTransitioning(true);
    setTimeout(async () => {
      eng.advance();
      const newIndex = eng.getCurrentSectionIndex();
      setCurrentSection(newIndex);

      if (eng.isLessonComplete()) {
        // Snapshot current achievements before marking complete
        const beforeIds: string[] = [];
        if (import.meta.env.VITE_USE_API === 'true') {
          try {
            const snap = await apiFetch('/api/progress/achievements');
            if (snap.ok) {
              const d = await snap.json();
              beforeIds.push(...d.earned.map((a: { id: string }) => a.id));
            }
          } catch { /* ignore */ }
        }

        markLessonComplete(lessonId!, les.level);
        await pushCompletion(lessonId!, totalSections - 1);

        // Check for newly earned achievements
        if (import.meta.env.VITE_USE_API === 'true') {
          checkForNewAchievements(beforeIds);
        }
      }
      setIsTransitioning(false);
    }, 200);
  }

  function handleGoBack() {
    setIsTransitioning(true);
    setTimeout(() => {
      eng.goBack();
      const newIndex = eng.getCurrentSectionIndex();
      setCurrentSection(newIndex);
      setIsTransitioning(false);
    }, 200);
  }

  function handleNextLesson() {
    if (les.nextLesson && getLessonById(les.nextLesson)) {
      setCurrentLesson(les.nextLesson, 0);
      navigate(`/lesson/${les.nextLesson}`);
    }
  }

  // Find the next level by array position (supports non-sequential IDs like 4B = 45)
  const currentLevelIndex = allLevels.findIndex(l => l.id === level.id);
  const nextLevelData = currentLevelIndex >= 0 ? allLevels[currentLevelIndex + 1] : null;
  const nextLevelFirstLessonId = nextLevelData?.lessons[0]?.id ?? null;

  function handleNextLevel() {
    if (nextLevelFirstLessonId) {
      setCurrentLesson(nextLevelFirstLessonId, 0);
      navigate(`/lesson/${nextLevelFirstLessonId}`);
    }
  }

  // Derive next level info for milestone screen
  const nextLevelMeta = nextLevelData ? LEVELS.find(l => l.id === nextLevelData.id) : undefined;
  const nextLevelFirstLesson = nextLevelFirstLessonId ? getLessonById(nextLevelFirstLessonId) : null;
  const hasNextLevel = !!nextLevelMeta && !!nextLevelFirstLesson;

  // Milestone screen
  if (showMilestone && les.milestone) {
    return (
      <MilestoneScreen
        milestone={les.milestone}
        levelId={les.level}
        onContinue={handleExitLesson}
        onNextLevel={hasNextLevel ? handleNextLevel : undefined}
        nextLevelTitle={nextLevelMeta?.title}
      />
    );
  }

  // Lesson complete
  if (showCompletion) {
    return (
      <LessonComplete
        message={les.completionMessage || 'Great work! You completed this lesson.'}
        onNext={handleNextLesson}
        onHome={handleExitLesson}
        hasNext={!!les.nextLesson && !!getLessonById(les.nextLesson)}
      />
    );
  }

  // Active lesson
  const isTerminalLesson = les.type === 'terminal';
  const sectionContent = (
    <div className={`flex-1 overflow-hidden ${isTransitioning ? 'animate-slide-out-left' : 'animate-slide-in-right'}`}>
      {currentSection && (
        <SectionRenderer
          key={`${lessonId}-${sectionIndex}`}
          section={currentSection}
          onComplete={handleSectionComplete}
          commands={les.commandsIntroduced}
        />
      )}
    </div>
  );

  return (
    <div className="lesson-surface h-full flex flex-col bg-bg-primary">
      <LessonProgressBar
        current={sectionIndex}
        total={totalSections}
        onClose={handleExitLesson}
        onBack={handleGoBack}
        canGoBack={sectionIndex > 0}
        lessonTitle={les.title}
        onReportBug={import.meta.env.VITE_USE_API === 'true' ? () => setShowBugReport(true) : undefined}
        sectionType={currentSection?.type}
      />

      {isTerminalLesson ? (
        <TerminalProvider key={lessonId} initialFs={les.initialFs} initialDir={les.initialDir} curlMocks={les.curlMocks}>
          {sectionContent}
          <TerminalBugReport
            isOpen={showBugReport}
            onClose={() => setShowBugReport(false)}
            lessonId={lessonId}
            lessonTitle={les.title}
            sectionIndex={sectionIndex}
            totalSections={totalSections}
            currentSection={currentSection}
          />
        </TerminalProvider>
      ) : (
        <>
          {sectionContent}
          <BugReportModal
            isOpen={showBugReport}
            onClose={() => setShowBugReport(false)}
            context={{
              lessonId,
              lessonTitle: les.title,
              sectionIndex,
              totalSections,
              instruction: currentSection?.type === 'narrative' ? undefined : (currentSection as { instruction?: string })?.instruction,
            }}
          />
        </>
      )}
    </div>
  );
}
