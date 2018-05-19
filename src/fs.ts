import * as fs from 'fs';
import * as _mkdirp from 'mkdirp';

export const existsAsync = (p: string) =>
  new Promise(resolve => fs.exists(p, resolve));
export const tryReadAsync = (p: string) =>
  new Promise<string | null>((resolve, reject) => {
    fs.readFile(p, 'utf-8', (err, content) => {
      if (err && err.code === 'ENOENT') {
        return resolve(null);
      }

      if (err) {
        return reject(err);
      }

      return resolve(content);
    });
  });

export const mkdirp = (p: string) =>
  new Promise<void>((resolve, reject) =>
    _mkdirp(p, err => {
      if (err) {
        return reject(err);
      }

      return resolve();
    }),
  );

export const write = (p: string, content: string) =>
  new Promise<void>((resolve, reject) =>
    fs.writeFile(p, content, 'utf-8', err => {
      if (err) {
        return reject(err);
      }

      return resolve();
    }),
  );
