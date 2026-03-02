const COMMAND_DESCRIPTIONS: Record<string, string> = {
  'pwd': 'location',
  'ls': 'list files',
  'ls -l': 'detailed list',
  'ls -a': 'show hidden',
  'cd': 'change folder',
  'cd ..': 'go up',
  'cd ~': 'go home',
  'mkdir': 'create folder',
  'mkdir -p': 'create nested',
  'touch': 'create file',
  'rm': 'delete file',
  'rm -r': 'delete folder',
  'cp': 'copy file',
  'mv': 'move/rename',
};

interface CommandReferenceBarProps {
  commands: string[];
}

export function CommandReferenceBar({ commands }: CommandReferenceBarProps) {
  if (commands.length === 0) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {commands.map((cmd) => (
        <div
          key={cmd}
          className="flex-shrink-0 flex items-center gap-1.5 bg-bg-elevated rounded-lg px-2.5 py-1.5 border border-border"
        >
          <code className="text-[11px] font-mono font-semibold text-purple">{cmd}</code>
          {COMMAND_DESCRIPTIONS[cmd] && (
            <span className="text-[10px] text-text-muted">{COMMAND_DESCRIPTIONS[cmd]}</span>
          )}
        </div>
      ))}
    </div>
  );
}
