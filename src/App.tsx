import { useState, useCallback } from 'react';
import { LessonView } from './components/lesson/LessonView';
import { HomeScreen } from './components/home/HomeScreen';
import { useProgress } from './hooks/useProgress';

function App() {
  const { currentLessonId, setCurrentLesson } = useProgress();
  const [activeLessonId, setActiveLessonId] = useState(currentLessonId || '0.1');
  const [isInLesson, setIsInLesson] = useState(true);

  const handleSelectLesson = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
    setCurrentLesson(lessonId, 0);
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
    <div className="h-full bg-bg-primary">
      {isInLesson ? (
        <LessonView
          key={activeLessonId}
          lessonId={activeLessonId}
          onNavigate={handleNavigate}
          onExitLesson={handleExitLesson}
          onLessonStateChange={handleLessonStateChange}
        />
      ) : (
        <HomeScreen
          currentLessonId={activeLessonId}
          onSelectLesson={handleSelectLesson}
        />
      )}
    </div>
  );
}

export default App;
