export interface FileNode {
  type: 'file';
  name: string;
  content: string;
}

export interface DirNode {
  type: 'dir';
  name: string;
  children: Map<string, FSNode>;
}

export type FSNode = FileNode | DirNode;
