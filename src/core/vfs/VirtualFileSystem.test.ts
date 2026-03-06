import { describe, it, expect } from 'vitest';
import { VirtualFileSystem } from './VirtualFileSystem';

describe('VirtualFileSystem', () => {
  describe('constructor — home vs cwd separation (#34)', () => {
    it('defaults home to /home/user and cwd to home', () => {
      const vfs = new VirtualFileSystem();
      expect(vfs.getHome()).toBe('/home/user');
      expect(vfs.getCwd()).toBe('/home/user');
    });

    it('sets home and cwd independently', () => {
      const vfs = new VirtualFileSystem(undefined, '/home/user', '/home/user/projects');
      expect(vfs.getHome()).toBe('/home/user');
      expect(vfs.getCwd()).toBe('/home/user/projects');
    });

    it('ensures both home and cwd directories exist', () => {
      const vfs = new VirtualFileSystem(undefined, '/home/user', '/home/user/projects');
      expect(vfs.isDir('/home/user')).toBe(true);
      expect(vfs.isDir('/home/user/projects')).toBe(true);
    });
  });

  describe('cd ~ resolves to home, not cwd (#34)', () => {
    it('tilde resolves to home when cwd differs', () => {
      const vfs = new VirtualFileSystem(undefined, '/home/user', '/home/user/projects');
      expect(vfs.resolvePath('~')).toBe('/home/user');
    });

    it('tilde prefix resolves relative to home', () => {
      const vfs = new VirtualFileSystem(
        { home: { user: { docs: { 'notes.txt': 'hello' } } } },
        '/home/user',
        '/home/user/projects',
      );
      expect(vfs.resolvePath('~/docs/notes.txt')).toBe('/home/user/docs/notes.txt');
    });

    it('setCwd to ~ navigates to home directory', () => {
      const vfs = new VirtualFileSystem(undefined, '/home/user', '/home/user/projects');
      vfs.setCwd('~');
      expect(vfs.getCwd()).toBe('/home/user');
    });
  });

  describe('basic file operations', () => {
    it('creates and reads files', () => {
      const vfs = new VirtualFileSystem();
      vfs.createFile('test.txt', 'hello');
      expect(vfs.readFile('test.txt')).toBe('hello');
    });

    it('creates and navigates directories', () => {
      const vfs = new VirtualFileSystem();
      vfs.createDir('mydir');
      expect(vfs.setCwd('mydir')).toBe(true);
      expect(vfs.getCwd()).toBe('/home/user/mydir');
    });

    it('navigates up with ..', () => {
      const vfs = new VirtualFileSystem(undefined, '/home/user', '/home/user');
      vfs.createDir('a');
      vfs.setCwd('a');
      expect(vfs.getCwd()).toBe('/home/user/a');
      vfs.setCwd('..');
      expect(vfs.getCwd()).toBe('/home/user');
    });
  });
});
