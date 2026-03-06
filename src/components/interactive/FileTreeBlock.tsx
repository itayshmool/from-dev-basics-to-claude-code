interface TreeNode {
  name: string;
  isFolder: boolean;
  depth: number;
  isLast: boolean;
  prefixParts: ('pipe' | 'space')[];
}

/** Parse indented text lines into tree nodes with connector metadata. */
function parseTreeLines(lines: string[]): TreeNode[] {
  // Determine indent per line
  const entries = lines.map(line => {
    const stripped = line.replace(/\t/g, '  ');
    const match = stripped.match(/^(\s*)/);
    const spaces = match ? match[1].length : 0;
    const name = stripped.trim();
    const isFolder = name.endsWith('/');
    return { name: isFolder ? name.slice(0, -1) : name, isFolder, spaces };
  });

  if (entries.length === 0) return [];

  // Detect indent unit (smallest nonzero indent)
  const indents = entries.map(e => e.spaces).filter(s => s > 0);
  const unit = indents.length > 0 ? Math.min(...indents) : 2;

  // Build depth + sibling info
  const nodes: TreeNode[] = [];
  for (let i = 0; i < entries.length; i++) {
    const depth = Math.round(entries[i].spaces / unit);
    nodes.push({
      name: entries[i].name,
      isFolder: entries[i].isFolder,
      depth,
      isLast: false,
      prefixParts: [],
    });
  }

  // For each node, determine if it's the last sibling at its depth
  for (let i = 0; i < nodes.length; i++) {
    const d = nodes[i].depth;
    let last = true;
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[j].depth < d) break; // parent or higher — we're done
      if (nodes[j].depth === d) { last = false; break; } // same-level sibling follows
    }
    nodes[i].isLast = last;
  }

  // Build prefix parts for each node: for each ancestor depth, show pipe or space
  for (let i = 0; i < nodes.length; i++) {
    const parts: ('pipe' | 'space')[] = [];
    for (let d = 1; d < nodes[i].depth; d++) {
      // Look backwards to find the nearest node at depth d that is an ancestor
      let showPipe = false;
      for (let j = i - 1; j >= 0; j--) {
        if (nodes[j].depth < d) break;
        if (nodes[j].depth === d) {
          showPipe = !nodes[j].isLast;
          break;
        }
      }
      parts.push(showPipe ? 'pipe' : 'space');
    }
    nodes[i].prefixParts = parts;
  }

  return nodes;
}

export function FileTreeBlock({ lines }: { lines: string[] }) {
  const nodes = parseTreeLines(lines);

  return (
    <div className="my-3 bg-bg-elevated/50 rounded-lg border border-border/50 px-4 py-3 font-mono text-[13px] lg:text-[14px] leading-relaxed overflow-x-auto">
      {nodes.map((node, i) => (
        <div key={i} className="whitespace-pre flex items-center">
          {/* Prefix connectors */}
          {node.prefixParts.map((part, pi) => (
            <span key={pi} className="text-text-muted/40 inline-block w-[1.5em] text-center select-none">
              {part === 'pipe' ? '│' : ' '}
            </span>
          ))}

          {/* Branch connector (not for root node at depth 0) */}
          {node.depth > 0 && (
            <span className="text-text-muted/40 inline-block w-[1.5em] text-center select-none">
              {node.isLast ? '└' : '├'}
            </span>
          )}
          {node.depth > 0 && (
            <span className="text-text-muted/40 inline-block w-[1em] select-none">
              ──
            </span>
          )}

          {/* Icon */}
          <span className="mr-1.5 select-none">
            {node.isFolder ? '📁' : '📄'}
          </span>

          {/* Name */}
          <span className={node.isFolder ? 'text-purple font-medium' : 'text-text-primary'}>
            {node.name}
          </span>
        </div>
      ))}
    </div>
  );
}
