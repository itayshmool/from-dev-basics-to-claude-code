import { useState, useCallback } from 'react';
import type { TerminalStepSection } from '../../core/lesson/types';
import type { VirtualFileSystem } from '../../core/vfs/VirtualFileSystem';
import { useTerminal } from '../../core/terminal/TerminalContext';
import { Terminal } from './terminal/Terminal';
import { FileExplorer } from './terminal/FileExplorer';
import { CommandReferenceBar } from './terminal/CommandReferenceBar';
import { CelebrationOverlay } from '../lesson/CelebrationOverlay';

interface TerminalStepProps {
  section: TerminalStepSection;
  onComplete: () => void;
  commands?: string[];
}

function checkValidation(
  validation: TerminalStepSection['validation'],
  lastCommand: string,
  lastOutput: string,
  vfs: VirtualFileSystem,
): boolean {
  switch (validation.type) {
    case 'exactCommand':
      return lastCommand.trim() === (validation.value as string).trim();
    case 'commandStartsWith':
      return lastCommand.trim().startsWith((validation.value as string).trim());
    case 'outputContains':
      return lastOutput.includes(validation.value as string);
    case 'fileExists':
      return vfs.isFile(validation.value as string);
    case 'directoryExists':
      return vfs.isDir(validation.value as string);
    case 'fileContains': {
      const { path, content } = validation.value as { path: string; content: string };
      const fileContent = vfs.readFile(path);
      return fileContent !== null && fileContent.includes(content);
    }
    case 'fsStateMatch':
      return matchFsState(vfs, validation.value as Record<string, unknown>);
    default:
      return false;
  }
}

function matchFsState(vfs: VirtualFileSystem, expected: Record<string, unknown>): boolean {
  function check(spec: Record<string, unknown>, basePath: string): boolean {
    for (const [name, value] of Object.entries(spec)) {
      const fullPath = basePath === '/' ? '/' + name : basePath + '/' + name;
      if (typeof value === 'string') {
        if (!vfs.isFile(fullPath)) return false;
      } else if (typeof value === 'object' && value !== null) {
        if (!vfs.isDir(fullPath)) return false;
        if (!check(value as Record<string, unknown>, fullPath)) return false;
      }
    }
    return true;
  }
  return check(expected, '');
}

