import { useState } from 'react';
import type { FileSystemSpec } from '../../core/lesson/types';

interface InteractiveFileTreeProps {
  section: {
    instruction: string;
    tree: FileSystemSpec;
    highlightPath?: string;
  };
  onComplete: () => void;
  onPathClick?: (path: string) => void;
}

interface TreeNodeProps {
  name: string;
  value: string | FileSystemSpec;
  path: string;
  depth: number;
  onFileClick?: (path: string, content: string) => void;
  onDirClick?: (path: string) => void;
}

function TreeNode({ name, value, path, depth, onFileClick, onDirClick }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isFile = typeof value === 'string';

  function handleClick() {
    if (isFile) {
      onFileClick?.(path, value as string);
    } else {
      setExpanded(!expanded);
      onDirClick?.(path);
    }
  }

  const childCount = !isFile ? Object.keys(value as FileSystemSpec).length : 0;

  return (
    <div>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 w-full text-left py-1.5 px-2 hover:bg-lavender-light rounded-lg text-sm transition-all group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {isFile ? (
          <span className="text-base flex-shrink-0">&#128196;</span>
        ) : (
          <span className={`text-base flex-shrink-0 transition-transform inline-block ${expanded ? '' : '-rotate-90'}`}>
            {expanded ? '&#128194;' : '&#128193;'}
          </span>
        )}
        <span className={`${isFile ? 'text-text-secondary' : 'text-text-primary font-bold'}`}>
          {name}
        </span>
        {!isFile && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-lavender-light text-lavender ml-1">
            {childCount}
          </span>
        )}
      </button>
      {!isFile && expanded && (
        <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
          {Object.entries(value as FileSystemSpec).map(([childName, childValue]) => (
            <TreeNode
              key={childName}
              name={childName}
              value={childValue}
              path={`${path}/${childName}`}
              depth={depth + 1}
              onFileClick={onFileClick}
              onDirClick={onDirClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function InteractiveFileTree({ section, onComplete }: InteractiveFileTreeProps) {
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="bg-bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-teal mb-1">Explore the file tree</p>
        <p className="text-sm text-text-secondary">{section.instruction}</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-bg-card rounded-2xl border border-border p-4 max-h-80 overflow-y-auto" style={{ boxShadow: 'var(--shadow-card)' }}>
          {Object.entries(section.tree).map(([name, value]) => (
            <TreeNode
              key={name}
              name={name}
              value={value}
              path={`/${name}`}
              depth={0}
              onFileClick={(path, content) => setSelectedFile({ path, content })}
            />
          ))}
        </div>

        {selectedFile && (
          <div className="flex-1 bg-[#2D2B55] rounded-2xl border border-[#3D3B65] p-4 max-h-80 overflow-y-auto animate-fade-in-up">
            <p className="text-xs text-[#A599E9] mb-2 font-mono font-bold">{selectedFile.path}</p>
            <pre className="text-sm text-[#E0DFF5] font-mono whitespace-pre-wrap leading-relaxed">{selectedFile.content}</pre>
          </div>
        )}
      </div>

      <button
        onClick={onComplete}
        className="px-7 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97]"
        style={{ boxShadow: 'var(--shadow-button)' }}
      >
        Continue &rarr;
      </button>
    </div>
  );
}
