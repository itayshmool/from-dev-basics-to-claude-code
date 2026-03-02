import { useState } from 'react';
import type { FileSystemSpec } from '../../core/lesson/types';

interface PathBuilderProps {
  section: {
    instruction: string;
    tree: FileSystemSpec;
    targetPath: string;
  };
  onComplete: () => void;
}

interface PathTreeNodeProps {
  name: string;
  value: string | FileSystemSpec;
  path: string;
  depth: number;
  onNavigate: (path: string, isFile: boolean) => void;
  activePath: string;
}

function PathTreeNode({ name, value, path, depth, onNavigate, activePath }: PathTreeNodeProps) {
  const isFile = typeof value === 'string';
  const isOnPath = activePath.startsWith(path) || activePath === path;
  const isTarget = activePath === path;

  return (
    <div>
      <button
        onClick={() => onNavigate(path, isFile)}
        className={`
          flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-lg text-sm transition-all active:scale-[0.98]
          ${isTarget ? 'bg-lavender-light ring-1 ring-lavender/20' : isOnPath ? 'bg-lavender-light/40' : 'hover:bg-bg-secondary'}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isFile ? (
          <span className="text-sm flex-shrink-0">&#128196;</span>
        ) : (
          <span className="text-sm flex-shrink-0">{isOnPath ? '&#128194;' : '&#128193;'}</span>
        )}
        <span className={isTarget ? 'text-lavender font-semibold' : isFile ? 'text-text-secondary' : 'text-text-primary font-medium'}>
          {name}
        </span>
      </button>
      {!isFile && isOnPath && (
        <div className="animate-fade-in-up" style={{ animationDuration: '150ms' }}>
          {Object.entries(value as FileSystemSpec).map(([childName, childValue]) => (
            <PathTreeNode
              key={childName}
              name={childName}
              value={childValue}
              path={`${path}/${childName}`}
              depth={depth + 1}
              onNavigate={onNavigate}
              activePath={activePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PathBuilder({ section, onComplete }: PathBuilderProps) {
  const [currentPath, setCurrentPath] = useState('');
  const isComplete = currentPath === section.targetPath;

  function handleNavigate(path: string, _isFile: boolean) {
    setCurrentPath(path);
  }

  const segments = currentPath.split('/').filter(Boolean);

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="bg-bg-card rounded-xl p-4 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-sky mb-1">Build the path</p>
        <p className="text-sm text-text-secondary">{section.instruction}</p>
      </div>

      {/* Path display */}
      <div className="bg-bg-terminal rounded-xl px-4 py-3 font-mono text-sm min-h-[44px] flex items-center overflow-x-auto">
        {currentPath ? (
          <span className="text-[#F6C542] font-medium whitespace-nowrap">
            /{segments.map((seg, i) => (
              <span key={i}>
                {seg}{i < segments.length - 1 && <span className="text-[#A599E9]">/</span>}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-[#A599E9] text-xs">Click through folders to build the path...</span>
        )}
      </div>

      {/* Tree */}
      <div className="bg-bg-card rounded-xl border border-border p-3 max-h-56 overflow-y-auto" style={{ boxShadow: 'var(--shadow-card)' }}>
        {Object.entries(section.tree).map(([name, value]) => (
          <PathTreeNode
            key={name}
            name={name}
            value={value}
            path={`/${name}`}
            depth={0}
            onNavigate={handleNavigate}
            activePath={currentPath}
          />
        ))}
      </div>

      {isComplete && (
        <div className="space-y-3 animate-pop-in">
          <div className="bg-mint-light border border-mint/15 rounded-xl px-4 py-3.5 text-sm">
            <p className="font-medium text-text-primary">
              Correct! <code className="px-1 py-0.5 bg-bg-card rounded font-mono text-lavender">{section.targetPath}</code>
            </p>
          </div>
          <button
            onClick={onComplete}
            className="w-full md:w-auto px-6 py-3 bg-lavender text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Continue &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
