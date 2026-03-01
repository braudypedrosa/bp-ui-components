import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const requiredExports = Object.fromEntries(
  Object.entries(packageJson.exports || {})
    .filter(([, target]) => typeof target === 'string' && target.startsWith('./dist/styles/')),
);

for (const [key, expectedTarget] of Object.entries(requiredExports)) {
  const actualTarget = packageJson.exports?.[key];

  if (actualTarget !== expectedTarget) {
    throw new Error(`Expected package export "${key}" to point to "${expectedTarget}", received "${actualTarget}"`);
  }

  await access(path.join(rootDir, actualTarget));
}
