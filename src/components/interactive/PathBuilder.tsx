import { useState } from 'react';
import type { FileSystemSpec } from '../../core/lesson/types';
import { LessonStep } from '../lesson/LessonStep';
import { CelebrationOverlay } from '../lesson/CelebrationOverlay';

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
          flex items-center gap-2 w-full text-left py-2 px-2.5 rounded-xl text-[15px] transition-all active:scale-[0.98]
          ${isTarget ? 'bg-purple-soft ring-1 ring-purple/20' : isOnPath ? 'bg-purple-soft/40' : 'hover:bg-bg-elevated'}
        `}
        style={{ paddingLeft: `${depth * 16 + 10}px` }}
      >
        {isFile ? (
          <span className="text-sm flex-shrink-0">&#128196;</span>
        ) : (
          <span className="text-sm flex-shrink-0">{isOnPath ? '&#128194;' : '&#128193;'}</span>
        )}
        <span className={isTarget ? 'text-purple font-semibold' : isFile ? 'text-text-secondary' : 'text-text-primary font-medium'}>
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
  const [showCelebration, setShowCelebration] = useState(false);
  const isComplete = currentPath === section.targetPath;

  function handleNavigate(path: string) {
    setCurrentPath(path);
    if (path === section.targetPath && !showCelebration) {
      setShowCelebration(true);
    }
  }

  const segments = currentPath.split('/').filter(Boolean);

  const cta = isComplete
    ? { label: 'Continue', onClick: onComplete }
    : undefined;

  return (
    <>
      {showCelebration && <CelebrationOverlay onDone={() => setShowCelebration(false)} />}
      <LessonStep cta={cta}>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-text-primary leading-snug">
            {section.instruction}
          </h3>

          {/* Path display */}
          <div className="bg-bg-terminal rounded-2xl px-4 py-3.5 font-mono text-[15px] min-h-[48px] flex items-center overflow-x-auto">
            {currentPath ? (
              <span className="text-yellow font-medium whitespace-nowrap">
                /{segments.map((seg, i) => (
                  <span key={i}>
                    {seg}{i < segments.length - 1 && <span className="text-[#6B6B85]">/</span>}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-[#6B6B85] text-sm">Click through folders to build the path...</span>
            )}
          </div>

          {/* Tree */}
          <div className="bg-bg-card rounded-2xl border border-border p-2 max-h-56 overflow-y-auto">
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
            <div className="bg-green-soft rounded-2xl px-4 py-4 text-[15px] animate-pop-in">
              <p className="font-medium text-text-primary">
                Correct! <code className="px-1.5 py-0.5 bg-bg-card rounded-md font-mono text-purple">{section.targetPath}</code>
              </p>
            </div>
          )}
        </div>
      </LessonStep>
    </>
  );
}
