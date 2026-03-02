import type { VirtualFileSystem } from '../vfs/VirtualFileSystem';

export interface ExecutionResult {
  output: string;
  isError: boolean;
  clearedScreen?: boolean;
}

export function parseCommand(input: string): { command: string; args: string[] } {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  return { command: parts[0] || '', args: parts.slice(1) };
}

export function executeCommand(input: string, vfs: VirtualFileSystem): ExecutionResult {
  const { command, args } = parseCommand(input);
  if (!command) return { output: '', isError: false };

  switch (command) {
    case 'pwd':   return cmdPwd(vfs);
    case 'ls':    return cmdLs(args, vfs);
    case 'cd':    return cmdCd(args, vfs);
    case 'mkdir': return cmdMkdir(args, vfs);
    case 'touch': return cmdTouch(args, vfs);
    case 'rm':    return cmdRm(args, vfs);
    case 'cp':    return cmdCp(args, vfs);
    case 'mv':    return cmdMv(args, vfs);
    case 'clear': return { output: '', isError: false, clearedScreen: true };
    case 'help':  return cmdHelp();
    default:
      return {
        output: `Command not found: "${command}". Type 'help' to see available commands.`,
        isError: true,
      };
  }
}

function cmdPwd(vfs: VirtualFileSystem): ExecutionResult {
  return { output: vfs.getCwd(), isError: false };
}

function cmdLs(args: string[], vfs: VirtualFileSystem): ExecutionResult {
  const flags = new Set<string>();
  let targetPath: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('-')) {
      for (const ch of arg.slice(1)) flags.add(ch);
    } else {
      targetPath = arg;
    }
  }

  const showAll = flags.has('a');
  const showLong = flags.has('l');

  const entries = vfs.listDir(targetPath);
  if (entries === null) {
    const name = targetPath || '.';
    return { output: `No such file or directory: "${name}".`, isError: true };
  }

  const names: Array<{ name: string; isDir: boolean }> = [];

  if (showAll) {
    names.push({ name: '.', isDir: true });
    names.push({ name: '..', isDir: true });
  }

  for (const entry of entries) {
    if (!showAll && entry.name.startsWith('.')) continue;
    names.push({ name: entry.name, isDir: entry.type === 'dir' });
  }

  if (names.length === 0) return { output: '', isError: false };

  if (showLong) {
    const lines = names.map(({ name, isDir }) => {
      const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
      return `${perms}  ${name}`;
    });
    return { output: lines.join('\n'), isError: false };
  }

  return { output: names.map((n) => n.name).join('  '), isError: false };
}

function cmdCd(args: string[], vfs: VirtualFileSystem): ExecutionResult {
  const target = args[0];

  // cd with no args or cd ~ → go home
  if (!target || target === '~') {
    vfs.setCwd(vfs.getHome());
    return { output: '', isError: false };
  }

  const resolved = vfs.resolvePath(target);
  const nodeType = vfs.getNodeType(target);

  if (nodeType === null) {
    const name = target;
    return {
      output: `No such directory: "${name}". Use 'ls' to see what's in the current folder.`,
      isError: true,
    };
  }

  if (nodeType === 'file') {
    return {
      output: `"${target}" is a file, not a folder. You can only cd into folders.`,
      isError: true,
    };
  }

  vfs.setCwd(resolved);
  return { output: '', isError: false };
}

function cmdMkdir(args: string[], vfs: VirtualFileSystem): ExecutionResult {
  const recursive = args.includes('-p');
  const paths = args.filter((a) => a !== '-p');

  if (paths.length === 0) {
    return { output: 'Usage: mkdir [-p] <folder-name>', isError: true };
  }

  for (const p of paths) {
    if (!recursive && vfs.exists(p)) {
      return { output: `Folder "${p}" already exists.`, isError: true };
    }
    const ok = vfs.createDir(p, recursive);
    if (!ok && !recursive) {
      return { output: `Can't create folder: the parent directory doesn't exist. Use 'mkdir -p' to create nested folders.`, isError: true };
    }
  }

  return { output: '', isError: false };
}

