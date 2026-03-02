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

  // Typewriter effect for commands
  useEffect(() => {
    if (!currentLine || currentLine.type !== 'command') {
      // Output lines appear instantly
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

    // Command fully typed, pause then move to next
    const timer = setTimeout(() => {
      setVisibleLines((v) => v + 1);
      setTypingIndex(0);
      setCurrentText('');
    }, 800);
    return () => clearTimeout(timer);
  }, [visibleLines, typingIndex, currentLine, section.lines.length]);

  // Auto-scroll
  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, [visibleLines, currentText]);

  // Completed lines (before the one currently typing)
  const completedLines = section.lines.slice(0, visibleLines);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="bg-bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-teal mb-1">Terminal Preview</p>
        <p className="text-sm text-text-secondary">{section.instruction}</p>
      </div>

      {/* Terminal window */}
      <div className="rounded-2xl overflow-hidden border border-[#3D3B65]" style={{ boxShadow: '0 8px 32px rgba(45,43,85,0.3)' }}>
        {/* Title bar */}
        <div className="bg-[#1E1C40] px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF6B6B]" />
            <div className="w-3 h-3 rounded-full bg-[#FAD000]" />
            <div className="w-3 h-3 rounded-full bg-[#7EC699]" />
          </div>
          <span className="text-[#A599E9] text-xs font-mono ml-2">terminal</span>
        </div>

        {/* Terminal body */}
        <div
          ref={containerRef}
          className="bg-[#2D2B55] p-4 font-mono text-sm min-h-[200px] max-h-[300px] overflow-y-auto"
        >
          {completedLines.map((line, i) => (
            <div key={i} className="leading-relaxed">
              {line.type === 'command' ? (
                <div>
                  <span className="text-[#7EC699] font-bold">$ </span>
                  <span className="text-[#E0DFF5]">{line.text}</span>
                </div>
              ) : (
                <div className="text-[#A599E9] pl-4">{line.text}</div>
              )}
            </div>
          ))}

          {/* Currently typing line */}
          {!allDone && currentLine?.type === 'command' && (
            <div className="leading-relaxed">
              <span className="text-[#7EC699] font-bold">$ </span>
              <span className="text-[#E0DFF5]">{currentText}</span>
              {isTyping && <span className="animate-pulse text-[#FAD000] font-bold">|</span>}
            </div>
          )}
          {!allDone && currentLine?.type === 'output' && visibleLines > 0 && (
            <div className="text-[#A599E9] pl-4 leading-relaxed">{currentText}</div>
          )}
        </div>
      </div>

      {/* Annotations */}
      {completedLines.filter((l) => l.annotation).length > 0 && (
        <div className="space-y-2">
          {completedLines.filter((l) => l.annotation).map((line, i) => (
            <div key={i} className="flex items-start gap-3 bg-sky-light border border-sky/20 rounded-2xl px-4 py-3 animate-fade-in-up">
              <span className="text-lg flex-shrink-0">&#128172;</span>
              <div>
                {line.type === 'command' && (
                  <code className="text-xs font-mono font-bold text-lavender bg-lavender-light px-1.5 py-0.5 rounded-md">
                    $ {line.text}
                  </code>
                )}
                <p className="text-sm text-text-secondary mt-1">{line.annotation}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {allDone && (
        <button
          onClick={onComplete}
          className="px-7 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97]"
          style={{ boxShadow: 'var(--shadow-button)' }}
        >
          Continue &rarr;
        </button>
      )}
    </div>
  );
}
