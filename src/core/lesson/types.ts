export interface FileSystemSpec {
  [key: string]: string | FileSystemSpec;
}

// --- Section types ---

export interface NarrativeSection {
  type: 'narrative';
  content: string;
  analogy?: string;
  keyPoints?: string[];
  tip?: string;
}

export interface QuizSection {
  type: 'quiz';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MatchSection {
  type: 'match';
  instruction: string;
  pairs: Array<{ left: string; right: string }>;
}

export interface FillInBlankSection {
  type: 'fillInBlank';
  prompt: string;
  answer: string;
  acceptAlternates?: string[];
  caseSensitive?: boolean;
}

export interface InteractiveTreeSection {
  type: 'interactiveTree';
  instruction: string;
  tree: FileSystemSpec;
  highlightPath?: string;
}

export interface PathBuilderSection {
  type: 'pathBuilder';
  instruction: string;
  tree: FileSystemSpec;
  targetPath: string;
}

export interface TerminalPreviewSection {
  type: 'terminalPreview';
  instruction: string;
  lines: Array<{
    type: 'command' | 'output';
    text: string;
    annotation?: string;
  }>;
}

export interface ProgramSimSection {
  type: 'programSim';
  instruction: string;
  lines: string[];
  interactions: Array<{
    afterLine: number;
    type: 'input' | 'display';
    prompt?: string;
    value?: string;
  }>;
}

export interface TerminalStepSection {
  type: 'terminalStep';
  instruction: string;
  prompt: string;
  hint: string;
  validation: {
    type: 'exactCommand' | 'commandStartsWith' | 'outputContains'
      | 'fileExists' | 'fileContains' | 'directoryExists' | 'fsStateMatch';
    value: string | Record<string, unknown>;
  };
  onSuccess: {
    message: string;
    highlightExplorer?: string;
  };
}

export type LessonSection =
  | NarrativeSection
  | QuizSection
  | MatchSection
  | FillInBlankSection
  | InteractiveTreeSection
  | PathBuilderSection
  | TerminalPreviewSection
  | ProgramSimSection
  | TerminalStepSection;

// --- Lesson ---

export interface MilestoneInfo {
  title: string;
  summary: string[];
  nextLevelTeaser: string;
}

export interface Lesson {
  id: string;
  level: number;
  order: number;
  title: string;
  subtitle: string;
  type: 'conceptual' | 'terminal';
  sections: LessonSection[];
  completionMessage?: string;
  milestone?: MilestoneInfo | null;
  nextLesson: string | null;
}
