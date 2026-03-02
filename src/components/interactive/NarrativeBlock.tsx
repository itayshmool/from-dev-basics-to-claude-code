import type { NarrativeSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';

interface NarrativeBlockProps {
  section: NarrativeSection;
  onContinue: () => void;
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-text-primary">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-purple-soft text-purple rounded-md font-mono text-[0.85em] font-medium">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function NarrativeBlock({ section, onContinue }: NarrativeBlockProps) {
  return (
    <LessonStep cta={{ label: 'Continue', onClick: onContinue }}>
      <div className="space-y-5">
        <p className="text-[17px] leading-relaxed text-text-secondary">
          {renderInlineMarkdown(section.content)}
        </p>

        {section.analogy && (
          <div className="bg-blue-soft rounded-xl px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none flex-shrink-0">&#128161;</span>
              <div>
                <p className="text-xs font-semibold text-blue mb-1">Think of it this way</p>
                <p className="text-[15px] text-text-secondary leading-relaxed">
                  {renderInlineMarkdown(section.analogy)}
                </p>
              </div>
            </div>
          </div>
        )}

        {section.keyPoints && section.keyPoints.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-muted">Key points</p>
            <ul className="space-y-2.5">
              {section.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] text-text-secondary animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="w-6 h-6 rounded-lg bg-purple-soft text-purple text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{renderInlineMarkdown(point)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.tip && (
          <div className="bg-yellow-soft rounded-xl px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none flex-shrink-0">&#128173;</span>
              <p className="text-[15px] text-text-secondary leading-relaxed">
                <span className="font-semibold text-text-primary">Tip: </span>
                {renderInlineMarkdown(section.tip)}
              </p>
            </div>
          </div>
        )}
      </div>
    </LessonStep>
  );
}
