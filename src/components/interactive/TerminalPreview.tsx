import { useState, useEffect, useRef } from 'react';
import type { TerminalPreviewSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';

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

  function skipToEnd() {
    setVisibleLines(section.lines.length);
    setTypingIndex(0);
    setCurrentText('');
  }

  const cta = allDone
    ? { label: 'Continue', onClick: onComplete }
    : { label: 'Skip', onClick: skipToEnd };

  return (
    <LessonStep cta={cta}>
      <div className="space-y-4">
        <p className="text-[17px] text-text-secondary leading-relaxed">
          {section.instruction}
        </p>

        {/* Terminal */}
        <div className="rounded-xl overflow-hidden border border-[#3D3A36]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <div className="bg-[#38352F] px-3.5 py-2.5 flex items-center gap-1.5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#E85B4A]" />
              <div className="w-3 h-3 rounded-full bg-[#D4A843]" />
              <div className="w-3 h-3 rounded-full bg-[#4DA656]" />
            </div>
            <span className="text-[#7A756C] text-[11px] font-mono ml-2">terminal</span>
          </div>

          <div
            ref={containerRef}
            className="bg-bg-terminal p-4 font-mono text-[13px] min-h-[160px] max-h-[260px] overflow-y-auto overflow-x-auto"
            role="log"
            aria-live="polite"
            aria-label="Terminal output"
          >
            {completedLines.map((line, i) => (
              <div key={i} className="leading-relaxed">
                {line.type === 'command' ? (
                  <div className="whitespace-nowrap">
                    <span className="text-[#6ABF69] font-medium">$ </span>
                    <span className="text-[#F0ECE4]">{line.text}</span>
                  </div>
                ) : (
                  <div className="text-[#A8A196] pl-3 whitespace-pre-wrap">{line.text}</div>
                )}
              </div>
            ))}

            {!allDone && currentLine?.type === 'command' && (
              <div className="leading-relaxed whitespace-nowrap">
                <span className="text-[#6ABF69] font-medium">$ </span>
                <span className="text-[#F0ECE4]">{currentText}</span>
                {isTyping && <span className="animate-pulse text-[#D4A843] font-bold">|</span>}
              </div>
            )}
            {!allDone && currentLine?.type === 'output' && visibleLines > 0 && (
              <div className="text-[#A8A196] pl-3 leading-relaxed">{currentText}</div>
            )}
          </div>
        </div>

        {/* Annotations */}
        {completedLines.filter((l) => l.annotation).length > 0 && (
          <div className="space-y-2">
            {completedLines.filter((l) => l.annotation).map((line, i) => (
              <div key={i} role="note" className="bg-blue-soft rounded-xl px-4 py-3.5 animate-fade-in-up">
                <div className="flex items-start gap-2.5">
                  <span className="text-sm flex-shrink-0 mt-0.5">&#128172;</span>
                  <div className="min-w-0">
                    {line.type === 'command' && (
                      <code className="text-[11px] font-mono font-medium text-purple bg-purple-soft px-1.5 py-0.5 rounded-md inline-block mb-1">
                        $ {line.text}
                      </code>
                    )}
                    <p className="text-[15px] text-text-secondary leading-relaxed">{line.annotation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LessonStep>
  );
}
