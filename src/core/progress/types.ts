export interface ProgressState {
  completedLessons: string[];
  currentLessonId: string | null;
  currentSectionIndex: number;
  levelProgress: Record<number, number>; // level -> completed lesson count
}
