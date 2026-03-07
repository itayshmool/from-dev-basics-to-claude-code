import { useState, useEffect, useRef, useCallback } from 'react';
import type { FileSystemSpec } from '../../../core/lesson/types';

interface FileExplorerProps {
  tree: FileSystemSpec;
  cwd: string;
  homePath: string;
  highlightPath?: string | null;
}

interface FlatNode {
  name: string;
  path: string;
  depth: number;
  isFile: boolean;
  isExpanded: boolean;
  isCwd: boolean;
  isHighlighted: boolean;
}

function sortEntries(entries: [string, string | FileSystemSpec][]) {
  return entries.sort(([, a], [, b]) => {
    const aIsDir = typeof a !== 'string';
    const bIsDir = typeof b !== 'string';
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return 0;
  });
}

/** Flatten the tree into a visible-node list for keyboard navigation. */
function flattenTree(
  tree: FileSystemSpec,
  basePath: string,
  depth: number,
  expandedSet: Set<string>,
  cwd: string,
  highlightPath: string | null,
): FlatNode[] {
  const nodes: FlatNode[] = [];
  for (const [name, value] of sortEntries(Object.entries(tree))) {
    const path = `${basePath}/${name}`;
    const isFile = typeof value === 'string';
    const isExpanded = !isFile && expandedSet.has(path);
    nodes.push({
      name,
      path,
      depth,
      isFile,
      isExpanded,
      isCwd: path === cwd,
      isHighlighted: path === highlightPath,
    });
    if (!isFile && isExpanded) {
      nodes.push(...flattenTree(value as FileSystemSpec, path, depth + 1, expandedSet, cwd, highlightPath));
    }
  }
  return nodes;
}

/** Collect all directory paths so they start expanded. */
function collectDirPaths(tree: FileSystemSpec, basePath: string): string[] {
  const paths: string[] = [];
  for (const [name, value] of Object.entries(tree)) {
    if (typeof value !== 'string') {
      const p = `${basePath}/${name}`;
      paths.push(p);
      paths.push(...collectDirPaths(value as FileSystemSpec, p));
    }
  }
  return paths;
}

export function FileExplorer({ tree, cwd, homePath, highlightPath }: FileExplorerProps) {
  const [flashPath, setFlashPath] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Track expanded directories — all expanded by default
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(
    () => new Set(collectDirPaths(displayTree, homePath))
  );

  // Re-expand new dirs when tree changes (e.g. mkdir)
  useEffect(() => {
    const allDirs = collectDirPaths(displayTree, homePath);
    setExpandedDirs(prev => {
      const next = new Set(prev);
      for (const d of allDirs) {
        if (!next.has(d)) next.add(d);
      }
      return next;
    });
  }, [displayTree, homePath]);

  const flatNodes = flattenTree(displayTree, homePath, 0, expandedDirs, cwd, flashPath);

  const toggleExpand = useCallback((path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const node = flatNodes[index];
    if (!node) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = Math.min(index + 1, flatNodes.length - 1);
        setFocusIndex(next);
        nodeRefs.current[next]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = Math.max(index - 1, 0);
        setFocusIndex(prev);
        nodeRefs.current[prev]?.focus();
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (!node.isFile && !node.isExpanded) {
          toggleExpand(node.path);
        } else if (!node.isFile && node.isExpanded) {
          // Move to first child
          const next = index + 1;
          if (next < flatNodes.length && flatNodes[next].depth > node.depth) {
            setFocusIndex(next);
            nodeRefs.current[next]?.focus();
          }
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        if (!node.isFile && node.isExpanded) {
          toggleExpand(node.path);
        } else {
          // Move to parent
          for (let i = index - 1; i >= 0; i--) {
            if (flatNodes[i].depth < node.depth) {
              setFocusIndex(i);
              nodeRefs.current[i]?.focus();
              break;
            }
          }
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (!node.isFile) {
          toggleExpand(node.path);
        }
        break;
      }
      case 'Home': {
        e.preventDefault();
        setFocusIndex(0);
        nodeRefs.current[0]?.focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        const last = flatNodes.length - 1;
        setFocusIndex(last);
        nodeRefs.current[last]?.focus();
        break;
      }
    }
  }, [flatNodes, toggleExpand]);

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <span id="file-explorer-label" className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Files</span>
      </div>
      <div
        className="p-1.5 max-h-[300px] overflow-y-auto"
        role="tree"
        aria-labelledby="file-explorer-label"
      >
        {flatNodes.length === 0 ? (
          <div className="text-text-muted text-[12px] px-2 py-3 text-center italic">
            Empty folder
          </div>
        ) : (
          flatNodes.map((node, i) => (
            <div
              key={node.path}
              ref={(el) => { nodeRefs.current[i] = el; }}
              role="treeitem"
              aria-expanded={node.isFile ? undefined : node.isExpanded}
              aria-selected={i === focusIndex}
              aria-label={`${node.isFile ? 'File' : 'Folder'}: ${node.name}`}
              tabIndex={i === focusIndex ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onClick={() => !node.isFile && toggleExpand(node.path)}
              className={`relative flex items-center gap-1.5 py-1 px-2 rounded-md text-[13px] font-mono transition-all cursor-default outline-none focus-visible:ring-2 focus-visible:ring-purple/50 ${
                node.isCwd ? 'bg-purple-soft text-purple font-semibold' :
                node.isHighlighted ? 'bg-green-soft text-green animate-fade-in-up' :
                ''
              }`}
              style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
            >
              {/* Indentation guides */}
              {Array.from({ length: node.depth }).map((_, j) => (
                <span
                  key={j}
                  className="absolute top-0 bottom-0 w-px bg-border"
                  style={{ left: `${j * 16 + 14}px` }}
                />
              ))}
              {node.isFile ? (
                <span className="text-[11px] flex-shrink-0 opacity-70" aria-hidden="true">{'\u{1F4C4}'}</span>
              ) : (
                <span className="text-[11px] flex-shrink-0 opacity-70" aria-hidden="true">
                  {node.isExpanded ? '\u{1F4C2}' : '\u{1F4C1}'}
                </span>
              )}
              <span className={node.isFile ? 'text-text-secondary' : 'text-text-primary'}>
                {node.name}{!node.isFile && '/'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
