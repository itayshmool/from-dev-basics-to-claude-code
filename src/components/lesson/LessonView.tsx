import { useLessonEngine } from '../../hooks/useLessonEngine';
import { useProgress } from '../../hooks/useProgress';
import { getLessonById, getLevelForLesson } from '../../data/levels';
import { SectionRenderer } from './SectionRenderer';
import { LessonComplete } from './LessonComplete';
import { MilestoneScreen } from './MilestoneScreen';

interface LessonViewProps {
  lessonId: string;
  onNavigate: (lessonId: string) => void;
}

export function LessonView({ lessonId, onNavigate }: LessonViewProps) {
  const lesson = getLessonById(lessonId);
  const level = getLevelForLesson(lessonId);
  const { currentSectionIndex, markLessonComplete, setCurrentLesson, setCurrentSection } = useProgress();

  const engine = useLessonEngine(lesson, currentSectionIndex);

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
  const isComplete = eng.isLessonComplete();
  const sectionIndex = eng.getCurrentSectionIndex();
  const totalSections = les.sections.length;

  const isLastLesson = level.lessons[level.lessons.length - 1].id === lessonId;
  const showMilestone = isComplete && isLastLesson && les.milestone;

  function handleSectionComplete() {
    eng.advance();
    const newIndex = eng.getCurrentSectionIndex();
    setCurrentSection(newIndex);

    if (eng.isLessonComplete()) {
      markLessonComplete(lessonId, les.level);
    }
  }

  function handleNextLesson() {
    if (les.nextLesson) {
      setCurrentLesson(les.nextLesson, 0);
      onNavigate(les.nextLesson);
    }
  }

  if (showMilestone && les.milestone) {
    return <MilestoneScreen milestone={les.milestone} levelId={les.level} />;
  }

  if (isComplete) {
    return (
      <LessonComplete
        message={les.completionMessage || 'Great work! You completed this lesson.'}
        onNext={handleNextLesson}
        hasNext={!!les.nextLesson}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 md:px-6 md:py-8 pb-4">
      {/* Lesson header */}
      <div className="mb-5 md:mb-7 animate-fade-in-up">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple bg-purple-soft px-2 py-0.5 rounded-full">
            Level {les.level}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-teal bg-teal-soft px-2 py-0.5 rounded-full">
            Lesson {les.order}
          </span>
        </div>
        <h2 className="text-lg md:text-xl font-bold text-text-primary leading-snug">{les.title}</h2>
        <p className="text-sm text-text-secondary mt-0.5">{les.subtitle}</p>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mt-4">
          {Array.from({ length: totalSections }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < sectionIndex ? 'bg-green' : i === sectionIndex ? 'bg-purple animate-pulse-ring' : 'bg-border'
              }`}
            />
          ))}
          <span className="text-[10px] font-bold text-text-muted ml-1.5 tabular-nums">
            {sectionIndex + 1}/{totalSections}
          </span>
        </div>
      </div>

      {/* Current section */}
      {currentSection && (
        <SectionRenderer
          key={`${lessonId}-${sectionIndex}`}
          section={currentSection}
          onComplete={handleSectionComplete}
        />
      )}
    </div>
  );
}
