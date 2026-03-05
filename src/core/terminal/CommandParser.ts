import type { VirtualFileSystem } from '../vfs/VirtualFileSystem';
import type { VirtualGit } from '../git/VirtualGit';

export interface ExecutionResult {
  output: string;
  isError: boolean;
  clearedScreen?: boolean;
}

/* ── Tokenizer: handles quoted strings properly ── */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuote) {
      if (ch === inQuote) { inQuote = ''; continue; }
      current += ch;
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === ' ' || ch === '\t') {
      if (current) { tokens.push(current); current = ''; }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

/* ── Environment variable expansion ── */
function expandEnvVars(input: string, env: Map<string, string>): string {
  return input.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => env.get(name) ?? '');
}

/* ── Glob expansion ── */
function expandGlob(pattern: string, vfs: VirtualFileSystem): string[] {
  if (!pattern.includes('*')) return [pattern];

  const lastSlash = pattern.lastIndexOf('/');
  let dirPath: string;
  let globPart: string;
  if (lastSlash >= 0) {
    dirPath = pattern.slice(0, lastSlash) || '/';
    globPart = pattern.slice(lastSlash + 1);
  } else {
    dirPath = '.';
    globPart = pattern;
  }

  const entries = vfs.listDir(dirPath);
  if (!entries) return [pattern];

  const re = new RegExp('^' + globPart.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
  const matches = entries.filter(e => re.test(e.name)).map(e => {
    const prefix = dirPath === '.' ? '' : dirPath + '/';
    return prefix + e.name;
  });
  return matches.length > 0 ? matches : [pattern];
}

/* ── Redirect parsing ── */
interface Redirect {
  type: '>' | '>>';
  path: string;
}

function parseRedirect(input: string): { commandPart: string; redirect: Redirect | null } {
  // Check >> first (must come before >)
  const appendMatch = input.match(/^(.*?)\s*>>\s*(\S+)\s*$/);
  if (appendMatch) {
    return { commandPart: appendMatch[1].trim(), redirect: { type: '>>', path: appendMatch[2] } };
  }
  const writeMatch = input.match(/^(.*?)\s*>\s*(\S+)\s*$/);
  if (writeMatch) {
    return { commandPart: writeMatch[1].trim(), redirect: { type: '>', path: writeMatch[2] } };
  }
  return { commandPart: input, redirect: null };
}

/* ── Main entry point ── */
export function executeCommand(
  input: string,
  vfs: VirtualFileSystem,
  env?: Map<string, string>,
  git?: VirtualGit | null,
  curlMocks?: Record<string, string>,
): ExecutionResult {
  const envMap = env ?? new Map();
  const expanded = expandEnvVars(input.trim(), envMap);

  // Parse redirect from the full command
  const { commandPart, redirect } = parseRedirect(expanded);

  // Split on pipes
  const segments = commandPart.split('|').map(s => s.trim()).filter(Boolean);
  if (segments.length === 0) return { output: '', isError: false };

  // Execute pipeline
  let pipeInput = '';
  let lastResult: ExecutionResult = { output: '', isError: false };

  for (const segment of segments) {
    lastResult = executeSingle(segment, vfs, envMap, pipeInput, git, curlMocks);
    if (lastResult.isError) return lastResult;
    if (lastResult.clearedScreen) return lastResult;
    pipeInput = lastResult.output;
  }

  // Apply redirect
  if (redirect) {
    const resolvedPath = vfs.resolvePath(redirect.path);
    if (redirect.type === '>>') {
      const existing = vfs.readFile(redirect.path) ?? '';
      const newContent = existing ? existing + '\n' + lastResult.output : lastResult.output;
      vfs.writeFile(resolvedPath, newContent);
    } else {
      vfs.writeFile(resolvedPath, lastResult.output);
    }
    return { output: '', isError: false };
  }

  return lastResult;
}

/* ── Single command executor ── */
function executeSingle(
  input: string,
  vfs: VirtualFileSystem,
  env: Map<string, string>,
  pipeInput: string,
  git?: VirtualGit | null,
  curlMocks?: Record<string, string>,
): ExecutionResult {
  const tokens = tokenize(input);
  const command = tokens[0] || '';
  const args = tokens.slice(1);

  switch (command) {
    case 'pwd':    return cmdPwd(vfs);
    case 'ls':     return cmdLs(args, vfs);
    case 'cd':     return cmdCd(args, vfs);
    case 'mkdir':  return cmdMkdir(args, vfs);
    case 'touch':  return cmdTouch(args, vfs);
    case 'rm':     return cmdRm(args, vfs);
    case 'cp':     return cmdCp(args, vfs);
    case 'mv':     return cmdMv(args, vfs);
    case 'cat':    return cmdCat(args, vfs, pipeInput);
    case 'head':   return cmdHead(args, vfs, pipeInput);
    case 'tail':   return cmdTail(args, vfs, pipeInput);
    case 'echo':   return cmdEcho(args);
    case 'grep':   return cmdGrep(args, vfs, pipeInput);
    case 'wc':     return cmdWc(args, vfs, pipeInput);
    case 'export': return cmdExport(args, env);
    case 'env':    return cmdEnv(env);
    case 'git':    return cmdGit(args, git);
    case 'curl':   return cmdCurl(args, curlMocks);
    case 'clear':  return { output: '', isError: false, clearedScreen: true };
    case 'help':   return cmdHelp();
    default:
      return {
        output: `Command not found: "${command}". Type 'help' to see available commands.`,
        isError: true,
      };
  }
}

/* ── Backward compat ── */
export function parseCommand(input: string): { command: string; args: string[] } {
  const tokens = tokenize(input.trim());
  return { command: tokens[0] || '', args: tokens.slice(1) };
}

/* ════════════════════════════════════════════
   Level 1 commands (unchanged logic)
   ════════════════════════════════════════════ */

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
    return { output: `No such file or directory: "${targetPath || '.'}"`, isError: true };
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
  if (!target || target === '~') {
    vfs.setCwd(vfs.getHome());
    return { output: '', isError: false };
  }

  const resolved = vfs.resolvePath(target);
  const nodeType = vfs.getNodeType(target);

  if (nodeType === null) {
    return { output: `No such directory: "${target}". Use 'ls' to see what's in the current folder.`, isError: true };
  }
  if (nodeType === 'file') {
    return { output: `"${target}" is a file, not a folder. You can only cd into folders.`, isError: true };
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
    if (vfs.exists(name)) continue;
    const ok = vfs.createFile(name);
    if (!ok) {
      const parts = name.split('/');
      parts.pop();
      const parentDir = parts.join('/') || '.';
      return { output: `Can't create file: the folder "${parentDir}" doesn't exist. Create it first with mkdir.`, isError: true };
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
      return { output: `Can't remove "${name}": it's a folder. Use 'rm -r ${name}' to delete folders.`, isError: true };
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

/* ════════════════════════════════════════════
   Level 2 commands
   ════════════════════════════════════════════ */

function cmdCat(args: string[], vfs: VirtualFileSystem, pipeInput: string): ExecutionResult {
  // If piped input and no file args, pass through
  if (args.length === 0 && pipeInput) {
    return { output: pipeInput, isError: false };
  }
  if (args.length === 0) {
    return { output: 'Usage: cat <file> [file2 ...]', isError: true };
  }

  const outputs: string[] = [];
  for (const arg of args) {
    const expanded = expandGlob(arg, vfs);
    for (const filePath of expanded) {
      const content = vfs.readFile(filePath);
      if (content === null) {
        return { output: `No such file: "${filePath}".`, isError: true };
      }
      outputs.push(content);
    }
  }

  return { output: outputs.join('\n'), isError: false };
}

function cmdHead(args: string[], vfs: VirtualFileSystem, pipeInput: string): ExecutionResult {
  let lineCount = 10;
  const fileArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && i + 1 < args.length) {
      lineCount = parseInt(args[++i]) || 10;
    } else if (args[i].startsWith('-')) {
      // ignore other flags
    } else {
      fileArgs.push(args[i]);
    }
  }

  let text: string;
  if (fileArgs.length > 0) {
    const content = vfs.readFile(fileArgs[0]);
    if (content === null) return { output: `No such file: "${fileArgs[0]}".`, isError: true };
    text = content;
  } else if (pipeInput) {
    text = pipeInput;
  } else {
    return { output: 'Usage: head [-n N] <file>', isError: true };
  }

  const lines = text.split('\n').slice(0, lineCount);
  return { output: lines.join('\n'), isError: false };
}

function cmdTail(args: string[], vfs: VirtualFileSystem, pipeInput: string): ExecutionResult {
  let lineCount = 10;
  const fileArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && i + 1 < args.length) {
      lineCount = parseInt(args[++i]) || 10;
    } else if (args[i].startsWith('-')) {
      // ignore other flags
    } else {
      fileArgs.push(args[i]);
    }
  }

  let text: string;
  if (fileArgs.length > 0) {
    const content = vfs.readFile(fileArgs[0]);
    if (content === null) return { output: `No such file: "${fileArgs[0]}".`, isError: true };
    text = content;
  } else if (pipeInput) {
    text = pipeInput;
  } else {
    return { output: 'Usage: tail [-n N] <file>', isError: true };
  }

  const lines = text.split('\n');
  const result = lines.slice(Math.max(0, lines.length - lineCount));
  return { output: result.join('\n'), isError: false };
}

