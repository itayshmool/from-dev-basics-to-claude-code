import { useState } from 'react';
import type { FileSystemSpec } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';

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
        className="flex items-center gap-2 w-full text-left py-2 px-2.5 hover:bg-bg-elevated rounded-lg text-[15px] transition-all active:scale-[0.98]"
        style={{ paddingLeft: `${depth * 16 + 10}px` }}
      >
        {isFile ? (
          <span className="text-sm flex-shrink-0">{'\u{1F4C4}'}</span>
        ) : (
          <span className="text-sm flex-shrink-0">
            {expanded ? '\u{1F4C2}' : '\u{1F4C1}'}
          </span>
        )}
        <span className={isFile ? 'text-text-secondary' : 'text-text-primary font-medium'}>
          {name}
        </span>
        {!isFile && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-bg-elevated text-text-muted ml-auto">
            {childCount} {childCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </button>
      {!isFile && expanded && (
        <div className="animate-fade-in-up" style={{ animationDuration: '150ms' }}>
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
    <LessonStep cta={{ label: 'Continue', onClick: onComplete }}>
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-text-primary leading-snug">
          {section.instruction}
        </h3>

        <div className="flex flex-col gap-3">
          <div className="bg-bg-card rounded-xl border border-border p-2 max-h-64 overflow-y-auto">
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
            <div className="bg-bg-terminal rounded-xl p-4 max-h-52 overflow-y-auto animate-fade-in-up">
              <p className="text-[11px] text-purple font-mono font-medium mb-2">{selectedFile.path}</p>
              <pre className="text-sm text-[#F0ECE4] font-mono whitespace-pre-wrap leading-relaxed">{selectedFile.content}</pre>
            </div>
          )}
        </div>
      </div>
    </LessonStep>
  );
}
