import { useState, useCallback } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  copyable?: boolean;
}

const KEYWORD_PATTERN = /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|new|this|async|await|try|catch|throw|switch|case|break|default|typeof|instanceof|in|of|true|false|null|undefined|void|cd|ls|mkdir|rm|cp|mv|cat|echo|grep|find|chmod|chown|sudo|apt|brew|npm|npx|git|pip|python|node|def|print|elif|except|finally|with|as|pass|raise|yield|lambda)\b/g;
const STRING_PATTERN = /(["'`])(?:(?!\1|\\).|\\.)*?\1/g;
const COMMENT_PATTERN = /(\/\/.*$|#.*$|\/\*[\s\S]*?\*\/)/gm;
const NUMBER_PATTERN = /\b(\d+\.?\d*)\b/g;

function highlightSyntax(code: string): Array<{ text: string; type: 'plain' | 'keyword' | 'string' | 'comment' | 'number' }> {
  const tokens: Array<{ start: number; end: number; type: 'keyword' | 'string' | 'comment' | 'number' }> = [];

  // Comments first (highest priority)
  let match: RegExpExecArray | null;
  COMMENT_PATTERN.lastIndex = 0;
  while ((match = COMMENT_PATTERN.exec(code)) !== null) {
    tokens.push({ start: match.index, end: match.index + match[0].length, type: 'comment' });
  }

  // Strings
  STRING_PATTERN.lastIndex = 0;
  while ((match = STRING_PATTERN.exec(code)) !== null) {
    tokens.push({ start: match.index, end: match.index + match[0].length, type: 'string' });
  }

  // Keywords
  KEYWORD_PATTERN.lastIndex = 0;
  while ((match = KEYWORD_PATTERN.exec(code)) !== null) {
    tokens.push({ start: match.index, end: match.index + match[0].length, type: 'keyword' });
  }

  // Numbers
  NUMBER_PATTERN.lastIndex = 0;
  while ((match = NUMBER_PATTERN.exec(code)) !== null) {
    tokens.push({ start: match.index, end: match.index + match[0].length, type: 'number' });
  }

  // Sort by start position, higher priority types first for overlap resolution
  const priority: Record<string, number> = { comment: 4, string: 3, keyword: 2, number: 1 };
  tokens.sort((a, b) => a.start - b.start || priority[b.type] - priority[a.type]);

  // Remove overlapping tokens (keep higher priority)
  const filtered: typeof tokens = [];
  let lastEnd = 0;
  for (const token of tokens) {
    if (token.start >= lastEnd) {
      filtered.push(token);
      lastEnd = token.end;
    }
  }

  // Build result
  const result: Array<{ text: string; type: 'plain' | 'keyword' | 'string' | 'comment' | 'number' }> = [];
  let pos = 0;
  for (const token of filtered) {
    if (token.start > pos) {
      result.push({ text: code.slice(pos, token.start), type: 'plain' });
    }
    result.push({ text: code.slice(token.start, token.end), type: token.type });
    pos = token.end;
  }
  if (pos < code.length) {
    result.push({ text: code.slice(pos), type: 'plain' });
  }

  return result;
}

const TYPE_COLORS: Record<string, string> = {
  plain: 'text-[#F0ECE4]',
  keyword: 'text-purple',
  string: 'text-[#6ABF69]',
  comment: 'text-text-muted',
  number: 'text-[#D4A843]',
};

export function CodeBlock({ code, language, filename, copyable = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const lines = code.split('\n');
  const showLineNumbers = lines.length > 1;

  return (
    <div className="rounded-lg overflow-hidden border border-white/5">
      {/* Header bar */}
      {(filename || language || copyable) && (
        <div className="flex items-center justify-between bg-[#38352F] px-4 py-2">
          <div className="flex items-center gap-3">
            {/* Traffic light dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] opacity-70" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E] opacity-70" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840] opacity-70" />
            </div>
            {filename && (
              <span className="text-[12px] font-mono text-[#F0ECE4]/60">{filename}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {language && (
              <span className="text-[11px] font-mono text-[#F0ECE4]/40 uppercase tracking-wide">{language}</span>
            )}
            {copyable && (
              <button
                onClick={handleCopy}
                className="text-[12px] font-mono text-[#F0ECE4]/50 hover:text-[#F0ECE4]/80 transition-colors px-2 py-0.5 rounded hover:bg-white/5"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Code body */}
      <div className="bg-[#2D2B28] overflow-x-auto">
        <div className="p-4 font-mono text-[13px] lg:text-[14px] leading-relaxed">
          {lines.map((line, lineIdx) => {
            const tokens = highlightSyntax(line);
            return (
              <div key={lineIdx} className="flex">
                {showLineNumbers && (
                  <span className="select-none text-[#F0ECE4]/20 text-right pr-4 min-w-[2.5rem] flex-shrink-0">
                    {lineIdx + 1}
                  </span>
                )}
                <span className="flex-1 whitespace-pre-wrap break-all">
                  {tokens.length === 0 ? '\u00A0' : tokens.map((token, ti) => (
                    <span key={ti} className={TYPE_COLORS[token.type]}>
                      {token.text}
                    </span>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
