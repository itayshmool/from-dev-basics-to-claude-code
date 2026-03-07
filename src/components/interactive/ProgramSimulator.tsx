import { useState } from 'react';
import type { ProgramSimSection } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';

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
  const [processedInteractions, setProcessedInteractions] = useState<Set<number>>(new Set());

  const isFinished = currentLine >= section.lines.length && !waitingForInput;
  const isStarted = currentLine >= 0;

  function processInteractionsAfterLine(lineIndex: number) {
    const interactionIndex = section.interactions.findIndex((i) => i.afterLine === lineIndex);
    if (interactionIndex === -1 || processedInteractions.has(interactionIndex)) return;
    const interaction = section.interactions[interactionIndex];
    setProcessedInteractions((prev) => new Set(prev).add(interactionIndex));
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

    const displayIndex = section.interactions.findIndex(
      (i) => i.type === 'display' && i.afterLine > (pendingInteraction?.afterLine ?? -1)
    );
    if (displayIndex !== -1 && !processedInteractions.has(displayIndex)) {
      setProcessedInteractions((prev) => new Set(prev).add(displayIndex));
      let text = section.interactions[displayIndex].value || '';
      text = text.replace('{input}', val);
      setOutputs((prev) => [...prev, text]);
    }
  }

  const cta = !isStarted
    ? { label: '\u25B6 Run Program', onClick: handleStep }
    : isStarted && !isFinished && !waitingForInput
      ? { label: 'Next Step', onClick: handleStep }
      : waitingForInput
        ? { label: 'Submit', onClick: handleInputSubmit, disabled: !inputValue.trim() }
        : isFinished
          ? { label: 'Continue', onClick: onComplete }
          : undefined;

  // Keyboard shortcut to step through program
  function handleContainerKeyDown(e: React.KeyboardEvent) {
    // Don't capture keys when typing in input
    if (e.target instanceof HTMLInputElement) return;
    if ((e.key === 'n' || e.key === ' ') && isStarted && !isFinished && !waitingForInput) {
      e.preventDefault();
      handleStep();
    }
  }

  return (
    <LessonStep cta={cta}>
      <div
        className="space-y-4 outline-none"
        tabIndex={0}
        onKeyDown={handleContainerKeyDown}
        aria-label="Program simulator. Press Space or N to advance to next step."
      >
        <p className="text-[17px] text-text-secondary leading-relaxed">
          {section.instruction}
        </p>

        {/* Code */}
        <div className="rounded-xl overflow-hidden border border-[#3D3A36]" role="region" aria-label="Program code" aria-live="polite" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <div className="bg-[#38352F] px-3.5 py-2.5 flex items-center gap-1.5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#E85B4A]" />
              <div className="w-3 h-3 rounded-full bg-[#D4A843]" />
              <div className="w-3 h-3 rounded-full bg-[#4DA656]" />
            </div>
            <span className="text-[#7A756C] text-[11px] font-mono ml-2">program.py</span>
          </div>
          <div className="bg-bg-terminal p-3.5 font-mono text-[13px] overflow-x-auto">
            {section.lines.map((line, i) => (
              <div
                key={i}
                aria-current={i === currentLine ? 'step' : undefined}
                className={`
                  px-2.5 py-0.5 rounded-lg transition-all flex items-center gap-2.5
                  ${i === currentLine ? 'bg-[#D4A843]/10 ring-1 ring-[#D4A843]/30' : ''}
                `}
              >
                <span className="text-[#7A756C] w-4 text-right text-[10px] font-medium flex-shrink-0">{i + 1}</span>
                <span className={`whitespace-nowrap ${
                  i === currentLine ? 'text-[#D4A843] font-medium' :
                  i < currentLine ? 'text-[#F0ECE4]' :
                  'text-[#7A756C]/30'
                }`}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        {(outputs.length > 0 || waitingForInput) && (
          <div className="rounded-xl overflow-hidden border border-[#3D3A36]">
            <div className="bg-[#38352F] px-3.5 py-2">
              <span className="text-[#7A756C] text-[11px] font-mono">output</span>
            </div>
            <div className="bg-bg-terminal p-3.5 font-mono text-[13px]" role="log" aria-live="polite" aria-label="Program output">
              {outputs.map((output, i) => (
                <div key={i} className="text-[#F0ECE4] leading-relaxed">{output}</div>
              ))}
              {waitingForInput && pendingInteraction && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#D4A843] font-medium">{pendingInteraction.prompt || '>'}</span>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                    aria-label={pendingInteraction?.prompt || 'Program input'}
                    className="flex-1 bg-transparent text-[#F0ECE4] outline-none caret-[#D4A843] min-w-0"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </LessonStep>
  );
}
