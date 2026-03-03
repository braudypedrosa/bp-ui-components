import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as sass from 'sass-embedded';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'src/styles');
const destinationDir = path.join(rootDir, 'dist/styles');
const scssFiles = (await readdir(sourceDir)).filter((entry) => entry.endsWith('.scss'));

await rm(destinationDir, { recursive: true, force: true });
await mkdir(destinationDir, { recursive: true });

await Promise.all(scssFiles.map(async (fileName) => {
  const result = await sass.compileAsync(path.join(sourceDir, fileName), {
    style: 'expanded',
    sourceMap: false,
  });
  const cssFileName = fileName.replace(/\.scss$/, '.css');
  await writeFile(path.join(destinationDir, cssFileName), result.css);
}));