function cmdEcho(args: string[]): ExecutionResult {
  return { output: args.join(' '), isError: false };
}

function cmdGrep(args: string[], vfs: VirtualFileSystem, pipeInput: string): ExecutionResult {
  const flags = new Set<string>();
  const nonFlagArgs: string[] = [];

  for (const arg of args) {
    if (arg.startsWith('-') && arg.length > 1 && !/^\d/.test(arg.slice(1))) {
      for (const ch of arg.slice(1)) flags.add(ch);
    } else {
      nonFlagArgs.push(arg);
    }
  }

  const caseInsensitive = flags.has('i');
  const recursive = flags.has('r');
  const countOnly = flags.has('c');

  if (nonFlagArgs.length === 0) {
    return { output: 'Usage: grep [-i] [-r] [-c] "pattern" [file]', isError: true };
  }

  const pattern = nonFlagArgs[0];
  const re = new RegExp(pattern, caseInsensitive ? 'i' : '');

  // Pipe input mode
  if (pipeInput && nonFlagArgs.length === 1) {
    const lines = pipeInput.split('\n').filter(line => re.test(line));
    if (countOnly) return { output: String(lines.length), isError: false };
    return { output: lines.join('\n'), isError: false };
  }

  const targets = nonFlagArgs.slice(1);
  if (targets.length === 0 && !pipeInput) {
    return { output: 'Usage: grep [-i] [-r] [-c] "pattern" <file>', isError: true };
  }

  // If pipe input + file args, treat as filter (just use pipe input)
  if (pipeInput && targets.length === 0) {
    const lines = pipeInput.split('\n').filter(line => re.test(line));
    if (countOnly) return { output: String(lines.length), isError: false };
    return { output: lines.join('\n'), isError: false };
  }

  const results: string[] = [];
  let totalCount = 0;
  const multiFile = targets.length > 1 || recursive;

  for (const target of targets) {
    const expandedPaths = expandGlob(target, vfs);
    for (const filePath of expandedPaths) {
      if (recursive && vfs.isDir(filePath)) {
        // Recursively search all files under this dir
        const allFiles = vfs.getAllFilePaths(vfs.resolvePath(filePath));
        for (const fp of allFiles) {
          const content = vfs.readFile(fp);
          if (content === null) continue;
          const lines = content.split('\n').filter(line => re.test(line));
          if (countOnly) {
            totalCount += lines.length;
            if (multiFile) results.push(`${fp}:${lines.length}`);
          } else {
            for (const line of lines) {
              results.push(multiFile ? `${fp}:${line}` : line);
            }
          }
        }
      } else if (recursive && target === '.') {
        // grep -r pattern .
        const allFiles = vfs.getAllFilePaths(vfs.resolvePath('.'));
        for (const fp of allFiles) {
          const content = vfs.readFile(fp);
          if (content === null) continue;
          const lines = content.split('\n').filter(line => re.test(line));
          if (countOnly) {
            totalCount += lines.length;
            results.push(`${fp}:${lines.length}`);
          } else {
            for (const line of lines) {
              results.push(`${fp}:${line}`);
            }
          }
        }
      } else {
        const content = vfs.readFile(filePath);
        if (content === null) {
          return { output: `No such file: "${filePath}".`, isError: true };
        }
        const lines = content.split('\n').filter(line => re.test(line));
        if (countOnly) {
          totalCount += lines.length;
          if (multiFile) results.push(`${filePath}:${lines.length}`);
        } else {
          for (const line of lines) {
            results.push(multiFile ? `${filePath}:${line}` : line);
          }
        }
      }
    }
  }

  if (countOnly && !multiFile) return { output: String(totalCount), isError: false };
  return { output: results.join('\n'), isError: false };
}

