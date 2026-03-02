# Level 2 Spec: "Reading and Writing Files"

## Overview

| Field | Value |
|-------|-------|
| Level | 2 |
| Title | Reading and Writing Files |
| Subtitle | Look inside files, search for text, and chain commands together |
| Lessons | 12 |
| Type | Hands-on in sandbox terminal |
| Prerequisite | Level 1 |
| MVP | Yes |

## Learning Objectives

By the end of Level 2, the student can:

1. View file contents with `cat`
2. View portions of files with `head` and `tail`
3. Print text to the terminal with `echo`
4. Write text to files using `>` (overwrite) and `>>` (append)
5. Search for text inside files with `grep`
6. Search recursively across directories with `grep -r`
7. Chain commands together using the pipe `|`
8. Count lines, words, and characters with `wc`
9. Understand and use environment variables
10. Combine multiple commands to accomplish complex tasks

## Lessons

---

### Lesson 2.1: Looking Inside Files (`cat`)

**Initial FS**:
```
/home/user/project/
  readme.txt: "Welcome to my project.\nThis is a simple website.\nVersion 1.0"
  config.txt: "theme=dark\nlanguage=en\nport=3000"
  index.html: "<html>\n<head><title>My Site</title></head>\n<body>\n<h1>Hello World</h1>\n</body>\n</html>"
```

**Initial directory**: `/home/user/project`

**Instruction**: "You know how to see what files exist. Now let's look inside them."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Read the contents of `readme.txt`: type `cat readme.txt`." | `cat readme.txt` | "`cat` dumps the entire file to your screen. Short for 'concatenate' — but think of it as 'show me what's inside'." |
| 2 | "Now read `config.txt`." | `cat config.txt` | "A config file! These key=value pairs are how programs store settings. You'll see a lot of these." |
| 3 | "Read `index.html`." | `cat index.html` | "HTML! This is the code behind every web page. Looks intimidating now, but you'll be writing this soon." |

**Tip**: "`cat` is best for short files. For long files, use `head` or `tail` — coming up next."

**Command Reference Added**: `cat file` — show file contents

---

### Lesson 2.2: Peeking at the Top (`head`)

**Initial FS**:
```
/home/user/project/
  log.txt: (50 lines of server log entries, timestamped)
  data.csv: (30 lines of comma-separated data with a header row)
```

**Initial directory**: `/home/user/project`

**Instruction**: "Sometimes files are long and you just want to see the beginning."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Look at the first 10 lines of `log.txt`: `head log.txt`." | `head log.txt` | "By default, `head` shows the first 10 lines. Useful for getting a quick look at large files." |
| 2 | "Just want the first 3 lines? Use `head -n 3 log.txt`." | `head -n 3 log.txt` | "`-n 3` means 'just 3 lines'. You can use any number." |
| 3 | "Check the header of `data.csv` — just the first line." | `head -n 1 data.csv` | "The first line of a CSV is usually the column headers. Now you know what data this file contains without reading all of it." |

**Command Reference Added**: `head file` — show first 10 lines, `head -n N file` — show first N lines

---

### Lesson 2.3: Peeking at the End (`tail`)

**Initial FS**: Same as 2.2

**Initial directory**: `/home/user/project`

**Instruction**: "Log files grow over time — the newest entries are at the bottom. `tail` shows you the end."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "See the last 10 lines of `log.txt`: `tail log.txt`." | `tail log.txt` | "These are the most recent log entries. When debugging, you almost always want the end of the log." |
| 2 | "Just the last 3 lines: `tail -n 3 log.txt`." | `tail -n 3 log.txt` | "Same pattern as `head` — `-n` controls how many lines." |
| 3 | "See the last entry of the data file." | `tail -n 1 data.csv` | "Quick way to see the last record." |

**Command Reference Added**: `tail file` — show last 10 lines, `tail -n N file` — show last N lines

---

### Lesson 2.4: Printing Text (`echo`)

**Initial FS**:
```
/home/user/project/
  (empty)
```

**Initial directory**: `/home/user/project`

**Instruction**: "`echo` prints text to the screen. It seems simple, but it's a building block for much more."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Type `echo \"Hello, world\"`." | `echo "Hello, world"` | "The terminal printed your text back. `echo` = 'repeat what I say'." |
| 2 | "Try `echo \"My name is $USER\"`." | `echo "My name is $USER"` | "`$USER` is an environment variable — the terminal replaced it with your username. More on variables later." |
| 3 | "Try without quotes: `echo Hello world`." | `echo Hello world` | "Works too — quotes are optional for simple text. But use them when your text has special characters." |

