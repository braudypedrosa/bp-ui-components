import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'src/styles');
const destinationDir = path.join(rootDir, 'dist/styles');
const styleFiles = (await readdir(sourceDir)).filter((entry) => entry.endsWith('.css'));

await rm(destinationDir, { recursive: true, force: true });
await mkdir(destinationDir, { recursive: true });

await Promise.all(styleFiles.map((fileName) => (
  cp(path.join(sourceDir, fileName), path.join(destinationDir, fileName))
)));
