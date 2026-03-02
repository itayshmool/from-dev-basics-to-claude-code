import { createContext, useContext, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { VirtualFileSystem } from '../vfs/VirtualFileSystem';
import type { FileSystemSpec } from '../lesson/types';

export interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'error';
  text: string;
  prompt?: string;
}

interface TerminalContextValue {
  vfs: VirtualFileSystem;
  history: TerminalLine[];
  addToHistory: (line: Omit<TerminalLine, 'id'>) => void;
  clearHistory: () => void;
  lastCommand: string;
  setLastCommand: (cmd: string) => void;
  commandHistory: string[];
  fsVersion: number;
  bumpFsVersion: () => void;
}

const TerminalCtx = createContext<TerminalContextValue | null>(null);

export function TerminalProvider({
  initialFs,
  initialDir,
  children,
}: {
  initialFs?: FileSystemSpec;
  initialDir?: string;
  children: ReactNode;
}) {
  const vfsRef = useRef(new VirtualFileSystem(initialFs, initialDir || '/home/user'));
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [lastCommand, setLastCommand] = useState('');
  const [fsVersion, setFsVersion] = useState(0);
  const commandHistoryRef = useRef<string[]>([]);
  const lineIdRef = useRef(0);

  const addToHistory = useCallback((line: Omit<TerminalLine, 'id'>) => {
    setHistory((prev) => [...prev, { ...line, id: lineIdRef.current++ }]);
    if (line.type === 'input') {
      commandHistoryRef.current.push(line.text);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const bumpFsVersion = useCallback(() => {
    setFsVersion((v) => v + 1);
  }, []);

  return (
    <TerminalCtx.Provider value={{
      vfs: vfsRef.current,
      history,
      addToHistory,
      clearHistory,
      lastCommand,
      setLastCommand,
      commandHistory: commandHistoryRef.current,
      fsVersion,
      bumpFsVersion,
    }}>
      {children}
    </TerminalCtx.Provider>
  );
}

export function useTerminal() {
  const ctx = useContext(TerminalCtx);
  if (!ctx) throw new Error('useTerminal must be used within TerminalProvider');
  return ctx;
}