function cmdTouch(args: string[], vfs: VirtualFileSystem): ExecutionResult {
  if (args.length === 0) {
    return { output: 'Usage: touch <file-name>', isError: true };
  }

  for (const name of args) {
    if (vfs.exists(name)) continue; // touch on existing file is a no-op
    const ok = vfs.createFile(name);
    if (!ok) {
      // Find the parent dir name for the error message
      const parts = name.split('/');
      parts.pop();
      const parentDir = parts.join('/') || '.';
      return {
        output: `Can't create file: the folder "${parentDir}" doesn't exist. Create it first with mkdir.`,
        isError: true,
      };
    }
  }

  return { output: '', isError: false };
}

function cmdRm(args: string[], vfs: VirtualFileSystem): ExecutionResult {
  const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
  const paths = args.filter((a) => !a.startsWith('-'));

  if (paths.length === 0) {
    return { output: 'Usage: rm [-r] <file-or-folder>', isError: true };
  }

  for (const name of paths) {
    const nodeType = vfs.getNodeType(name);

    if (nodeType === null) {
      return { output: `No such file or directory: "${name}".`, isError: true };
    }

    if (nodeType === 'dir' && !recursive) {
      return {
        output: `Can't remove "${name}": it's a folder. Use 'rm -r ${name}' to delete folders.`,
        isError: true,
      };
    }

    vfs.deleteNode(name, recursive);
  }

  return { output: '', isError: false };
}

function cmdCp(args: string[], vfs: VirtualFileSystem): ExecutionResult {
  if (args.length < 2) {
    return { output: 'Usage: cp <source> <destination>', isError: true };
  }

  const [source, dest] = args;
  const result = vfs.copyFile(source, dest);

  switch (result) {
    case 'ok': return { output: '', isError: false };
    case 'not_found': return { output: `No such file: "${source}".`, isError: true };
    case 'is_dir': return { output: `"${source}" is a directory. Use 'cp -r' to copy directories.`, isError: true };
    case 'parent_missing': return { output: `Can't copy: the destination folder doesn't exist.`, isError: true };
  }
}

function cmdMv(args: string[], vfs: VirtualFileSystem): ExecutionResult {
  if (args.length < 2) {
    return { output: 'Usage: mv <source> <destination>', isError: true };
  }

  const [source, dest] = args;
  const result = vfs.moveNode(source, dest);

  switch (result) {
    case 'ok': return { output: '', isError: false };
    case 'not_found': return { output: `No such file or directory: "${source}".`, isError: true };
    case 'parent_missing': return { output: `Can't move: the destination folder doesn't exist.`, isError: true };
  }
}

function cmdHelp(): ExecutionResult {
  const commands = [
    ['pwd',             'Show current directory'],
    ['ls',              'List files and folders'],
    ['ls -l',           'List with details'],
    ['ls -a',           'List including hidden files'],
    ['cd <folder>',     'Move into a folder'],
    ['cd ..',           'Go up one folder'],
    ['cd ~',            'Go to home folder'],
    ['mkdir <name>',    'Create a folder'],
    ['mkdir -p <path>', 'Create nested folders'],
    ['touch <name>',    'Create an empty file'],
    ['rm <file>',       'Delete a file'],
    ['rm -r <folder>',  'Delete a folder and its contents'],
    ['cp <src> <dest>', 'Copy a file'],
    ['mv <src> <dest>', 'Move or rename a file'],
    ['clear',           'Clear the screen'],
    ['help',            'Show this help message'],
  ];

  const maxCmd = Math.max(...commands.map(([c]) => c.length));
  const lines = commands.map(([cmd, desc]) => `  ${cmd.padEnd(maxCmd + 2)} ${desc}`);
  return { output: 'Available commands:\n' + lines.join('\n'), isError: false };
}
