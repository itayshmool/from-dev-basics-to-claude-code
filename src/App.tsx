import { useState, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { LessonView } from './components/lesson/LessonView';
import { useProgress } from './hooks/useProgress';
import { getLevelForLesson } from './data/levels';

function App() {
  const { currentLessonId, setCurrentLesson } = useProgress();
  const [activeLessonId, setActiveLessonId] = useState(currentLessonId || '0.1');
  const [showLessons, setShowLessons] = useState(false);
  const [isInLesson, setIsInLesson] = useState(true);

  const currentLevel = getLevelForLesson(activeLessonId);

  const handleSelectLesson = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
    setCurrentLesson(lessonId, 0);
    setShowLessons(false);
    setIsInLesson(true);
  }, [setCurrentLesson]);

  const handleNavigate = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
    setIsInLesson(true);
  }, []);

  const handleExitLesson = useCallback(() => {
    setIsInLesson(false);
  }, []);

  const handleLessonStateChange = useCallback((inLesson: boolean) => {
    setIsInLesson(inLesson);
  }, []);

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Desktop header — hidden during lessons */}
      {!isInLesson && (
        <div className="hidden md:block">
          <Header currentLevel={currentLevel?.id ?? 0} />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — hidden during lessons */}
        {!isInLesson && (
          <div className="hidden lg:block">
            <Sidebar
              currentLessonId={activeLessonId}
              onSelectLesson={handleSelectLesson}
            />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <LessonView
            key={activeLessonId}
            lessonId={activeLessonId}
            onNavigate={handleNavigate}
            onExitLesson={handleExitLesson}
            onLessonStateChange={handleLessonStateChange}
          />
        </main>
      </div>

      {/* Mobile bottom nav — hidden during lessons */}
      {!isInLesson && (
        <div className="md:hidden">
          <MobileNav
            currentLessonId={activeLessonId}
            currentLevel={currentLevel?.id ?? 0}
            onSelectLesson={handleSelectLesson}
            showLessons={showLessons}
            onToggleLessons={() => setShowLessons(!showLessons)}
          />
        </div>
      )}
    </div>
  );
}

export default App;