function cmdWc(args: string[], vfs: VirtualFileSystem, pipeInput: string): ExecutionResult {
  const countLines = args.includes('-l');
  const fileArgs = args.filter(a => !a.startsWith('-'));

  let text: string;
  if (fileArgs.length > 0) {
    const content = vfs.readFile(fileArgs[0]);
    if (content === null) return { output: `No such file: "${fileArgs[0]}".`, isError: true };
    text = content;
  } else if (pipeInput) {
    text = pipeInput;
  } else {
    return { output: 'Usage: wc [-l] <file>', isError: true };
  }

  if (countLines) {
    const lines = text === '' ? 0 : text.split('\n').length;
    const suffix = fileArgs.length > 0 ? ` ${fileArgs[0]}` : '';
    return { output: `${lines}${suffix}`, isError: false };
  }

  // Default: lines words chars
  const lines = text === '' ? 0 : text.split('\n').length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  const suffix = fileArgs.length > 0 ? ` ${fileArgs[0]}` : '';
  return { output: `${lines} ${words} ${chars}${suffix}`, isError: false };
}

function cmdExport(args: string[], env: Map<string, string>): ExecutionResult {
  if (args.length === 0) {
    // Show all env vars
    const lines = Array.from(env.entries()).map(([k, v]) => `${k}=${v}`);
    return { output: lines.join('\n'), isError: false };
  }

  for (const arg of args) {
    const eqIdx = arg.indexOf('=');
    if (eqIdx < 0) {
      return { output: `Usage: export NAME=value`, isError: true };
    }
    const name = arg.slice(0, eqIdx);
    const value = arg.slice(eqIdx + 1);
    env.set(name, value);
  }

  return { output: '', isError: false };
}