**Command Reference Added**: `echo "text"` — print text to screen

---

### Lesson 2.5: Writing to Files (`>`)

**Initial FS**: Same as 2.4 (empty)

**Initial directory**: `/home/user/project`

**Instruction**: "Here's where `echo` becomes powerful. You can redirect its output into a file instead of the screen."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Create a file with content: `echo \"Hello, world\" > greeting.txt`." | `echo "Hello, world" > greeting.txt` | "The `>` symbol redirected the output into a file instead of printing it. The file was created automatically." |
| 2 | "Verify it worked." | `cat greeting.txt` | "There it is: 'Hello, world'. You just wrote to a file without opening an editor." |
| 3 | "Now run `echo \"Goodbye\" > greeting.txt`." | `echo "Goodbye" > greeting.txt` | "Check the file now..." |
| 4 | "Read the file again." | `cat greeting.txt` | "'Hello, world' is gone. `>` OVERWRITES the entire file. This is important to remember." |

**Warning Box**: "`>` replaces everything in the file. If you want to add to a file without erasing it, use `>>` (next lesson)."

**Command Reference Added**: `echo "text" > file` — write text to file (overwrites)

---

### Lesson 2.6: Appending to Files (`>>`)

**Initial FS**:
```
/home/user/project/
  shopping.txt: "Apples\nBread"
```

**Initial directory**: `/home/user/project`

**Instruction**: "What if you want to ADD to a file instead of replacing it?"

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Read the current shopping list." | `cat shopping.txt` | "Two items: Apples and Bread." |
| 2 | "Add an item: `echo \"Milk\" >> shopping.txt`." | `echo "Milk" >> shopping.txt` | "`>>` APPENDS — it adds to the end without deleting what's there." |
| 3 | "Verify." | `cat shopping.txt` | "Three items now: Apples, Bread, Milk. The original content is still there." |
| 4 | "Add one more item yourself. Use `>>` to add 'Eggs'." | `echo "Eggs" >> shopping.txt` | "Four items. You're building a file line by line." |

**Key Takeaway Box**:
```
>   = overwrite (replaces everything)
>>  = append (adds to the end)

Use > when you want a fresh start.
Use >> when you want to add to what's already there.
```

**Command Reference Added**: `echo "text" >> file` — append text to file

---

### Lesson 2.7: Copying File Contents (`cat` with `>`)

**Initial FS**:
```
/home/user/project/
  original.txt: "This is the original file.\nIt has important content.\nDon't lose it."
```

**Initial directory**: `/home/user/project`

**Instruction**: "You can combine `cat` with `>` to copy content between files."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Copy the contents of original.txt to backup.txt: `cat original.txt > backup.txt`." | `cat original.txt > backup.txt` | "`cat` read the file, `>` sent the output to a new file. The content was copied." |
| 2 | "Verify." | `cat backup.txt` | "Same content as the original. This is different from `cp` — that copies the file itself, this copies the contents." |

**Tip**: "This technique is the building block for more powerful combinations coming up."

---

### Lesson 2.8: Searching Inside Files (`grep`)

**Initial FS**:
```
/home/user/project/
  app.js: "// Main application\nconst port = 3000;\nconsole.log('Starting server...');\nconst db = 'mongodb://localhost';\nconsole.log('Connected to database');\n// TODO: add error handling\nconsole.log('Server running on port ' + port);"
  config.txt: "port=3000\nhost=localhost\ndebug=true\nlog_level=info"
  readme.txt: "This is my project.\nIt runs on port 3000.\nSee config.txt for settings."
```

**Initial directory**: `/home/user/project`

**Instruction**: "The most useful command you'll learn today. `grep` searches for text inside files — like Ctrl+F, but for the terminal."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Find every line containing 'port' in app.js: `grep \"port\" app.js`." | `grep "port" app.js` | "Two lines matched. `grep` shows every line that contains your search text." |
| 2 | "Search for 'console' in app.js." | `grep "console" app.js` | "Three lines with console.log. This is how developers find specific code in files." |
| 3 | "Search is case-sensitive by default. Try `grep \"TODO\" app.js`." | `grep "TODO" app.js` | "Found the TODO comment. If you wanted case-insensitive search, use `grep -i`." |
| 4 | "Try case-insensitive: `grep -i \"todo\" app.js`." | `grep -i "todo" app.js` | "Same result. `-i` means 'ignore case' — useful when you're not sure about capitalization." |

