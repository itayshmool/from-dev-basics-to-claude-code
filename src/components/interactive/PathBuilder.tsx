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
          flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-lg text-sm transition-all
          ${isTarget ? 'bg-lavender-light ring-2 ring-lavender/30' : isOnPath ? 'bg-lavender-light/50' : 'hover:bg-bg-card'}
        `}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {isFile ? (
          <span className="text-base flex-shrink-0">&#128196;</span>
        ) : (
          <span className="text-base flex-shrink-0">
            {isOnPath ? '&#128194;' : '&#128193;'}
          </span>
        )}
        <span className={`${isTarget ? 'text-lavender font-bold' : isFile ? 'text-text-secondary' : 'text-text-primary font-bold'}`}>
          {name}
        </span>
      </button>
      {!isFile && isOnPath && (
        <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
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
    <div className="space-y-4 animate-fade-in-up">
      <div className="bg-bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-sky mb-1">Build the path</p>
        <p className="text-sm text-text-secondary">{section.instruction}</p>
      </div>

      {/* Path display bar */}
      <div className="bg-[#2D2B55] rounded-2xl border border-[#3D3B65] px-5 py-3.5 font-mono text-sm min-h-[48px] flex items-center">
        {currentPath ? (
          <span className="text-[#FAD000] font-bold">
            /
            {segments.map((seg, i) => (
              <span key={i} className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
                {seg}
                {i < segments.length - 1 && <span className="text-[#A599E9]">/</span>}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-[#A599E9]">Click through folders to build the path...</span>
        )}
      </div>

      {/* Tree */}
      <div className="bg-bg-card rounded-2xl border border-border p-4 max-h-64 overflow-y-auto" style={{ boxShadow: 'var(--shadow-card)' }}>
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
          <div className="bg-mint-light border border-mint/20 rounded-2xl px-5 py-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">&#127881;</span>
              <span className="font-bold text-text-primary">
                You built the correct path: <code className="px-1.5 py-0.5 bg-bg-card rounded-md font-mono font-bold text-lavender">{section.targetPath}</code>
              </span>
            </div>
          </div>
          <button
            onClick={onComplete}
            className="px-7 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97]"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Continue &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