function cmdEnv(env: Map<string, string>): ExecutionResult {
  const lines = Array.from(env.entries()).map(([k, v]) => `${k}=${v}`);
  return { output: lines.join('\n'), isError: false };
}

/* ════════════════════════════════════════════
   Level 3 commands (git)
   ════════════════════════════════════════════ */

function cmdGit(args: string[], git?: VirtualGit | null): ExecutionResult {
  if (!git) {
    return { output: 'fatal: not a git repository (or any of the parent directories): .git', isError: true };
  }

  const sub = args[0];
  if (!sub) {
    return { output: 'usage: git <command> [<args>]\n\nCommands: init, status, add, commit, log, diff, checkout, branch, merge, remote, push, pull, clone', isError: false };
  }

  switch (sub) {
    case 'init':
      return { output: git.init(), isError: false };

    case 'status':
      return { output: git.status(), isError: false };

    case 'add': {
      const paths = args.slice(1);
      if (paths.length === 0) return { output: 'Nothing specified, nothing added.\nUse "git add <file>" or "git add ."', isError: true };
      const result = git.add(paths);
      return { output: result, isError: result.startsWith('fatal') };
    }

    case 'commit': {
      const mIdx = args.indexOf('-m');
      if (mIdx === -1 || !args[mIdx + 1]) {
        return { output: 'error: switch `m\' requires a value', isError: true };
      }
      const message = args[mIdx + 1];
      const result = git.commit(message);
      const isErr = result.startsWith('nothing') || result.startsWith('Aborting');
      return { output: result, isError: isErr };
    }

    case 'log': {
      const oneline = args.includes('--oneline');
      const result = git.log(oneline);
      return { output: result, isError: result.startsWith('fatal') };
    }

    case 'diff':
      return { output: git.diff(), isError: false };

    case 'checkout': {
      if (args[1] === '-b' && args[2]) {
        const result = git.checkout(args[2], true);
        return { output: result, isError: result.startsWith('fatal') || result.startsWith('error') };
      }
      if (args[1] === '--' && args[2]) {
        // git checkout -- file (restore)
        const result = (git as unknown as { restoreFile: (path: string) => string }).restoreFile?.(args[2]);
        if (result) return { output: result, isError: result.startsWith('error') };
        // Fallback: use checkout with the path
        const r = git.checkout(args[2]);
        return { output: r, isError: r.startsWith('error') || r.startsWith('fatal') };
      }
      if (args[1]) {
        const result = git.checkout(args[1]);
        return { output: result, isError: result.startsWith('error') || result.startsWith('fatal') };
      }
      return { output: 'Usage: git checkout <branch> or git checkout -b <new-branch>', isError: true };
    }

    case 'branch': {
      const branchName = args[1];
      const result = git.branch(branchName);
      return { output: result, isError: result.startsWith('fatal') };
    }

    case 'merge': {
      if (!args[1]) return { output: 'Usage: git merge <branch>', isError: true };
      const result = git.merge(args[1]);
      return { output: result, isError: result.startsWith('merge:') };
    }

    case 'remote': {
      if (args[1] === 'add' && args[2] && args[3]) {
        const result = git.remoteAdd(args[2], args[3]);
        return { output: result, isError: result.startsWith('error') };
      }
      return { output: 'Usage: git remote add <name> <url>', isError: true };
    }

    case 'push': {
      const result = git.push(args[1], args[2]);
      return { output: result, isError: result.startsWith('fatal') || result.startsWith('error') };
    }

    case 'pull': {
      const result = git.pull();
      return { output: result, isError: false };
    }

    case 'clone': {
      if (!args[1]) return { output: 'Usage: git clone <url>', isError: true };
      const result = git.clone(args[1]);
      return { output: result, isError: false };
    }

    default:
      return { output: `git: '${sub}' is not a git command. See 'git help'.`, isError: true };
  }
}