**Command Reference Added**: `grep "text" file` — search for text in a file, `grep -i` — case-insensitive

---

### Lesson 2.9: Searching Across Folders (`grep -r`)

**Initial FS**: Same as 2.8

**Initial directory**: `/home/user/project`

**Instruction**: "What if you don't know which file contains the text you're looking for?"

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Search for 'port' in ALL files in this folder: `grep -r \"port\" .`" | `grep -r "port" .` | "Found 'port' in three files! The `-r` flag means 'recursive' — search this folder and all subfolders. The `.` means 'start here'." |
| 2 | "Search for 'localhost' across all files." | `grep -r "localhost" .` | "Found in app.js and config.txt. This is incredibly useful in real projects with hundreds of files." |

**Key Insight Box**: "Imagine a project with 500 files and you need to find where a database connection is configured. `grep -r \"database\" .` finds it in seconds. This is why developers love the terminal."

**Command Reference Added**: `grep -r "text" folder` — search all files in a folder

---

### Lesson 2.10: Chaining Commands with Pipes (`|`)

**Initial FS**:
```
/home/user/project/
  server.log: (100 lines of log entries, some containing "ERROR", some "WARNING", some "INFO")
```

**Initial directory**: `/home/user/project`

**Instruction**: "This is one of the most powerful ideas in the terminal: taking the output of one command and feeding it into another."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Find all ERROR lines in the log: `grep \"ERROR\" server.log`." | `grep "ERROR" server.log` | "Several error lines. But what if there were hundreds? You might just want the first few." |
| 2 | "Pipe the results to `head`: `grep \"ERROR\" server.log | head -n 3`." | `grep "ERROR" server.log \| head -n 3` | "The `|` (pipe) took the output of `grep` and passed it to `head`. You got only the first 3 errors." |
| 3 | "Pipe is like an assembly line: each command does one job and passes the result to the next. Try: `cat server.log | grep \"WARNING\" | tail -n 5`." | `cat server.log \| grep "WARNING" \| tail -n 5` | "Three commands chained: read file → filter warnings → show last 5. Each `|` passes output to the next command." |

**Analogy Box**: "Pipes are like an assembly line in a factory. Raw material (data) enters one end, each station (command) transforms it, and the finished product comes out the other end."

**Command Reference Added**: `command1 | command2` — pipe output from one command to another

---

### Lesson 2.11: Counting with `wc`

**Initial FS**: Same as 2.10

**Initial directory**: `/home/user/project`

**Instruction**: "How many lines are in this file? How many errors? `wc` counts for you."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Count the lines in server.log: `wc -l server.log`." | `wc -l server.log` | "`-l` counts lines. A 100-line log file." |
| 2 | "How many errors? Combine with grep: `grep \"ERROR\" server.log | wc -l`." | `grep "ERROR" server.log \| wc -l` | "Grep found the error lines, then `wc -l` counted them. This is a pattern you'll use all the time." |
| 3 | "How many warnings?" | `grep "WARNING" server.log \| wc -l` | "You just wrote a mini analytics pipeline — search then count." |

**Command Reference Added**: `wc -l file` — count lines in a file

---

### Lesson 2.12: Environment Variables

**Initial FS**:
```
/home/user/project/
  deploy.sh: "echo \"Deploying to $SERVER\"\necho \"Port: $PORT\""
```

**Initial directory**: `/home/user/project`

**Instruction**: "Environment variables are like settings that your terminal session remembers. Programs use them to get configuration without hardcoding values."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "See a built-in variable: `echo $HOME`." | `echo $HOME` | "That's your home directory path. `$HOME` is a variable the system sets automatically." |
| 2 | "See another: `echo $USER`." | `echo $USER` | "Your username. Programs use these to know who's running them and where things are." |
| 3 | "Create your own: `export SERVER=production`." | `export SERVER=production` | "`export` creates a variable. Now `$SERVER` equals 'production'." |
| 4 | "Use it: `echo \"Deploying to $SERVER\"`." | `echo "Deploying to $SERVER"` | "The terminal replaced `$SERVER` with 'production'. This is how deployment scripts work — same script, different variables for different environments." |
| 5 | "Set the port: `export PORT=8080`." | `export PORT=8080` | "Now read the deploy script to see how it uses these variables." |
| 6 | "Read the script: `cat deploy.sh`." | `cat deploy.sh` | "See `$SERVER` and `$PORT`? When this script runs, those get replaced with whatever values you set. This is how one script works across different servers." |

