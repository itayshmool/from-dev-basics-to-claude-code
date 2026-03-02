import { useState, useCallback } from 'react';
import type { PromptTemplateSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';

interface PromptTemplateProps {
  section: PromptTemplateSection;
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

function renderPromptWithPlaceholders(prompt: string) {
  // Split on {{placeholder}} patterns, preserving the delimiters
  const parts = prompt.split(/({{[^}]+}})/g);
  return parts.map((part, i) => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      const token = part.slice(2, -2);
      return (
        <span key={i} className="text-purple bg-purple-soft px-1.5 py-0.5 rounded font-semibold">
          {'{{'}{token}{'}}'}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function PromptTemplate({ section, onComplete }: PromptTemplateProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(section.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = section.prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [section.prompt]);

  return (
    <LessonStep cta={{ label: 'Continue', onClick: onComplete }}>
      <div className="space-y-5">
        {/* Instruction */}
        <p className="text-[17px] leading-relaxed text-text-secondary whitespace-pre-line">
          {renderInlineCode(section.instruction)}
        </p>

        {/* Prompt block */}
        <div className="space-y-2">
          <div className="bg-bg-elevated rounded-lg border border-border/50 overflow-hidden">
            {/* Header with copy button */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
              <span className="text-[12px] font-semibold text-text-muted uppercase tracking-wide">
                Prompt
              </span>
              <button
                onClick={handleCopy}
                className="text-[12px] font-mono text-text-muted hover:text-text-primary transition-colors px-2 py-0.5 rounded hover:bg-white/5"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {/* Prompt content */}
            <div className="px-4 py-3">
              <pre className="font-mono text-[13px] lg:text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap">
                {renderPromptWithPlaceholders(section.prompt)}
              </pre>
            </div>
          </div>
        </div>

        {/* Placeholder legend */}
        {section.placeholders && section.placeholders.length > 0 && (
          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wide">
              Placeholders
            </p>
            <div className="space-y-1.5">
              {section.placeholders.map((placeholder, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[14px]">
                  <span className="text-purple bg-purple-soft px-1.5 py-0.5 rounded font-mono text-[12px] font-semibold flex-shrink-0 mt-0.5">
                    {'{{'}{placeholder.token}{'}}'}
                  </span>
                  <span className="text-text-secondary leading-relaxed">
                    {placeholder.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expected result */}
        {section.expectedResult && (
          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wide">
              What you should see:
            </p>
            <div className="bg-bg-elevated rounded-lg px-4 py-3 border border-border/50">
              <pre className="font-mono text-[13px] lg:text-[14px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                {section.expectedResult}
              </pre>
            </div>
          </div>
        )}
      </div>
    </LessonStep>
  );
}
