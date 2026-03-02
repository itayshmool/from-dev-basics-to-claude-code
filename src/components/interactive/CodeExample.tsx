import { useState } from 'react';
import type { CodeExampleSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';

interface CodeExampleProps {
  section: CodeExampleSection;
  onComplete: () => void;
}

function highlightCode(code: string, language: string): string {
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments (must come before strings to avoid conflicts)
  result = result.replace(/(\/\/.*$)/gm, '<span class="text-text-muted italic">$1</span>');
  result = result.replace(/(#.*$)/gm, '<span class="text-text-muted italic">$1</span>');

  // Multi-line comments
  result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-text-muted italic">$1</span>');

  // Strings (double quotes, single quotes, backticks)
  result = result.replace(/(&quot;.*?&quot;|'.*?'|`.*?`)/g, '<span class="text-green">$1</span>');

  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-yellow">$1</span>');

  // Keywords
  const keywords = [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'import', 'export', 'from', 'class', 'new', 'this', 'def', 'print',
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE',
    'async', 'await', 'require', 'true', 'false', 'null', 'undefined',
    'try', 'catch', 'throw', 'finally', 'switch', 'case', 'break', 'default',
    'type', 'interface', 'extends', 'implements', 'static', 'public', 'private',
    'protected', 'readonly', 'abstract', 'enum', 'module', 'namespace',
  ];
  for (const kw of keywords) {
    result = result.replace(
      new RegExp(`\\b(${kw})\\b`, 'g'),
      '<span class="text-purple font-medium">$1</span>'
    );
  }

  // Language-specific: SQL keywords (uppercase)
  if (language.toLowerCase() === 'sql') {
    const sqlKeywords = [
      'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'AS', 'ON', 'JOIN',
      'LEFT', 'RIGHT', 'INNER', 'OUTER', 'GROUP', 'BY', 'ORDER',
      'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG',
      'ALTER', 'DROP', 'SET', 'VALUES', 'INTO',
    ];
    for (const kw of sqlKeywords) {
      result = result.replace(
        new RegExp(`\\b(${kw})\\b`, 'g'),
        '<span class="text-purple font-medium">$1</span>'
      );
    }
  }

  return result;
}

export function CodeExample({ section, onComplete }: CodeExampleProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const hasMultipleBlocks = section.blocks.length > 1;
  const currentBlock = section.blocks[activeTab];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(currentBlock.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text approach (clipboard API may not be available)
    }
  }

  return (
    <LessonStep cta={{ label: 'Continue', onClick: onComplete }}>
      <div className="space-y-5">
        {/* Instruction */}
        <h3 className="text-xl font-bold text-text-primary leading-snug">
          {section.instruction}
        </h3>

        {/* Tabs (if multiple blocks) */}
        {hasMultipleBlocks && (
          <div className="flex gap-1 bg-bg-card rounded-lg p-1 border border-border">
            {section.blocks.map((block, i) => (
              <button
                key={i}
                onClick={() => { setActiveTab(i); setCopied(false); }}
                className={`
                  flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition-all
                  ${activeTab === i
                    ? 'bg-bg-elevated text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
                  }
                `}
              >
                {block.label || block.language}
              </button>
            ))}
          </div>
        )}

        {/* Code block */}
        <div className="rounded-xl overflow-hidden border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#38352F] border-b border-white/5">
            <span className="text-xs font-mono text-[#7A756C] uppercase tracking-wider">
              {currentBlock.language}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-[#7A756C] hover:text-[#F0ECE4] transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Code content */}
          <div className="bg-[#2D2B28] overflow-x-auto">
            <pre className="px-4 py-4 text-[14px] leading-relaxed font-mono">
              <code
                className="text-[#F0ECE4]"
                dangerouslySetInnerHTML={{ __html: highlightCode(currentBlock.code, currentBlock.language) }}
              />
            </pre>
          </div>
        </div>

        {/* Explanation */}
        {section.explanation && (
          <div className="bg-bg-card rounded-xl border border-border px-4 py-4 animate-fade-in-up">
            <p className="text-[15px] text-text-secondary leading-relaxed">
              {section.explanation}
            </p>
          </div>
        )}
      </div>
    </LessonStep>
  );
}
