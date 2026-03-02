import { useState, useEffect } from 'react';
import { useLessonEngine } from '../../hooks/useLessonEngine';
import { useProgress } from '../../hooks/useProgress';
import { getLessonById, getLevelForLesson } from '../../data/levels';
import { SectionRenderer } from './SectionRenderer';
import { LessonComplete } from './LessonComplete';
import { MilestoneScreen } from './MilestoneScreen';
import { LessonProgressBar } from './LessonProgressBar';

interface LessonViewProps {
  lessonId: string;
  onNavigate: (lessonId: string) => void;
  onExitLesson: () => void;
  onLessonStateChange: (inLesson: boolean) => void;
}

export function LessonView({ lessonId, onNavigate, onExitLesson, onLessonStateChange }: LessonViewProps) {
  const lesson = getLessonById(lessonId);
  const level = getLevelForLesson(lessonId);
  const { currentSectionIndex, markLessonComplete, setCurrentLesson, setCurrentSection } = useProgress();
  const engine = useLessonEngine(lesson, currentSectionIndex);

  const [isTransitioning, setIsTransitioning] = useState(false);

  const isComplete = engine?.isLessonComplete() ?? false;
  const isLastLesson = level ? level.lessons[level.lessons.length - 1].id === lessonId : false;
  const showMilestone = isComplete && isLastLesson && lesson?.milestone;
  const showCompletion = isComplete && !showMilestone;

  // Notify parent about lesson state
  useEffect(() => {
    onLessonStateChange(!isComplete);
  }, [isComplete, onLessonStateChange]);

  if (!lesson || !engine || !level) {
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
        markLessonComplete(lessonId, les.level);
      }
      setIsTransitioning(false);
    }, 200);
  }

  function handleNextLesson() {
    if (les.nextLesson) {
      setCurrentLesson(les.nextLesson, 0);
      onNavigate(les.nextLesson);
    }
  }

  // Milestone screen — dark theme, full screen
  if (showMilestone && les.milestone) {
    return <MilestoneScreen milestone={les.milestone} levelId={les.level} />;
  }

  // Lesson complete — dark theme, full screen
  if (showCompletion) {
    return (
      <LessonComplete
        message={les.completionMessage || 'Great work! You completed this lesson.'}
        onNext={handleNextLesson}
        hasNext={!!les.nextLesson}
      />
    );
  }

  // Active lesson — light theme, immersive
  return (
    <div className="lesson-surface h-full flex flex-col bg-bg-primary">
      <LessonProgressBar
        current={sectionIndex}
        total={totalSections}
        onClose={onExitLesson}
      />

      {/* Section content */}
      <div className={`flex-1 overflow-hidden ${isTransitioning ? 'animate-slide-out-left' : 'animate-slide-in-right'}`}>
        {currentSection && (
          <SectionRenderer
            key={`${lessonId}-${sectionIndex}`}
            section={currentSection}
            onComplete={handleSectionComplete}
          />
        )}
      </div>
    </div>
  );
}
