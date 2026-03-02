import { useState } from 'react';
import type { ProgramSimSection } from '../../core/lesson/types';

interface ProgramSimulatorProps {
  section: ProgramSimSection;
  onComplete: () => void;
}

export function ProgramSimulator({ section, onComplete }: ProgramSimulatorProps) {
  const [currentLine, setCurrentLine] = useState(-1);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [userInputs, setUserInputs] = useState<Record<number, string>>({});
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [pendingInteraction, setPendingInteraction] = useState<(typeof section.interactions)[0] | null>(null);

  const isFinished = currentLine >= section.lines.length && !waitingForInput;
  const isStarted = currentLine >= 0;

  function processInteractionsAfterLine(lineIndex: number) {
    const interaction = section.interactions.find((i) => i.afterLine === lineIndex);
    if (interaction) {
      if (interaction.type === 'input') {
        setWaitingForInput(true);
        setPendingInteraction(interaction);
      } else if (interaction.type === 'display') {
        let text = interaction.value || '';
        Object.entries(userInputs).forEach(([, val]) => {
          text = text.replace('{input}', val);
        });
        setOutputs((prev) => [...prev, text]);
      }
    }
  }

  function handleStep() {
    const nextLine = currentLine + 1;
    if (nextLine >= section.lines.length) {
      setCurrentLine(nextLine);
      return;
    }
    setCurrentLine(nextLine);
    processInteractionsAfterLine(nextLine);
  }

  function handleInputSubmit() {
    if (!pendingInteraction) return;
    const val = inputValue.trim();
    setUserInputs((prev) => ({ ...prev, [pendingInteraction!.afterLine]: val }));
    setWaitingForInput(false);
    setPendingInteraction(null);
    setInputValue('');

    const displayAfter = section.interactions.find(
      (i) => i.type === 'display' && i.afterLine > (pendingInteraction?.afterLine ?? -1)
    );
    if (displayAfter) {
      let text = displayAfter.value || '';
      text = text.replace('{input}', val);
      setOutputs((prev) => [...prev, text]);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="bg-bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-coral mb-1">Step-through program</p>
        <p className="text-sm text-text-secondary">{section.instruction}</p>
      </div>

      {/* Code display */}
      <div className="rounded-2xl overflow-hidden border border-[#3D3B65]" style={{ boxShadow: '0 8px 32px rgba(45,43,85,0.3)' }}>
        <div className="bg-[#1E1C40] px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF6B6B]" />
            <div className="w-3 h-3 rounded-full bg-[#FAD000]" />
            <div className="w-3 h-3 rounded-full bg-[#7EC699]" />
          </div>
          <span className="text-[#A599E9] text-xs font-mono ml-2">program.py</span>
        </div>
        <div className="bg-[#2D2B55] p-4 font-mono text-sm">
          {section.lines.map((line, i) => (
            <div
              key={i}
              className={`
                px-3 py-1 rounded-lg transition-all flex items-center gap-3
                ${i === currentLine ? 'bg-[#FAD000]/20 ring-1 ring-[#FAD000]/40' : ''}
              `}
            >
              <span className="text-[#A599E9] w-5 text-right text-xs font-bold">{i + 1}</span>
              <span className={`
                ${i === currentLine ? 'text-[#FAD000] font-bold' : ''}
                ${i < currentLine ? 'text-[#E0DFF5]' : ''}
                ${i > currentLine ? 'text-[#A599E9]/40' : ''}
              `}>
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Output area */}
      {(outputs.length > 0 || waitingForInput) && (
        <div className="rounded-2xl overflow-hidden border border-[#3D3B65]">
          <div className="bg-[#1E1C40] px-4 py-2 flex items-center">
            <span className="text-[#A599E9] text-xs font-mono">output</span>
          </div>
          <div className="bg-[#2D2B55] p-4 font-mono text-sm">
            {outputs.map((output, i) => (
              <div key={i} className="text-[#E0DFF5] leading-relaxed">{output}</div>
            ))}
            {waitingForInput && pendingInteraction && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#FAD000] font-bold">{pendingInteraction.prompt || '>'}</span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                  className="flex-1 bg-transparent text-[#E0DFF5] outline-none caret-[#FAD000]"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isStarted && (
          <button
            onClick={handleStep}
            className="px-7 py-2.5 bg-coral text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            &#9654; Run Program
          </button>
        )}

        {isStarted && !isFinished && !waitingForInput && (
          <button
            onClick={handleStep}
            className="px-7 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Next Step &rarr;
          </button>
        )}

        {waitingForInput && (
          <button
            onClick={handleInputSubmit}
            disabled={!inputValue.trim()}
            className="px-7 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={inputValue.trim() ? { boxShadow: 'var(--shadow-button)' } : undefined}
          >
            Submit
          </button>
        )}

        {isFinished && (
          <button
            onClick={onComplete}
            className="px-7 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Continue &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
