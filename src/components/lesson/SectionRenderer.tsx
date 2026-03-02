import type { LessonSection } from '../../core/lesson/types';
import { NarrativeBlock } from '../interactive/NarrativeBlock';
import { Quiz } from '../interactive/Quiz';
import { FillInBlank } from '../interactive/FillInBlank';
import { ClickMatch } from '../interactive/ClickMatch';
import { InteractiveFileTree } from '../interactive/InteractiveFileTree';
import { PathBuilder } from '../interactive/PathBuilder';
import { TerminalPreview } from '../interactive/TerminalPreview';
import { ProgramSimulator } from '../interactive/ProgramSimulator';

interface SectionRendererProps {
  section: LessonSection;
  onComplete: () => void;
}

export function SectionRenderer({ section, onComplete }: SectionRendererProps) {
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
    default:
      return (
        <div className="text-text-muted text-sm">
          Unknown section type. <button onClick={onComplete} className="text-accent underline">Skip</button>
        </div>
      );
  }
}
