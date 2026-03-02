import type { VirtualFileSystem } from '../vfs/VirtualFileSystem';
import type { FileSystemSpec } from '../lesson/types';

interface GitCommit {
  hash: string;
  message: string;
  timestamp: number;
  parentHash: string | null;
  snapshot: FileSystemSpec;
}

interface StagedFile {
  path: string;
  action: 'add' | 'modify' | 'delete';
}

function shortHash(): string {
  return Math.random().toString(16).slice(2, 9);
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export class VirtualGit {
  private commits = new Map<string, GitCommit>();
  private branches = new Map<string, string>(); // branch name → commit hash
  private currentBranch = 'main';
  private HEAD: string | null = null;
  private staging: StagedFile[] = [];
  private tracked = new Set<string>();
  private remotes = new Map<string, string>();
  private initialized = false;
  private lastSnapshot: FileSystemSpec | null = null;

  private vfs: VirtualFileSystem;

  constructor(vfs: VirtualFileSystem) {
    this.vfs = vfs;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  init(): string {
    if (this.initialized) {
      return 'Reinitialized existing Git repository';
    }
    this.initialized = true;
    this.currentBranch = 'main';
    this.lastSnapshot = deepClone(this.vfs.toJSON('/'));
    return 'Initialized empty Git repository in .git/';
  }

  private requireInit(): string | null {
    if (!this.initialized) return 'fatal: not a git repository (or any of the parent directories): .git';
    return null;
  }

  status(): string {
    const err = this.requireInit();
    if (err) return err;

    const lines: string[] = [`On branch ${this.currentBranch}`];

    if (this.commits.size === 0) {
      lines.push('', 'No commits yet', '');
    } else {
      lines.push('');
    }

    // Staged files
    if (this.staging.length > 0) {
      lines.push('Changes to be committed:');
      lines.push('  (use "git restore --staged <file>..." to unstage)');
      for (const s of this.staging) {
        const prefix = s.action === 'add' ? 'new file' : s.action === 'modify' ? 'modified' : 'deleted';
        lines.push(`\t${prefix}:   ${s.path}`);
      }
      lines.push('');
    }

    // Unstaged changes (compare current VFS to last snapshot)
    const currentFs = this.vfs.toJSON('/');
    const changes = this.diffSnapshots(this.lastSnapshot ?? {}, currentFs);
    const unstagedChanges = changes.filter(
      c => !this.staging.some(s => s.path === c.path)
    );

    const modified = unstagedChanges.filter(c => c.type === 'modify');
    if (modified.length > 0) {
      lines.push('Changes not staged for commit:');
      lines.push('  (use "git add <file>..." to update what will be committed)');
      for (const m of modified) {
        lines.push(`\tmodified:   ${m.path}`);
      }
      lines.push('');
    }

    // Untracked files
    const allFiles = this.vfs.getAllFilePaths('/');
    const untracked = allFiles.filter(f => !this.tracked.has(f) && !this.staging.some(s => s.path === f));
    if (untracked.length > 0) {
      lines.push('Untracked files:');
      lines.push('  (use "git add <file>..." to include in what will be committed)');
      for (const u of untracked) {
        lines.push(`\t${u}`);
      }
      lines.push('');
    }

    if (this.staging.length === 0 && modified.length === 0 && untracked.length === 0) {
      if (this.commits.size > 0) {
        lines.push('nothing to commit, working tree clean');
      } else {
        lines.push('nothing to commit (create/copy files and use "git add" to track)');
      }
    }

    return lines.join('\n');
  }

  add(paths: string[]): string {
    const err = this.requireInit();
    if (err) return err;

    for (const p of paths) {
      if (p === '.' || p === '-A') {
        // Stage all changes
        const allFiles = this.vfs.getAllFilePaths('/');
        for (const f of allFiles) {
          if (!this.tracked.has(f)) {
            this.staging = this.staging.filter(s => s.path !== f);
            this.staging.push({ path: f, action: 'add' });
          } else {
            // Check if modified
            const currentFs = this.vfs.toJSON('/');
            const changes = this.diffSnapshots(this.lastSnapshot ?? {}, currentFs);
            const changed = changes.find(c => c.path === f);
            if (changed) {
              this.staging = this.staging.filter(s => s.path !== f);
              this.staging.push({ path: f, action: changed.type as 'add' | 'modify' | 'delete' });
            }
          }
        }
        return '';
      }

      const resolved = this.vfs.resolvePath(p);
      if (!this.vfs.exists(p) && !this.vfs.exists(resolved)) {
        return `fatal: pathspec '${p}' did not match any files`;
      }

      const actualPath = this.vfs.isFile(p) ? this.vfs.resolvePath(p) : resolved;

      // If it's a directory, add all files within
      if (this.vfs.isDir(p)) {
        const files = this.vfs.getAllFilePaths(actualPath);
        for (const f of files) {
          this.staging = this.staging.filter(s => s.path !== f);
          this.staging.push({ path: f, action: this.tracked.has(f) ? 'modify' : 'add' });
        }
      } else {
        this.staging = this.staging.filter(s => s.path !== actualPath);
        this.staging.push({ path: actualPath, action: this.tracked.has(actualPath) ? 'modify' : 'add' });
      }
    }

    return '';
  }

  commit(message: string): string {
    const err = this.requireInit();
    if (err) return err;

    if (!message) return 'Aborting commit due to empty commit message.';
    if (this.staging.length === 0) {
      return 'nothing to commit, working tree clean';
    }

    const hash = shortHash();
    const snapshot = deepClone(this.vfs.toJSON('/'));

    const commit: GitCommit = {
      hash,
      message,
      timestamp: Date.now(),
      parentHash: this.HEAD,
      snapshot,
    };

    this.commits.set(hash, commit);
    this.HEAD = hash;
    this.branches.set(this.currentBranch, hash);

    // Track all staged files
    for (const s of this.staging) {
      if (s.action === 'delete') {
        this.tracked.delete(s.path);
      } else {
        this.tracked.add(s.path);
      }
    }

    const fileCount = this.staging.length;
    this.staging = [];
    this.lastSnapshot = deepClone(snapshot);

    return `[${this.currentBranch} ${hash}] ${message}\n ${fileCount} file${fileCount !== 1 ? 's' : ''} changed`;
  }

  log(oneline = false): string {
    const err = this.requireInit();
    if (err) return err;

    if (this.commits.size === 0) {
      return 'fatal: your current branch does not have any commits yet';
    }

    const commitList: GitCommit[] = [];
    let current = this.HEAD;
    while (current) {
      const c = this.commits.get(current);
      if (!c) break;
      commitList.push(c);
      current = c.parentHash;
    }

    if (oneline) {
      return commitList.map(c => `${c.hash} ${c.message}`).join('\n');
    }

    return commitList.map(c => {
      const date = new Date(c.timestamp).toLocaleString();
      return `commit ${c.hash}\nDate:   ${date}\n\n    ${c.message}\n`;
    }).join('\n');
  }

  diff(): string {
    const err = this.requireInit();
    if (err) return err;

    if (!this.lastSnapshot) return '';

    const currentFs = this.vfs.toJSON('/');
    const changes = this.diffSnapshots(this.lastSnapshot, currentFs);

    if (changes.length === 0) return '';

    const output: string[] = [];
    for (const change of changes) {
      if (change.type === 'add') {
        output.push(`diff --git a${change.path} b${change.path}`);
        output.push(`new file`);
        output.push(`--- /dev/null`);
        output.push(`+++ b${change.path}`);
        const lines = (change.newContent ?? '').split('\n');
        for (const line of lines) {
          output.push(`+${line}`);
        }
      } else if (change.type === 'modify') {
        output.push(`diff --git a${change.path} b${change.path}`);
        output.push(`--- a${change.path}`);
        output.push(`+++ b${change.path}`);
        const oldLines = (change.oldContent ?? '').split('\n');
        const newLines = (change.newContent ?? '').split('\n');
        for (const line of oldLines) {
          if (!newLines.includes(line)) output.push(`-${line}`);
        }
        for (const line of newLines) {
          if (!oldLines.includes(line)) output.push(`+${line}`);
        }
      } else if (change.type === 'delete') {
        output.push(`diff --git a${change.path} b${change.path}`);
        output.push(`deleted file`);
        output.push(`--- a${change.path}`);
        output.push(`+++ /dev/null`);
        const lines = (change.oldContent ?? '').split('\n');
        for (const line of lines) {
          output.push(`-${line}`);
        }
      }
      output.push('');
    }

    return output.join('\n');
  }

  checkout(target: string, createBranch = false): string {
    const err = this.requireInit();
    if (err) return err;

    if (target === '--' && arguments.length > 1) {
      // git checkout -- file (restore)
      return this.restoreFile(arguments[1] as string);
    }

    if (createBranch) {
      // git checkout -b name
      if (this.branches.has(target)) {
        return `fatal: a branch named '${target}' already exists`;
      }
      this.branches.set(target, this.HEAD ?? '');
      this.currentBranch = target;
      return `Switched to a new branch '${target}'`;
    }

    // Check if it's a branch
    if (this.branches.has(target)) {
      this.currentBranch = target;
      const branchHead = this.branches.get(target)!;
      if (branchHead && branchHead !== this.HEAD) {
        // Restore VFS to that branch's snapshot
        const commit = this.commits.get(branchHead);
        if (commit) {
          this.HEAD = branchHead;
          this.lastSnapshot = deepClone(commit.snapshot);
        }
      }
      this.HEAD = branchHead || this.HEAD;
      return `Switched to branch '${target}'`;
    }

    return `error: pathspec '${target}' did not match any file(s) known to git`;
  }

  private restoreFile(filePath: string): string {
    if (!this.lastSnapshot) return `error: pathspec '${filePath}' did not match any file(s) known to git`;

    const resolved = this.vfs.resolvePath(filePath);
    const content = this.getFileFromSnapshot(this.lastSnapshot, resolved);
    if (content === null) return `error: pathspec '${filePath}' did not match any file(s) known to git`;

    this.vfs.writeFile(resolved, content);
    return `Updated 1 path from the index`;
  }

  private getFileFromSnapshot(snapshot: FileSystemSpec, path: string): string | null {
    const parts = path.split('/').filter(Boolean);
    let current: FileSystemSpec | string = snapshot;
    for (const part of parts) {
      if (typeof current !== 'object' || current === null) return null;
      current = (current as Record<string, unknown>)[part] as FileSystemSpec | string;
      if (current === undefined) return null;
    }
    return typeof current === 'string' ? current : null;
  }

  branch(name?: string): string {
    const err = this.requireInit();
    if (err) return err;

    if (!name) {
      // List branches
      const lines = Array.from(this.branches.keys()).sort().map(b => {
        return b === this.currentBranch ? `* ${b}` : `  ${b}`;
      });
      return lines.join('\n');
    }

    if (this.branches.has(name)) {
      return `fatal: a branch named '${name}' already exists`;
    }

    this.branches.set(name, this.HEAD ?? '');
    return '';
  }

  merge(branchName: string): string {
    const err = this.requireInit();
    if (err) return err;

    if (!this.branches.has(branchName)) {
      return `merge: ${branchName} - not something we can merge`;
    }

    if (branchName === this.currentBranch) {
      return `Already up to date.`;
    }

    const otherHash = this.branches.get(branchName)!;
    const otherCommit = this.commits.get(otherHash);
    if (!otherCommit) return 'Already up to date.';

    // Simple merge: create a merge commit with the other branch's snapshot
    const hash = shortHash();
    const snapshot = deepClone(otherCommit.snapshot);

    const commit: GitCommit = {
      hash,
      message: `Merge branch '${branchName}' into ${this.currentBranch}`,
      timestamp: Date.now(),
      parentHash: this.HEAD,
      snapshot,
    };

    this.commits.set(hash, commit);
    this.HEAD = hash;
    this.branches.set(this.currentBranch, hash);
    this.lastSnapshot = deepClone(snapshot);

    return `Merge made by the 'ort' strategy.\n Already up to date.`;
  }

  remoteAdd(name: string, url: string): string {
    const err = this.requireInit();
    if (err) return err;

    if (this.remotes.has(name)) {
      return `error: remote ${name} already exists.`;
    }

    this.remotes.set(name, url);
    return '';
  }

  push(remote?: string, branch?: string): string {
    const err = this.requireInit();
    if (err) return err;

    const remoteName = remote || 'origin';
    const branchName = branch || this.currentBranch;

    if (!this.remotes.has(remoteName) && remoteName !== 'origin') {
      return `fatal: '${remoteName}' does not appear to be a git repository`;
    }

    if (this.commits.size === 0) {
      return `error: src refspec '${branchName}' does not match any`;
    }

    const url = this.remotes.get(remoteName) || 'https://github.com/user/project.git';
    return `Enumerating objects: done.\nCounting objects: done.\nWriting objects: 100%, done.\nTo ${url}\n * [new branch]      ${branchName} -> ${branchName}`;
  }

  pull(): string {
    const err = this.requireInit();
    if (err) return err;

    return 'Already up to date.';
  }

  clone(url: string): string {
    return `Cloning into '${url.split('/').pop()?.replace('.git', '') || 'project'}'...\nremote: Enumerating objects: done.\nremote: Counting objects: done.\nReceiving objects: 100%, done.`;
  }

  private diffSnapshots(
    oldSnap: FileSystemSpec,
    newSnap: FileSystemSpec,
  ): Array<{ path: string; type: 'add' | 'modify' | 'delete'; oldContent?: string; newContent?: string }> {
    const changes: Array<{ path: string; type: 'add' | 'modify' | 'delete'; oldContent?: string; newContent?: string }> = [];

    function walk(old: FileSystemSpec, curr: FileSystemSpec, prefix: string) {
      const allKeys = new Set([...Object.keys(old), ...Object.keys(curr)]);
      for (const key of allKeys) {
        const path = prefix + '/' + key;
        const oldVal = old[key];
        const newVal = curr[key];

        if (oldVal === undefined && newVal !== undefined) {
          // Added
          if (typeof newVal === 'string') {
            changes.push({ path, type: 'add', newContent: newVal });
          } else {
            walk({}, newVal as FileSystemSpec, path);
          }
        } else if (oldVal !== undefined && newVal === undefined) {
          // Deleted
          if (typeof oldVal === 'string') {
            changes.push({ path, type: 'delete', oldContent: oldVal });
          } else {
            walk(oldVal as FileSystemSpec, {}, path);
          }
        } else if (typeof oldVal === 'string' && typeof newVal === 'string') {
          if (oldVal !== newVal) {
            changes.push({ path, type: 'modify', oldContent: oldVal, newContent: newVal });
          }
        } else if (typeof oldVal === 'object' && typeof newVal === 'object') {
          walk(oldVal as FileSystemSpec, newVal as FileSystemSpec, path);
        }
      }
    }

    walk(oldSnap, newSnap, '');
    return changes;
  }
}
