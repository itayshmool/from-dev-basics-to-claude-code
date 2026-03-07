export interface AssessmentQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface LevelAssessment {
  levelId: number;
  questions: AssessmentQuestion[];
  passingScore: number; // fraction, e.g. 0.8 = 80%
}

export const LEVEL_ASSESSMENTS: LevelAssessment[] = [
  {
    levelId: 0,
    passingScore: 0.8,
    questions: [
      { question: 'What is a terminal?', options: ['A web browser', 'A text-based interface for controlling your computer', 'A type of programming language', 'A file manager'], correctIndex: 1 },
      { question: 'What does a file path describe?', options: ['How large a file is', 'The exact location of a file on your computer', 'When a file was created', 'Who owns a file'], correctIndex: 1 },
      { question: 'What character separates folders in a file path?', options: ['Dot (.)', 'Dash (-)', 'Forward slash (/)', 'Comma (,)'], correctIndex: 2 },
      { question: 'What is the "root" of a file system?', options: ['The home folder', 'The top-level folder that contains everything', 'The desktop', 'The recycle bin'], correctIndex: 1 },
      { question: 'What is a file extension (like .txt or .html)?', options: ['The file size', 'A hint about what type of content the file contains', 'The file creation date', 'The file owner'], correctIndex: 1 },
    ],
  },
  {
    levelId: 1,
    passingScore: 0.8,
    questions: [
      { question: 'What does the `pwd` command do?', options: ['Creates a new file', 'Prints the current directory path', 'Deletes a folder', 'Lists files'], correctIndex: 1 },
      { question: 'What does `cd ..` do?', options: ['Go to the home directory', 'Go up one directory level', 'Create a new directory', 'Clear the terminal'], correctIndex: 1 },
      { question: 'What does `mkdir` stand for?', options: ['Move directory', 'Make directory', 'Map directory', 'Modify directory'], correctIndex: 1 },
      { question: 'How do you create an empty file called notes.txt?', options: ['make notes.txt', 'new notes.txt', 'touch notes.txt', 'create notes.txt'], correctIndex: 2 },
      { question: 'What does `ls` show you?', options: ['The current date', 'Files and folders in the current directory', 'Your command history', 'System information'], correctIndex: 1 },
      { question: 'What does `rm` do?', options: ['Renames a file', 'Removes/deletes a file', 'Reads a file', 'Restores a file'], correctIndex: 1 },
    ],
  },
  {
    levelId: 2,
    passingScore: 0.8,
    questions: [
      { question: 'What does `cat filename` do?', options: ['Creates a file', 'Displays the entire contents of a file', 'Copies a file', 'Counts lines in a file'], correctIndex: 1 },
      { question: 'What does `head -n 5 file.txt` show?', options: ['The last 5 lines', 'The first 5 lines', '5 random lines', 'Every 5th line'], correctIndex: 1 },
      { question: 'What does the pipe symbol (|) do?', options: ['Deletes output', 'Sends one command\'s output as input to another', 'Saves output to a file', 'Runs two commands simultaneously'], correctIndex: 1 },
      { question: 'What does `grep "hello" file.txt` do?', options: ['Deletes lines containing hello', 'Searches for lines containing "hello"', 'Replaces hello with something else', 'Counts the word hello'], correctIndex: 1 },
      { question: 'What does `>` do when used after a command?', options: ['Runs the next command', 'Redirects output to a file (overwriting it)', 'Appends to a file', 'Pipes to another command'], correctIndex: 1 },
    ],
  },
  {
    levelId: 3,
    passingScore: 0.8,
    questions: [
      { question: 'What does `git init` do?', options: ['Downloads a repository', 'Starts tracking changes in a folder', 'Creates a GitHub account', 'Commits your changes'], correctIndex: 1 },
      { question: 'What is the staging area in git?', options: ['Where you write code', 'A holding zone for changes you want to include in the next commit', 'The GitHub website', 'A backup folder'], correctIndex: 1 },
      { question: 'What does `git commit -m "message"` do?', options: ['Uploads code to GitHub', 'Saves a permanent snapshot of staged changes', 'Stages all files', 'Creates a new branch'], correctIndex: 1 },
      { question: 'What is the relationship between git and GitHub?', options: ['They are the same thing', 'Git tracks changes locally, GitHub stores them online', 'GitHub is a programming language', 'Git only works with GitHub'], correctIndex: 1 },
      { question: 'What does `git push` do?', options: ['Downloads code from GitHub', 'Uploads your commits to GitHub', 'Creates a new repository', 'Stages all changes'], correctIndex: 1 },
      { question: 'What does `git clone` do?', options: ['Creates a new branch', 'Downloads an entire project from GitHub', 'Stages all files', 'Merges two branches'], correctIndex: 1 },
    ],
  },
  {
    levelId: 4,
    passingScore: 0.8,
    questions: [
      { question: 'What is code?', options: ['Binary ones and zeros', 'Text instructions that tell a computer what to do', 'A secret language only experts know', 'A type of file'], correctIndex: 1 },
      { question: 'What is a variable in programming?', options: ['A type of file', 'A named container that stores a value', 'A command you type in the terminal', 'A programming language'], correctIndex: 1 },
      { question: 'What does an API do?', options: ['Stores files on your computer', 'Lets two programs communicate with each other', 'Creates websites', 'Compiles code'], correctIndex: 1 },
      { question: 'What is a server?', options: ['A type of programming language', 'A computer that responds to requests from other computers', 'A file on your desktop', 'A web browser'], correctIndex: 1 },
      { question: 'What is a database?', options: ['A type of server', 'An organized collection of data that programs can read and write', 'A programming language', 'A web browser plugin'], correctIndex: 1 },
    ],
  },
  {
    levelId: 45,
    passingScore: 0.8,
    questions: [
      { question: 'What does HTTP stand for?', options: ['Home Text Transfer Path', 'HyperText Transfer Protocol', 'High Tech Transfer Program', 'Hosted Terminal Transfer Protocol'], correctIndex: 1 },
      { question: 'What does a GET request do?', options: ['Sends data to a server', 'Retrieves/reads data from a server', 'Deletes data', 'Updates data'], correctIndex: 1 },
      { question: 'What is JSON?', options: ['A programming language', 'A lightweight data format using key-value pairs', 'A type of server', 'A terminal command'], correctIndex: 1 },
      { question: 'What does `curl` do?', options: ['Compiles code', 'Makes HTTP requests from the command line', 'Creates files', 'Manages git repositories'], correctIndex: 1 },
      { question: 'What does a 404 status code mean?', options: ['Success', 'Server error', 'Resource not found', 'Unauthorized'], correctIndex: 2 },
    ],
  },
  {
    levelId: 5,
    passingScore: 0.8,
    questions: [
      { question: 'What is Node.js?', options: ['A web browser', 'A JavaScript runtime that lets you run JS outside the browser', 'A database', 'A text editor'], correctIndex: 1 },
      { question: 'What does `npm install` do?', options: ['Installs Node.js', 'Downloads project dependencies listed in package.json', 'Creates a new project', 'Runs your code'], correctIndex: 1 },
      { question: 'What is package.json?', options: ['A JavaScript file', 'A file that lists your project\'s dependencies and metadata', 'A configuration for git', 'A database schema'], correctIndex: 1 },
      { question: 'What does `node server.js` do?', options: ['Compiles the file', 'Runs the JavaScript file using Node.js', 'Creates a new file', 'Opens a web browser'], correctIndex: 1 },
      { question: 'What is a port number (like 3000)?', options: ['A file permission', 'A network address where a server listens for connections', 'A version number', 'A process ID'], correctIndex: 1 },
    ],
  },
  {
    levelId: 6,
    passingScore: 0.8,
    questions: [
      { question: 'What is Claude Code?', options: ['A programming language', 'An AI assistant that helps you write code from natural language', 'A text editor', 'A version of git'], correctIndex: 1 },
      { question: 'What makes a good prompt for Claude Code?', options: ['Being as vague as possible', 'Being specific about what you want and providing context', 'Using only technical jargon', 'Writing in code instead of English'], correctIndex: 1 },
      { question: 'What is a "context window" in AI?', options: ['A browser tab', 'The amount of text/code the AI can consider at once', 'A type of terminal', 'A file viewer'], correctIndex: 1 },
      { question: 'What should you do if Claude Code generates incorrect code?', options: ['Start over completely', 'Describe what\'s wrong and ask it to fix the specific issue', 'Ignore the error', 'Switch to a different programming language'], correctIndex: 1 },
      { question: 'What is iterative prompting?', options: ['Writing code in a loop', 'Refining your request through multiple back-and-forth exchanges', 'Running the same command repeatedly', 'A type of debugging'], correctIndex: 1 },
    ],
  },
  {
    levelId: 7,
    passingScore: 0.8,
    questions: [
      { question: 'What is debugging?', options: ['Writing new code', 'Finding and fixing errors in your code', 'Deploying to production', 'Writing documentation'], correctIndex: 1 },
      { question: 'What does "deploying" mean?', options: ['Writing code', 'Making your application available on the internet', 'Testing locally', 'Creating a git branch'], correctIndex: 1 },
      { question: 'What is an environment variable?', options: ['A JavaScript variable', 'A configuration value set outside your code (like API keys)', 'A CSS property', 'A git branch name'], correctIndex: 1 },
      { question: 'What is the purpose of a README file?', options: ['To store passwords', 'To explain what a project does and how to use it', 'To list all files', 'To configure the server'], correctIndex: 1 },
      { question: 'What is a pull request?', options: ['Downloading code', 'A proposal to merge your changes into a shared codebase', 'A git command', 'A bug report'], correctIndex: 1 },
    ],
  },
];
