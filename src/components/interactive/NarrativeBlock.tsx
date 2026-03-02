import type { NarrativeSection } from '../../core/lesson/types';

interface NarrativeBlockProps {
  section: NarrativeSection;
  onContinue: () => void;
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-text-primary">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-lavender-light text-lavender rounded-md font-mono text-[0.85em] font-bold">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function NarrativeBlock({ section, onContinue }: NarrativeBlockProps) {
  return (
    <div className="space-y-5 animate-fade-in-up">
      <p className="text-base leading-relaxed text-text-primary font-medium">
        {renderInlineMarkdown(section.content)}
      </p>

      {section.analogy && (
        <div className="relative bg-sky-light rounded-2xl px-5 py-4 border border-sky/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none flex-shrink-0 mt-0.5">&#128161;</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky mb-1">Think of it this way</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {renderInlineMarkdown(section.analogy)}
              </p>
            </div>
          </div>
        </div>
      )}

      {section.keyPoints && section.keyPoints.length > 0 && (
        <div className="bg-bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-xs font-bold uppercase tracking-wider text-lavender mb-3">Key Points</p>
          <ul className="space-y-2.5">
            {section.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-secondary animate-slide-in" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="w-6 h-6 rounded-lg bg-lavender-light text-lavender text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{renderInlineMarkdown(point)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.tip && (
        <div className="bg-sunshine-light rounded-2xl px-5 py-4 border border-sunshine/20">
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none flex-shrink-0">&#128173;</span>
            <p className="text-sm text-text-secondary leading-relaxed">
              <span className="font-bold text-text-primary">Tip: </span>
              {renderInlineMarkdown(section.tip)}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="mt-2 px-7 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97]"
        style={{ boxShadow: 'var(--shadow-button)' }}
      >
        Continue &rarr;
      </button>
    </div>
  );
}