/* ════════════════════════════════════════════
   Level 4B commands (curl)
   ════════════════════════════════════════════ */

function cmdCurl(args: string[], curlMocks?: Record<string, string>): ExecutionResult {
  if (!curlMocks) {
    return { output: 'curl: command not available in this environment', isError: true };
  }

  const flags = new Set<string>();
  let url = '';
  let method = 'GET';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-i' || arg === '--include') { flags.add('i'); }
    else if (arg === '-s' || arg === '--silent') { flags.add('s'); }
    else if (arg === '-v' || arg === '--verbose') { flags.add('v'); }
    else if (arg === '-X' || arg === '--request') { method = args[++i]?.toUpperCase() || 'GET'; }
    else if (arg === '-H' || arg === '--header') { i++; /* consume header value, not used for mocks */ }
    else if (arg === '-d' || arg === '--data' || arg === '--data-raw') { i++; /* consume body */ }
    else if (arg === '-o' || arg === '--output') { i++; }
    else if (arg.startsWith('-') && !arg.startsWith('--')) {
      // compound short flags like -si
      for (const ch of arg.slice(1)) {
        if (ch === 'i') flags.add('i');
        if (ch === 's') flags.add('s');
        if (ch === 'v') flags.add('v');
      }
    } else if (!arg.startsWith('-')) {
      url = arg;
    }
  }

  if (!url) {
    return { output: 'curl: no URL specified!\nUsage: curl [options] <url>', isError: true };
  }

  // Normalize URL: strip trailing slash for lookup
  const normalUrl = url.replace(/\/$/, '');

  // Try "METHOD url" key first (for non-GET), then bare URL
  const lookupKey = method !== 'GET' ? `${method} ${normalUrl}` : normalUrl;
  const body = curlMocks[lookupKey] ?? curlMocks[normalUrl];

  if (body === undefined) {
    // Extract hostname for a realistic error
    let host = url;
    try { host = new URL(url).hostname; } catch { /* keep raw url */ }
    return {
      output: `curl: (6) Could not resolve host: ${host}\nDouble-check the URL and try again.`,
      isError: true,
    };
  }

  if (flags.has('i')) {
    const headerBlock = [
      'HTTP/2 200',
      'content-type: application/json',
      `date: ${new Date().toUTCString()}`,
      'content-length: ' + body.length,
      '',
    ].join('\n');
    return { output: headerBlock + body, isError: false };
  }

  return { output: body, isError: false };
}

