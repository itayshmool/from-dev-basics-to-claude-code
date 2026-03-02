import { useState, useCallback, useEffect } from 'react';
import type { GuideStepSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';
import { CodeBlock } from './CodeBlock';

interface GuideStepProps {
  section: GuideStepSection;
  onComplete: () => void;
}

const PLATFORM_KEY = 'terminal-trainer-platform';

function renderInlineCode(text: string) {
  return text.split('`').map((part, i) =>
    i % 2 === 0 ? part : (
      <code key={i} className="text-[13px] font-mono font-medium text-purple bg-purple-soft px-1.5 py-0.5 rounded">
        {part}
      </code>
    )
  );
}

export function GuideStep({ section, onComplete }: GuideStepProps) {
  const [platform, setPlatform] = useState<'mac' | 'windows'>(() => {
    try {
      const stored = localStorage.getItem(PLATFORM_KEY);
      if (stored === 'mac' || stored === 'windows') return stored;
    } catch { /* ignore */ }
    return 'mac';
  });
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [expandedPanels, setExpandedPanels] = useState<Set<number>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      localStorage.setItem(PLATFORM_KEY, platform);
    } catch { /* ignore */ }
  }, [platform]);

  const togglePanel = useCallback((index: number) => {
    setExpandedPanels(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

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

  const allChecked = section.confirmationType === 'checklist'
    && section.checklistItems
    && checkedItems.size === section.checklistItems.length;

  // Build CTA based on confirmation type
  const getCta = () => {
    switch (section.confirmationType) {
      case 'continue':
        return { label: 'Continue', onClick: onComplete };
      case 'success_or_error':
        return { label: 'I did it', onClick: onComplete };
      case 'checklist':
        return { label: 'Continue', onClick: onComplete, disabled: !allChecked };
      default:
        return { label: 'Continue', onClick: onComplete };
    }
  };

  const getSecondaryCta = () => {
    if (section.confirmationType === 'success_or_error' && section.troubleshooting && !showTroubleshooting) {
      return { label: 'I got an error', onClick: () => setShowTroubleshooting(true) };
    }
    return undefined;
  };

  return (
    <LessonStep cta={getCta()} secondaryCta={getSecondaryCta()}>
      <div className="space-y-5">
        {/* Instruction text */}
        <p className="text-[17px] leading-relaxed text-text-secondary whitespace-pre-line">
          {renderInlineCode(section.instruction)}
        </p>

        {/* Platform toggle */}
        {section.platform && (
          <div className="space-y-3">
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setPlatform('mac')}
                className={`px-4 py-2 text-[13px] font-medium transition-all ${
                  platform === 'mac'
                    ? 'bg-purple text-white'
                    : 'bg-bg-card text-text-secondary hover:text-text-primary'
                }`}
              >
                Mac / Linux
              </button>
              <button
                onClick={() => setPlatform('windows')}
                className={`px-4 py-2 text-[13px] font-medium transition-all border-l border-border ${
                  platform === 'windows'
                    ? 'bg-purple text-white'
                    : 'bg-bg-card text-text-secondary hover:text-text-primary'
                }`}
              >
                Windows
              </button>
            </div>

            <div className="bg-bg-elevated rounded-lg px-4 py-3 border border-border/50">
              <p className="text-[15px] text-text-secondary leading-relaxed whitespace-pre-line font-mono">
                {renderInlineCode(section.platform[platform])}
              </p>
            </div>
          </div>
        )}

        {/* Code blocks */}
        {section.codeBlocks && section.codeBlocks.length > 0 && (
          <div className="space-y-3">
            {section.codeBlocks.map((block, i) => (
              <CodeBlock
                key={i}
                code={block.code}
                language={block.language}
                filename={block.filename}
                copyable={block.copyable ?? true}
              />
            ))}
          </div>
        )}

        {/* Expected output */}
        {section.expectedOutput && (
          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wide">
              Expected output:
            </p>
            <div className="bg-bg-elevated rounded-lg px-4 py-3 border border-border/50">
              <pre className="font-mono text-[13px] lg:text-[14px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                {section.expectedOutput}
              </pre>
            </div>
          </div>
        )}

        {/* Checklist items (for checklist confirmation type) */}
        {section.confirmationType === 'checklist' && section.checklistItems && (
          <div className="space-y-2">
            {section.checklistItems.map((item, i) => (
              <button
                key={i}
                onClick={() => toggleCheck(i)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-card border border-border hover:border-border-strong transition-all text-left"
              >
                <span
                  className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all ${
                    checkedItems.has(i)
                      ? 'bg-purple border-purple'
                      : 'bg-bg-elevated border border-border'
                  }`}
                >
                  {checkedItems.has(i) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={`text-[14px] leading-relaxed ${
                  checkedItems.has(i) ? 'text-text-primary' : 'text-text-secondary'
                }`}>
                  {renderInlineCode(item)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Troubleshooting accordion */}
        {showTroubleshooting && section.troubleshooting && section.troubleshooting.length > 0 && (
          <div className="space-y-2 animate-fade-in-up">
            <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wide">
              Troubleshooting
            </p>
            {section.troubleshooting.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-border overflow-hidden bg-bg-card"
              >
                <button
                  onClick={() => togglePanel(i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-elevated/50 transition-colors"
                >
                  <span className="text-[14px] font-medium text-text-primary">
                    {item.problem}
                  </span>
                  <svg
                    className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${
                      expandedPanels.has(i) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedPanels.has(i) && (
                  <div className="px-4 pb-3 border-t border-border/50">
                    <p className="text-[14px] text-text-secondary leading-relaxed pt-3 whitespace-pre-line">
                      {renderInlineCode(item.solution)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </LessonStep>
  );
}
