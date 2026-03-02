import type { NarrativeSection } from '../../core/lesson/types';

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
      return <code key={i} className="px-1 py-0.5 bg-lavender-light text-lavender rounded font-mono text-[0.85em] font-medium">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function NarrativeBlock({ section, onContinue }: NarrativeBlockProps) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <p className="text-[15px] leading-relaxed text-text-primary">
        {renderInlineMarkdown(section.content)}
      </p>

      {section.analogy && (
        <div className="bg-sky-light rounded-xl px-4 py-3.5 border border-sky/15">
          <div className="flex items-start gap-2.5">
            <span className="text-lg leading-none flex-shrink-0 mt-0.5">&#128161;</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky mb-0.5">Think of it this way</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {renderInlineMarkdown(section.analogy)}
              </p>
            </div>
          </div>
        </div>
      )}

      {section.keyPoints && section.keyPoints.length > 0 && (
        <div className="bg-bg-card rounded-xl p-4 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-lavender mb-2.5">Key Points</p>
          <ul className="space-y-2">
            {section.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="w-5 h-5 rounded-md bg-lavender-light text-lavender text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{renderInlineMarkdown(point)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.tip && (
        <div className="bg-sunshine-light rounded-xl px-4 py-3.5 border border-sunshine/15">
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none flex-shrink-0">&#128173;</span>
            <p className="text-sm text-text-secondary leading-relaxed">
              <span className="font-semibold text-text-primary">Tip: </span>
              {renderInlineMarkdown(section.tip)}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full md:w-auto px-6 py-3 bg-lavender text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
        style={{ boxShadow: 'var(--shadow-button)' }}
      >
        Continue &rarr;
      </button>
    </div>
  );
}
