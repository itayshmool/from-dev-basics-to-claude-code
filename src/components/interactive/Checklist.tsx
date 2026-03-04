import { useState, useCallback } from 'react';
import type { ChecklistSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';

interface ChecklistProps {
  section: ChecklistSection;
  onComplete: () => void;
}

function renderInlineCode(text: string) {
  return text.split('`').map((part, i) =>
    i % 2 === 0 ? part : (
      <code key={i} className="text-[13px] font-mono font-medium text-purple bg-purple-soft px-1.5 py-0.5 rounded">
        {part}
      </code>
    )
  );
}

export function Checklist({ section, onComplete }: ChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [expandedHints, setExpandedHints] = useState<Set<number>>(new Set());

  const allChecked = checkedItems.size === section.items.length;

  const toggleCheck = useCallback((index: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const toggleHint = useCallback((index: number) => {
    setExpandedHints(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  return (
    <LessonStep cta={{ label: 'Continue', onClick: onComplete, disabled: !allChecked }}>
      <div className="space-y-5">
        {/* Instruction */}
        <p className="text-[17px] leading-relaxed text-text-secondary whitespace-pre-line">
          {renderInlineCode(section.instruction)}
        </p>

        {/* Checklist items */}
        <div className="space-y-2">
          {section.items.map((item, i) => {
            const isChecked = checkedItems.has(i);
            const hasHint = !!item.hint;
            const hintExpanded = expandedHints.has(i);

            return (
              <div
                key={item.text}
                className={`rounded-lg border transition-all ${
                  isChecked
                    ? 'border-purple/30 bg-purple-soft/30'
                    : 'border-border bg-bg-card hover:border-border-strong'
                }`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleCheck(i); }}
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
                >
                  {/* Custom checkbox */}
                  <span
                    role="checkbox"
                    aria-checked={isChecked}
                    className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-all ${
                      isChecked
                        ? 'bg-purple border-2 border-purple'
                        : 'bg-bg-elevated border-2 border-border'
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>

                  {/* Item text */}
                  <span className={`text-[15px] leading-relaxed flex-1 ${
                    isChecked ? 'text-text-primary' : 'text-text-secondary'
                  }`}>
                    {renderInlineCode(item.text)}
                  </span>
                </button>

                {/* Hint toggle + content */}
                {hasHint && (
                  <div className="px-4 pb-3 pl-12">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHint(i);
                      }}
                      className="min-h-[44px] min-w-[44px] text-[12px] font-mono text-text-muted hover:text-purple transition-colors"
                    >
                      {hintExpanded ? 'hide hint' : 'show hint'}
                    </button>
                    {hintExpanded && (
                      <p className="mt-1.5 text-[13px] text-text-muted leading-relaxed animate-fade-in-up">
                        {renderInlineCode(item.hint!)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-bg-elevated overflow-hidden">
            <div
              className="h-full bg-purple rounded-full transition-all duration-300"
              style={{ width: `${(checkedItems.size / section.items.length) * 100}%` }}
            />
          </div>
          <span className="text-[12px] font-mono text-text-muted">
            {checkedItems.size}/{section.items.length}
          </span>
        </div>
      </div>
    </LessonStep>
  );
}
