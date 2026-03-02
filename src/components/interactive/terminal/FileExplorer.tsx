import { useState, useEffect } from 'react';
import type { FileSystemSpec } from '../../../core/lesson/types';

interface FileExplorerProps {
  tree: FileSystemSpec;
  cwd: string;
  homePath: string;
  highlightPath?: string | null;
}

interface TreeNodeProps {
  name: string;
  value: string | FileSystemSpec;
  path: string;
  depth: number;
  cwd: string;
  highlightPath?: string | null;
}

function TreeNode({ name, value, path, depth, cwd, highlightPath }: TreeNodeProps) {
  const isFile = typeof value === 'string';
  const [expanded, setExpanded] = useState(true);
  const isCwd = path === cwd;
  const isHighlighted = highlightPath === path;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md text-[13px] font-mono transition-all ${
          isCwd ? 'bg-purple-soft text-purple font-semibold' :
          isHighlighted ? 'bg-green-soft text-green animate-fade-in-up' :
          ''
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => !isFile && setExpanded(!expanded)}
      >
        {isFile ? (
          <span className="text-[11px] flex-shrink-0 opacity-70">{'\u{1F4C4}'}</span>
        ) : (
          <span className="text-[11px] flex-shrink-0 opacity-70">
            {expanded ? '\u{1F4C2}' : '\u{1F4C1}'}
          </span>
        )}
        <span className={isFile ? 'text-text-secondary' : 'text-text-primary'}>
          {name}{!isFile && '/'}
        </span>
      </div>
      {!isFile && expanded && (
        <div>
          {Object.entries(value as FileSystemSpec)
            .sort(([, a], [, b]) => {
              const aIsDir = typeof a !== 'string';
              const bIsDir = typeof b !== 'string';
              if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
              return 0;
            })
            .map(([childName, childValue]) => (
              <TreeNode
                key={childName}
                name={childName}
                value={childValue}
                path={`${path}/${childName}`}
                depth={depth + 1}
                cwd={cwd}
                highlightPath={highlightPath}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ tree, cwd, homePath, highlightPath }: FileExplorerProps) {
  const [flashPath, setFlashPath] = useState<string | null>(null);

  useEffect(() => {
    if (highlightPath) {
      setFlashPath(highlightPath);
      const timer = setTimeout(() => setFlashPath(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [highlightPath]);

  // Extract user home subtree for display
  const homeSegments = homePath.split('/').filter(Boolean);
  let displayTree: FileSystemSpec = tree;
  for (const seg of homeSegments) {
    const child = displayTree[seg];
    if (child && typeof child !== 'string') {
      displayTree = child;
    } else {
      break;
    }
  }

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Files</span>
      </div>
      <div className="p-1.5 max-h-[300px] overflow-y-auto">
        {Object.keys(displayTree).length === 0 ? (
          <div className="text-text-muted text-[12px] px-2 py-3 text-center italic">
            Empty folder
          </div>
        ) : (
          Object.entries(displayTree)
            .sort(([, a], [, b]) => {
              const aIsDir = typeof a !== 'string';
              const bIsDir = typeof b !== 'string';
              if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
              return 0;
            })
            .map(([name, value]) => (
              <TreeNode
                key={name}
                name={name}
                value={value}
                path={`${homePath}/${name}`}
                depth={0}
                cwd={cwd}
                highlightPath={flashPath}
              />
            ))
        )}
      </div>
    </div>
  );
}
