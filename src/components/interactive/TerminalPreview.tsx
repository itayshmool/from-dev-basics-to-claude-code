import { useState, useEffect, useRef } from 'react';
import type { TerminalPreviewSection } from '../../core/lesson/types';

interface TerminalPreviewProps {
  section: TerminalPreviewSection;
  onComplete: () => void;
}

export function TerminalPreview({ section, onComplete }: TerminalPreviewProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLine = section.lines[visibleLines];
  const isTyping = currentLine?.type === 'command' && typingIndex < (currentLine?.text.length ?? 0);
  const allDone = visibleLines >= section.lines.length;

  useEffect(() => {
    if (!currentLine || currentLine.type !== 'command') {
      if (currentLine && visibleLines < section.lines.length) {
        setCurrentText(currentLine.text);
        const timer = setTimeout(() => {
          setVisibleLines((v) => v + 1);
          setTypingIndex(0);
          setCurrentText('');
        }, 600);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (typingIndex < currentLine.text.length) {
      const timer = setTimeout(() => {
        setCurrentText(currentLine.text.slice(0, typingIndex + 1));
        setTypingIndex(typingIndex + 1);
      }, 40);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setVisibleLines((v) => v + 1);
      setTypingIndex(0);
      setCurrentText('');
    }, 800);
    return () => clearTimeout(timer);
  }, [visibleLines, typingIndex, currentLine, section.lines.length]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, [visibleLines, currentText]);

  const completedLines = section.lines.slice(0, visibleLines);

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="bg-bg-card rounded-xl p-4 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-teal mb-1">Terminal Preview</p>
        <p className="text-sm text-text-secondary">{section.instruction}</p>
      </div>

      {/* Terminal window */}
      <div className="rounded-xl overflow-hidden border border-[#3D3B65]" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="bg-[#1E1C40] px-3 py-2 flex items-center gap-1.5">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#F6C542]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#48BB78]" />
          </div>
          <span className="text-[#A599E9] text-[10px] font-mono ml-1.5">terminal</span>
        </div>

        <div
          ref={containerRef}
          className="bg-bg-terminal p-3 font-mono text-[13px] min-h-[160px] max-h-[260px] overflow-y-auto overflow-x-auto"
        >
          {completedLines.map((line, i) => (
            <div key={i} className="leading-relaxed">
              {line.type === 'command' ? (
                <div className="whitespace-nowrap">
                  <span className="text-[#48BB78] font-medium">$ </span>
                  <span className="text-[#E0DFF5]">{line.text}</span>
                </div>
              ) : (
                <div className="text-[#A599E9] pl-3 whitespace-pre-wrap">{line.text}</div>
              )}
            </div>
          ))}

          {!allDone && currentLine?.type === 'command' && (
            <div className="leading-relaxed whitespace-nowrap">
              <span className="text-[#48BB78] font-medium">$ </span>
              <span className="text-[#E0DFF5]">{currentText}</span>
              {isTyping && <span className="animate-pulse text-[#F6C542] font-bold">|</span>}
            </div>
          )}
          {!allDone && currentLine?.type === 'output' && visibleLines > 0 && (
            <div className="text-[#A599E9] pl-3 leading-relaxed">{currentText}</div>
          )}
        </div>
      </div>

      {/* Annotations */}
      {completedLines.filter((l) => l.annotation).length > 0 && (
        <div className="space-y-2">
          {completedLines.filter((l) => l.annotation).map((line, i) => (
            <div key={i} className="bg-sky-light border border-sky/15 rounded-xl px-3.5 py-3 animate-fade-in-up">
              <div className="flex items-start gap-2.5">
                <span className="text-sm flex-shrink-0 mt-0.5">&#128172;</span>
                <div className="min-w-0">
                  {line.type === 'command' && (
                    <code className="text-[11px] font-mono font-medium text-lavender bg-lavender-light px-1 py-0.5 rounded inline-block mb-1">
                      $ {line.text}
                    </code>
                  )}
                  <p className="text-sm text-text-secondary leading-relaxed">{line.annotation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {allDone && (
        <button
          onClick={onComplete}
          className="w-full md:w-auto px-6 py-3 bg-lavender text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
          style={{ boxShadow: 'var(--shadow-button)' }}
        >
          Continue &rarr;
        </button>
      )}
    </div>
  );
}