export function TerminalStep({ section, onComplete, commands = [] }: TerminalStepProps) {
  const { vfs, fsVersion } = useTerminal();
  const [validated, setValidated] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [highlightPath, setHighlightPath] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [cwd, setCwd] = useState(vfs.getCwd());

  const isFreeMode = section.freeMode ?? false;
  const hints = section.hints ?? [];

  const handleCommand = useCallback((command: string, output: string, isError: boolean) => {
    // Always update cwd after any command (fixes file tree not updating after cd)
    setCwd(vfs.getCwd());

    if (validated) return;

    // Skip validation on error commands unless the section expects an error
    if (isError && !section.expectError) return;

    const isValid = checkValidation(section.validation, command, output, vfs);

    if (isValid || (section.expectError && command.trim() === (section.validation.value as string).trim())) {
      setValidated(true);
      setShowCelebration(true);
      if (section.onSuccess.highlightExplorer) {
        setHighlightPath(section.onSuccess.highlightExplorer);
      }
    }
  }, [validated, section, vfs]);

  const handleCelebrationDone = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const handleShowHint = () => {
    setShowHint(true);
    if (hintIndex < hints.length - 1) {
      setHintIndex((i) => i + 1);
    }
  };

  // For free mode, allow checking manually
  const handleCheck = useCallback(() => {
    const isValid = checkValidation(section.validation, '', '', vfs);
    if (isValid) {
      setValidated(true);
      setShowCelebration(true);
    }
  }, [section.validation, vfs]);

  const tree = vfs.toJSON('/');

  return (
    <div className="h-full flex flex-col w-full">
      {showCelebration && <CelebrationOverlay onDone={handleCelebrationDone} />}

      {/* Instruction + command reference */}
      <div className="px-6 md:px-8 lg:px-12 xl:px-16 pt-5 pb-3 space-y-3 flex-shrink-0">
        {section.contextMessage && (
          <div className="bg-blue-soft rounded-lg px-4 py-3 max-w-3xl border border-blue/10">
            <p className="text-[13px] text-text-secondary leading-relaxed">{section.contextMessage}</p>
          </div>
        )}
        <div className="text-[15px] lg:text-[17px] text-text-secondary leading-relaxed whitespace-pre-line max-w-3xl">
          {section.instruction.split('`').map((part, i) =>
            i % 2 === 0 ? part : (
              <code key={i} className="text-[13px] lg:text-[15px] font-mono font-medium text-purple bg-purple-soft px-1.5 py-0.5 rounded">
                {part}
              </code>
            )
          )}
        </div>

        {!validated && !isFreeMode && (
          <div className="bg-blue-soft rounded-lg px-4 py-3 max-w-3xl border border-blue/10">
            <p className="text-[14px] lg:text-[16px] text-text-primary leading-relaxed">
              {section.prompt.split('`').map((part, i) =>
                i % 2 === 0 ? part : (
                  <code key={i} className="text-[12px] lg:text-[14px] font-mono font-medium text-purple bg-purple-soft px-1.5 py-0.5 rounded">
                    {part}
                  </code>
                )
              )}
            </p>
          </div>
        )}

        {commands.length > 0 && (
          <CommandReferenceBar commands={commands} />
        )}
      </div>

      {/* Main content: terminal + file explorer */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 xl:px-14 pb-2">
        <div className="flex flex-col md:flex-row gap-3 md:h-full">
          {/* Terminal */}
          <div className="min-w-0 flex-1">
            <Terminal onCommandExecuted={handleCommand} disabled={validated && !isFreeMode} />
          </div>

          {/* File explorer */}
          <div className="md:w-72 lg:w-80 xl:w-96 flex-shrink-0">
            <FileExplorer
              key={fsVersion}
              tree={tree}
              cwd={cwd}
              homePath={vfs.getHome()}
              highlightPath={highlightPath}
            />
          </div>
        </div>
      </div>

      {/* Hints for free mode */}
      {isFreeMode && showHint && hints.length > 0 && (
        <div className="px-6 md:px-8 lg:px-12 xl:px-16 pb-2">
          <div className="bg-yellow-soft rounded-lg px-4 py-3 max-w-3xl border border-yellow/10">
            <p className="text-[13px] lg:text-[15px] text-text-secondary leading-relaxed">
              <span className="font-semibold font-mono text-yellow">hint:</span> {hints[hintIndex]}
            </p>
          </div>
        </div>
      )}

      {/* Success message */}
      {validated && (
        <div className="px-6 md:px-8 lg:px-12 xl:px-16 pb-2 animate-fade-in-up">
          <div className="bg-green-soft rounded-lg px-4 py-3 max-w-3xl border border-green/10">
            <p className="text-[14px] lg:text-[16px] text-text-primary leading-relaxed whitespace-pre-line">
              {section.onSuccess.message.split('`').map((part, i) =>
                i % 2 === 0 ? part : (
                  <code key={i} className="text-[12px] lg:text-[14px] font-mono font-medium text-purple bg-purple-soft px-1.5 py-0.5 rounded">
                    {part}
                  </code>
                )
              )}
            </p>
          </div>
        </div>
      )}

      {/* Bottom CTA bar */}
      <div className="flex-shrink-0 border-t border-border bg-bg-primary/80 backdrop-blur-sm px-6 md:px-8 lg:px-12 xl:px-16 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] flex gap-3">
        {validated ? (
          <button
            onClick={onComplete}
            className="flex-1 bg-purple text-white font-semibold py-3 rounded-lg text-[14px] lg:text-[16px] transition-all active:scale-[0.98] hover:brightness-110"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Continue
          </button>
        ) : isFreeMode ? (
          <>
            {hints.length > 0 && (
              <button
                onClick={handleShowHint}
                className="bg-bg-card text-text-secondary font-medium py-3 px-5 rounded-lg text-[14px] lg:text-[16px] border border-border hover:border-border-strong transition-all active:scale-[0.98]"
              >
                {showHint && hintIndex < hints.length - 1 ? 'Next Hint' : 'Show Hint'}
              </button>
            )}
            <button
              onClick={handleCheck}
              className="flex-1 bg-purple text-white font-semibold py-3 rounded-lg text-[14px] lg:text-[16px] transition-all active:scale-[0.98] hover:brightness-110"
              style={{ boxShadow: 'var(--shadow-button)' }}
            >
              Verify
            </button>
          </>
        ) : (
          <div className="flex-1 text-center text-text-muted text-[13px] py-3">
            {section.hint && (
              <button
                onClick={() => setShowHint(true)}
                className="text-purple hover:brightness-125 text-[13px] font-mono transition-all"
              >
                need a hint?
              </button>
            )}
            {showHint && !isFreeMode && section.hint && (
              <p className="mt-2 text-text-secondary text-[13px]">{section.hint}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
