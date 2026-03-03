import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLessonEngine } from '../../hooks/useLessonEngine';
import { useProgress } from '../../hooks/useProgress';
import { getLessonById, getLevelForLesson } from '../../data/levels';
import { SectionRenderer } from './SectionRenderer';
import { LessonComplete } from './LessonComplete';
import { MilestoneScreen } from './MilestoneScreen';
import { LessonProgressBar } from './LessonProgressBar';
import { TerminalProvider } from '../../core/terminal/TerminalContext';
import { pushCompletion } from '../../services/progressSync';

export function LessonView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const lesson = lessonId ? getLessonById(lessonId) : null;
  const level = lessonId ? getLevelForLesson(lessonId) : null;
  const { currentSectionIndex, markLessonComplete, setCurrentLesson, setCurrentSection } = useProgress();
  const engine = useLessonEngine(lesson, currentSectionIndex);

  const [isTransitioning, setIsTransitioning] = useState(false);

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
    setTimeout(() => {
      eng.advance();
      const newIndex = eng.getCurrentSectionIndex();
      setCurrentSection(newIndex);

      if (eng.isLessonComplete()) {
        markLessonComplete(lessonId!, les.level);
        pushCompletion(lessonId!, totalSections - 1);
      }
      setIsTransitioning(false);
    }, 200);
  }

  function handleNextLesson() {
    if (les.nextLesson) {
      setCurrentLesson(les.nextLesson, 0);
      navigate(`/lesson/${les.nextLesson}`);
    }
  }

  function handleExitLesson() {
    navigate('/');
  }

  // Milestone screen
  if (showMilestone && les.milestone) {
    return <MilestoneScreen milestone={les.milestone} levelId={les.level} onContinue={handleExitLesson} />;
  }

  // Lesson complete
  if (showCompletion) {
    return (
      <LessonComplete
        message={les.completionMessage || 'Great work! You completed this lesson.'}
        onNext={handleNextLesson}
        onHome={handleExitLesson}
        hasNext={!!les.nextLesson}
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
      />

      {isTerminalLesson ? (
        <TerminalProvider key={lessonId} initialFs={les.initialFs} initialDir={les.initialDir}>
          {sectionContent}
        </TerminalProvider>
      ) : (
        sectionContent
      )}
    </div>
  );
}
