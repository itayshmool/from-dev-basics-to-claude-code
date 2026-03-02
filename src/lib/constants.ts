export const LEVELS = [
  { id: 0, title: 'Computers Are Not Magic', subtitle: 'Files, folders, paths, and what a terminal actually is', lessonCount: 6, mvp: true },
  { id: 1, title: 'Your First 30 Minutes in the Terminal', subtitle: 'Navigate, create, and manage files like a developer', lessonCount: 12, mvp: true },
  { id: 2, title: 'Reading and Writing Files', subtitle: 'Look inside files, search for text, and chain commands together', lessonCount: 12, mvp: true },
  { id: 3, title: 'Your Code Has a History', subtitle: 'Git and GitHub — never lose your work again', lessonCount: 16, mvp: false },
  { id: 4, title: 'How Software Actually Works', subtitle: 'Client, server, APIs, databases, and the cloud — demystified', lessonCount: 14, mvp: false },
  { id: 5, title: 'Building With Real Tools', subtitle: 'Install Node.js, run code, build a real server', lessonCount: 15, mvp: false },
  { id: 6, title: 'Claude Code — Your AI Pair Programmer', subtitle: 'Build real projects by describing what you want', lessonCount: 15, mvp: false },
  { id: 7, title: 'Junior Developer Patterns', subtitle: 'Debug, deploy, and work like a professional', lessonCount: 12, mvp: false },
] as const;

export const APP_NAME = 'Terminal Trainer';
export const STORAGE_KEY = 'terminal-trainer-progress';