**Key Takeaway Box**:
```
Environment variables:
  - Set with:   export NAME=value
  - Read with:  $NAME or echo $NAME
  - Used for:   Configuration, secrets, settings
  - Examples:   $HOME, $USER, $PATH (built-in)

In Level 7, you'll use these to store API keys and database URLs.
```

**Command Reference Added**: `export VAR=value` — set a variable, `echo $VAR` — read a variable

---

## Level 2 Final Challenge: Detective Work

**Initial FS**:
```
/home/user/project/
  logs/
    monday.log: (20 lines, 2 ERRORs, 5 WARNINGs)
    tuesday.log: (25 lines, 0 ERRORs, 3 WARNINGs)
    wednesday.log: (30 lines, 5 ERRORs, 8 WARNINGs)
    thursday.log: (15 lines, 1 ERROR, 2 WARNINGs)
    friday.log: (35 lines, 0 ERRORs, 1 WARNING)
  src/
    app.js: (contains "TODO" comments and a database connection string)
    config.js: (contains port and host settings)
```

**Instruction**: "You're an ops engineer. The server had a bad week. Find out what happened."

**Tasks** (no step-by-step, student figures out commands):

1. How many total lines of logs are there this week?
   - Answer: `cat logs/*.log | wc -l` or `wc -l logs/*.log`
2. Which day had the most errors?
   - Answer: `grep -c "ERROR" logs/*.log` (shows count per file)
3. How many total errors across all days?
   - Answer: `grep -r "ERROR" logs/ | wc -l`
4. What's the database connection string in the source code?
   - Answer: `grep -r "database\|mongodb\|postgres" src/`
5. Are there any TODO items the developer left behind?
   - Answer: `grep -r "TODO" src/`

**On Completion**:
```
Level 2 Complete: Reading and Writing Files

You can now:
  - Read any file from the terminal
  - Write and append to files without an editor
  - Search for text across entire projects
  - Chain commands together to answer complex questions
  - Use environment variables for configuration

The key insight: The terminal isn't just for moving files around.
You can search, analyze, and transform data faster than any
graphical tool. That grep + wc combo? That's real data analysis.

Next up: Level 3 — Your Code Has a History
You'll learn git: the tool that means you never have to be
afraid of breaking things again.

[Start Level 3 ->]
```

## Technical Notes

### New Command Parser Requirements

Must support all Level 1 commands plus:
- `cat file` — output file contents
- `head file`, `head -n N file` — first N lines (default 10)
- `tail file`, `tail -n N file` — last N lines (default 10)
- `echo "text"`, `echo text` — print to stdout
- `echo "text" > file` — write to file (create or overwrite)
- `echo "text" >> file` — append to file
- `grep "pattern" file` — search file for text
- `grep -i "pattern" file` — case-insensitive search
- `grep -r "pattern" dir` — recursive search
- `grep -c "pattern" file` — count matches
- `wc -l file` — count lines
- `|` (pipe) — redirect stdout to next command's stdin
- `export VAR=value` — set environment variable
- `$VAR` expansion in echo and other commands
- Wildcard support: `*.log`, `logs/*.log`

### Pipe Implementation

The command parser must support chaining. Approach:
1. Split input on `|`
2. Execute first command, capture output
3. Pass output as input to next command
4. Repeat for each pipe segment
5. Display final output

Supported pipe chains for MVP:
- `grep ... | head ...`
- `grep ... | tail ...`
- `grep ... | wc -l`
- `cat ... | grep ...`
- `cat ... | grep ... | wc -l`
- `cat ... | grep ... | head ...`
- `cat ... | grep ... | tail ...`

### Visual Explorer Updates

For Level 2, the Visual Explorer should also:
- Show file content previews (first few lines) when a file is selected
- Highlight files that were just modified (written to with > or >>)
- Show a "modified" indicator on files that changed during the session
