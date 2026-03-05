import { useState, useRef, useEffect, useCallback } from 'react';
import { useTerminal } from '../../../core/terminal/TerminalContext';
import { executeCommand } from '../../../core/terminal/CommandParser';

interface TerminalProps {
  onCommandExecuted: (command: string, output: string, isError: boolean) => void;
  disabled?: boolean;
}

function formatPrompt(cwd: string, home: string): string {
  const display = cwd === home ? '~' : cwd.startsWith(home + '/') ? '~' + cwd.slice(home.length) : cwd;
  return `user@terminal:${display}$ `;
}

export function Terminal({ onCommandExecuted, disabled }: TerminalProps) {
  const { vfs, history, addToHistory, clearHistory, setLastCommand, commandHistory, bumpFsVersion, envVars, git, curlMocks } = useTerminal();
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const tabState = useRef<{ partial: string; matches: string[]; index: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prompt = formatPrompt(vfs.getCwd(), vfs.getHome());

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled, history.length]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, [history.length]);

  function handleSubmit() {
    const cmd = input.trim();
    if (!cmd) return;

    addToHistory({ type: 'input', text: cmd, prompt });
    setInput('');
    setHistoryIndex(-1);
    setLastCommand(cmd);

    const result = executeCommand(cmd, vfs, envVars, git, curlMocks);

    if (result.clearedScreen) {
      clearHistory();
    } else if (result.output) {
      addToHistory({ type: result.isError ? 'error' : 'output', text: result.output });
    }

    bumpFsVersion();
    onCommandExecuted(cmd, result.output, result.isError);
  }

  const getCompletions = useCallback((currentInput: string): { prefix: string; matches: string[] } => {
    // Split input into tokens, find the last token as the partial path
    const trimmed = currentInput;
    const lastSpaceIdx = trimmed.lastIndexOf(' ');
    const partial = lastSpaceIdx === -1 ? trimmed : trimmed.slice(lastSpaceIdx + 1);

    if (!partial) return { prefix: '', matches: [] };

    // Determine the directory to list and the name prefix to match
    const lastSlashIdx = partial.lastIndexOf('/');
    let dirPath: string;
    let namePrefix: string;

    if (lastSlashIdx === -1) {
      // No slash — complete in cwd
      dirPath = '.';
      namePrefix = partial;
    } else {
      // Has slash — complete inside the directory portion
      dirPath = partial.slice(0, lastSlashIdx) || '/';
      namePrefix = partial.slice(lastSlashIdx + 1);
    }

    const entries = vfs.listDir(dirPath);
    if (!entries) return { prefix: partial, matches: [] };

    const matches = entries
      .filter(e => e.name.startsWith(namePrefix))
      .map(e => e.name + (e.type === 'dir' ? '/' : ''));

    return { prefix: partial, matches };
  }, [vfs]);

  function handleTab(e: React.KeyboardEvent) {
    e.preventDefault();

    const currentInput = input;
    const lastSpaceIdx = currentInput.lastIndexOf(' ');
    const partial = lastSpaceIdx === -1 ? currentInput : currentInput.slice(lastSpaceIdx + 1);
    const inputPrefix = lastSpaceIdx === -1 ? '' : currentInput.slice(0, lastSpaceIdx + 1);

    // If we're already cycling through completions for the same partial
    if (tabState.current && tabState.current.partial === partial && tabState.current.matches.length > 1) {
      tabState.current.index = (tabState.current.index + 1) % tabState.current.matches.length;
      const match = tabState.current.matches[tabState.current.index];
      const lastSlashIdx = partial.lastIndexOf('/');
      const base = lastSlashIdx === -1 ? '' : partial.slice(0, lastSlashIdx + 1);
      setInput(inputPrefix + base + match);
      return;
    }

    // Fresh completion
    const { matches } = getCompletions(currentInput);
    if (matches.length === 0) return;

    const lastSlashIdx = partial.lastIndexOf('/');
    const base = lastSlashIdx === -1 ? '' : partial.slice(0, lastSlashIdx + 1);

    if (matches.length === 1) {
      setInput(inputPrefix + base + matches[0]);
      tabState.current = null;
    } else {
      // Start cycling
      tabState.current = { partial, matches, index: 0 };
      setInput(inputPrefix + base + matches[0]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab') {
      handleTab(e);
      return;
    }

    // Any non-Tab key resets tab completion state
    tabState.current = null;

    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex >= commandHistory.length - 1) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#3D3A36]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
      {/* Title bar */}
      <div className="bg-[#38352F] px-3.5 py-2.5 flex items-center gap-1.5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#E85B4A]" />
          <div className="w-3 h-3 rounded-full bg-[#D4A843]" />
          <div className="w-3 h-3 rounded-full bg-[#4DA656]" />
        </div>
        <span className="text-[#7A756C] text-[11px] font-mono ml-2">terminal</span>
      </div>

      {/* Terminal body */}
      <div
        ref={containerRef}
        className="bg-bg-terminal p-4 font-mono text-[13px] min-h-[120px] max-h-[200px] md:min-h-[200px] md:max-h-[450px] overflow-y-auto cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* History */}
        {history.map((line) => (
          <div key={line.id} className="leading-relaxed">
            {line.type === 'input' ? (
              <div className="whitespace-nowrap">
                <span className="text-[#6ABF69] font-medium">{line.prompt}</span>
                <span className="text-[#F0ECE4]">{line.text}</span>
              </div>
            ) : line.type === 'error' ? (
              <div className="text-[#E85B4A] pl-0 whitespace-pre-wrap">{line.text}</div>
            ) : (
              <div className="text-[#A8A196] pl-0 whitespace-pre-wrap">{line.text}</div>
            )}
          </div>
        ))}

        {/* Input line */}
        {!disabled && (
          <div className="flex items-center leading-relaxed whitespace-nowrap">
            <span className="text-[#6ABF69] font-medium flex-shrink-0">{prompt}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent text-[#F0ECE4] outline-none border-none flex-1 font-mono text-[13px] p-0 m-0 caret-[#D4A843]"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        )}
      </div>
    </div>
  );
}
