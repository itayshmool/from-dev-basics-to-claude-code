import type { FSNode, DirNode, FileNode } from './types';
import type { FileSystemSpec } from '../lesson/types';

export class VirtualFileSystem {
  private root: DirNode;
  private cwd: string;
  private home: string;

  constructor(spec?: FileSystemSpec, home = '/home/user') {
    this.root = { type: 'dir', name: '', children: new Map() };
    this.home = home;
    this.cwd = home;
    if (spec) {
      this.buildFromSpec(spec, this.root);
    }
    // Ensure home directory exists
    this.ensureDir(home);
  }

  private buildFromSpec(spec: FileSystemSpec, parent: DirNode): void {
    for (const [name, value] of Object.entries(spec)) {
      if (typeof value === 'string') {
        parent.children.set(name, { type: 'file', name, content: value });
      } else {
        const dir: DirNode = { type: 'dir', name, children: new Map() };
        parent.children.set(name, dir);
        this.buildFromSpec(value, dir);
      }
    }
  }

  private ensureDir(path: string): void {
    const parts = path.split('/').filter(Boolean);
    let current = this.root;
    for (const part of parts) {
      if (!current.children.has(part)) {
        const dir: DirNode = { type: 'dir', name: part, children: new Map() };
        current.children.set(part, dir);
      }
      const child = current.children.get(part);
      if (child?.type === 'dir') {
        current = child;
      }
    }
  }

  resolvePath(input: string): string {
    let target = input;
    if (target === '~') return this.home;
    if (target.startsWith('~/')) target = this.home + target.slice(1);
    if (!target.startsWith('/')) target = this.cwd + '/' + target;

    const parts = target.split('/').filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') { resolved.pop(); continue; }
      resolved.push(part);
    }
    return '/' + resolved.join('/');
  }

  private getNode(path: string): FSNode | null {
    if (path === '/') return this.root;
    const parts = path.split('/').filter(Boolean);
    let current: FSNode = this.root;
    for (const part of parts) {
      if (current.type !== 'dir') return null;
      const child = current.children.get(part);
      if (!child) return null;
      current = child;
    }
    return current;
  }

  getCwd(): string { return this.cwd; }
  getHome(): string { return this.home; }

  setCwd(path: string): boolean {
    const resolved = this.resolvePath(path);
    const node = this.getNode(resolved);
    if (node?.type === 'dir') { this.cwd = resolved; return true; }
    return false;
  }

  listDir(path?: string): FSNode[] | null {
    const resolved = path ? this.resolvePath(path) : this.cwd;
    const node = this.getNode(resolved);
    if (node?.type !== 'dir') return null;
    return Array.from(node.children.values()).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  readFile(path: string): string | null {
    const node = this.getNode(this.resolvePath(path));
    if (node?.type === 'file') return node.content;
    return null;
  }

  createFile(path: string, content = ''): boolean {
    const resolved = this.resolvePath(path);
    const parts = resolved.split('/').filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) return false;
    const parentPath = '/' + parts.join('/');
    const parent = this.getNode(parentPath);
    if (parent?.type !== 'dir') return false;
    parent.children.set(fileName, { type: 'file', name: fileName, content });
    return true;
  }

  createDir(path: string, recursive = false): boolean {
    const resolved = this.resolvePath(path);
    const parts = resolved.split('/').filter(Boolean);
    if (recursive) {
      this.ensureDir(resolved);
      return true;
    }
    const dirName = parts.pop();
    if (!dirName) return false;
    const parentPath = '/' + parts.join('/');
    const parent = this.getNode(parentPath);
    if (parent?.type !== 'dir') return false;
    if (parent.children.has(dirName)) return false;
    parent.children.set(dirName, { type: 'dir', name: dirName, children: new Map() });
    return true;
  }

  deleteNode(path: string, recursive = false): boolean {
    const resolved = this.resolvePath(path);
    const parts = resolved.split('/').filter(Boolean);
    const name = parts.pop();
    if (!name) return false;
    const parentPath = '/' + parts.join('/');
    const parent = this.getNode(parentPath);
    if (parent?.type !== 'dir') return false;
    const node = parent.children.get(name);
    if (!node) return false;
    if (node.type === 'dir' && !recursive) return false;
    parent.children.delete(name);
    return true;
  }

  exists(path: string): boolean {
    return this.getNode(this.resolvePath(path)) !== null;
  }

  isDir(path: string): boolean {
    const node = this.getNode(this.resolvePath(path));
    return node?.type === 'dir';
  }

  isFile(path: string): boolean {
    const node = this.getNode(this.resolvePath(path));
    return node?.type === 'file';
  }

  toJSON(path = '/'): FileSystemSpec {
    const node = this.getNode(path);
    if (!node || node.type === 'file') return {};
    const result: FileSystemSpec = {};
    for (const [name, child] of node.children) {
      if (child.type === 'file') {
        result[name] = (child as FileNode).content;
      } else {
        result[name] = this.toJSON(path === '/' ? '/' + name : path + '/' + name);
      }
    }
    return result;
  }
}