/* ════════════════════════════════════════════
   Help
   ════════════════════════════════════════════ */

function cmdHelp(): ExecutionResult {
  const commands = [
    ['pwd',              'Show current directory'],
    ['ls',               'List files and folders'],
    ['ls -l',            'List with details'],
    ['ls -a',            'List including hidden files'],
    ['cd <folder>',      'Move into a folder'],
    ['cd ..',            'Go up one folder'],
    ['cd ~',             'Go to home folder'],
    ['mkdir <name>',     'Create a folder'],
    ['mkdir -p <path>',  'Create nested folders'],
    ['touch <name>',     'Create an empty file'],
    ['rm <file>',        'Delete a file'],
    ['rm -r <folder>',   'Delete a folder and contents'],
    ['cp <src> <dest>',  'Copy a file'],
    ['mv <src> <dest>',  'Move or rename a file'],
    ['cat <file>',       'Display file contents'],
    ['head [-n N] <file>','Show first N lines'],
    ['tail [-n N] <file>','Show last N lines'],
    ['echo <text>',      'Print text to screen'],
    ['grep <pat> <file>','Search for text in files'],
    ['grep -i',          'Case-insensitive search'],
    ['grep -r <pat> .',  'Recursive search'],
    ['grep -c',          'Count matches'],
    ['wc -l <file>',     'Count lines in a file'],
    ['export KEY=val',   'Set environment variable'],
    ['cmd > file',       'Write output to file'],
    ['cmd >> file',      'Append output to file'],
    ['cmd1 | cmd2',      'Pipe output between commands'],
    ['curl <url>',       'Make an HTTP request'],
    ['curl -i <url>',    'Show response headers + body'],
    ['curl -X POST',     'Send a POST request'],
    ['curl -H "K: V"',   'Add a request header'],
    ['clear',            'Clear the screen'],
    ['help',             'Show this help message'],
  ];

  const maxCmd = Math.max(...commands.map(([c]) => c.length));
  const lines = commands.map(([cmd, desc]) => `  ${cmd.padEnd(maxCmd + 2)} ${desc}`);
  return { output: 'Available commands:\n' + lines.join('\n'), isError: false };
}
