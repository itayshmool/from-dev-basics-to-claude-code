import { useState, useCallback } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LessonView } from './components/lesson/LessonView';
import { useProgress } from './hooks/useProgress';
import { getLevelForLesson } from './data/levels';

function App() {
  const { currentLessonId, setCurrentLesson } = useProgress();
  const [activeLessonId, setActiveLessonId] = useState(currentLessonId || '0.1');

  const currentLevel = getLevelForLesson(activeLessonId);

  const handleSelectLesson = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
    setCurrentLesson(lessonId, 0);
  }, [setCurrentLesson]);

  const handleNavigate = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
  }, []);

  return (
    <AppLayout
      header={<Header currentLevel={currentLevel?.id ?? 0} />}
      sidebar={
        <Sidebar
          currentLessonId={activeLessonId}
          onSelectLesson={handleSelectLesson}
        />
      }
      main={
        <LessonView
          key={activeLessonId}
          lessonId={activeLessonId}
          onNavigate={handleNavigate}
        />
      }
    />
  );
}

export default App;
