import type { LessonSection } from '../../core/lesson/types';
import { NarrativeBlock } from '../interactive/NarrativeBlock';
import { Quiz } from '../interactive/Quiz';
import { FillInBlank } from '../interactive/FillInBlank';
import { ClickMatch } from '../interactive/ClickMatch';
import { InteractiveFileTree } from '../interactive/InteractiveFileTree';
import { PathBuilder } from '../interactive/PathBuilder';
import { TerminalPreview } from '../interactive/TerminalPreview';
import { ProgramSimulator } from '../interactive/ProgramSimulator';
import { TerminalStep } from '../interactive/TerminalStep';
import { CodeExample } from '../interactive/CodeExample';
import { DragSort } from '../interactive/DragSort';
import { StepThrough } from '../interactive/StepThrough';
import { GuideStep } from '../interactive/GuideStep';
import { PromptTemplate } from '../interactive/PromptTemplate';
import { Checklist } from '../interactive/Checklist';

interface SectionRendererProps {
  section: LessonSection;
  onComplete: () => void;
  commands?: string[];
}

export function SectionRenderer({ section, onComplete, commands }: SectionRendererProps) {
  switch (section.type) {
    case 'narrative':
      return <NarrativeBlock section={section} onContinue={onComplete} />;
    case 'quiz':
      return <Quiz section={section} onComplete={onComplete} />;
    case 'fillInBlank':
      return <FillInBlank section={section} onComplete={onComplete} />;
    case 'match':
      return <ClickMatch section={section} onComplete={onComplete} />;
    case 'interactiveTree':
      return <InteractiveFileTree section={section} onComplete={onComplete} />;
    case 'pathBuilder':
      return <PathBuilder section={section} onComplete={onComplete} />;
    case 'terminalPreview':
      return <TerminalPreview section={section} onComplete={onComplete} />;
    case 'programSim':
      return <ProgramSimulator section={section} onComplete={onComplete} />;
    case 'terminalStep':
      return <TerminalStep section={section} onComplete={onComplete} commands={commands} />;
    case 'codeExample':
      return <CodeExample section={section} onComplete={onComplete} />;
    case 'dragSort':
      return <DragSort section={section} onComplete={onComplete} />;
    case 'stepThrough':
      return <StepThrough section={section} onComplete={onComplete} />;
    case 'guideStep':
      return <GuideStep section={section} onComplete={onComplete} />;
    case 'promptTemplate':
      return <PromptTemplate section={section} onComplete={onComplete} />;
    case 'checklist':
      return <Checklist section={section} onComplete={onComplete} />;
    default:
      return (
        <div className="text-text-muted text-sm">
          Unknown section type. <button onClick={onComplete} className="text-accent underline">Skip</button>
        </div>
      );
  }
}
