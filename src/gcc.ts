// import * as vscode from 'vscode';
import * as execa from 'execa';
import * as fs from 'fs';

const memoizeAsync = <T>(asyncFn: () => Promise<T>) => {
  let p: Promise<T> | null = null;

  return () => {
    if (p !== null) {
      return p;
    }

    p = asyncFn();
    return p;
  };
};

const verboseGcc = memoizeAsync(async () => {
  try {
    const proc = execa('gcc', ['-xc++', '-E', '-v', '-'], {
      stdin: 'pipe',
    });
    proc.stdin.end();
    const { stderr } = await proc;

    return stderr;
  } catch (e) {
    return ""; // No gcc or failure in execution 
  }
});

const parseGcc = (output: string) => {
  const lines = output
    .trim()
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter(s => s.trim().length > 0);
  const paths = [];
  let reading = false;
  for (const line of lines) {
    if (reading) {
      if (!line.startsWith(' ')) {
        reading = false;
      } else {
        const path = line.trim();
        if (fs.existsSync(path)) {
          paths.push(path);
        }
        continue;
      }
    }

    if (line.trim().endsWith('search starts here:')) {
      reading = true;
    }
  }

  return paths;
};

export const getGccSearchPaths = memoizeAsync(async () => {
  const gccOutput = await verboseGcc();
  return parseGcc(gccOutput);
});
