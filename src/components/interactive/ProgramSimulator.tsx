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
    <div className="space-y-3 animate-fade-in-up">
      <div className="bg-bg-card rounded-xl p-4 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-coral mb-1">Step-through program</p>
        <p className="text-sm text-text-secondary">{section.instruction}</p>
      </div>

      {/* Code */}
      <div className="rounded-xl overflow-hidden border border-[#3D3B65]" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="bg-[#1E1C40] px-3 py-2 flex items-center gap-1.5">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#F6C542]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#48BB78]" />
          </div>
          <span className="text-[#A599E9] text-[10px] font-mono ml-1.5">program.py</span>
        </div>
        <div className="bg-bg-terminal p-3 font-mono text-[13px] overflow-x-auto">
          {section.lines.map((line, i) => (
            <div
              key={i}
              className={`
                px-2 py-0.5 rounded transition-all flex items-center gap-2
                ${i === currentLine ? 'bg-[#F6C542]/15 ring-1 ring-[#F6C542]/30' : ''}
              `}
            >
              <span className="text-[#A599E9] w-4 text-right text-[10px] font-medium flex-shrink-0">{i + 1}</span>
              <span className={`whitespace-nowrap ${
                i === currentLine ? 'text-[#F6C542] font-medium' :
                i < currentLine ? 'text-[#E0DFF5]' :
                'text-[#A599E9]/30'
              }`}>
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Output */}
      {(outputs.length > 0 || waitingForInput) && (
        <div className="rounded-xl overflow-hidden border border-[#3D3B65]">
          <div className="bg-[#1E1C40] px-3 py-1.5">
            <span className="text-[#A599E9] text-[10px] font-mono">output</span>
          </div>
          <div className="bg-bg-terminal p-3 font-mono text-[13px]">
            {outputs.map((output, i) => (
              <div key={i} className="text-[#E0DFF5] leading-relaxed">{output}</div>
            ))}
            {waitingForInput && pendingInteraction && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#F6C542] font-medium">{pendingInteraction.prompt || '>'}</span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                  className="flex-1 bg-transparent text-[#E0DFF5] outline-none caret-[#F6C542] min-w-0"
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
            className="w-full md:w-auto px-6 py-3 bg-coral text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
            style={{ boxShadow: '0 1px 3px rgba(245,101,101,0.2), 0 4px 12px rgba(245,101,101,0.15)' }}
          >
            &#9654; Run Program
          </button>
        )}

        {isStarted && !isFinished && !waitingForInput && (
          <button
            onClick={handleStep}
            className="w-full md:w-auto px-6 py-3 bg-lavender text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Next Step &rarr;
          </button>
        )}

        {waitingForInput && (
          <button
            onClick={handleInputSubmit}
            disabled={!inputValue.trim()}
            className="w-full md:w-auto px-6 py-3 bg-lavender text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={inputValue.trim() ? { boxShadow: 'var(--shadow-button)' } : undefined}
          >
            Submit
          </button>
        )}

        {isFinished && (
          <button
            onClick={onComplete}
            className="w-full md:w-auto px-6 py-3 bg-lavender text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Continue &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
