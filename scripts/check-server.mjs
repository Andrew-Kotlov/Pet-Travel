import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const base = fileURLToPath(new URL('../server/', import.meta.url));
for (const file of readdirSync(base, { recursive: true }).filter(f => f.endsWith('.js') && !f.includes('node_modules'))) {
  const result = spawnSync(process.execPath, ['--check', base + file], { stdio: 'inherit' });
  if (result.status) process.exit(result.status);
}
console.log('Server JavaScript syntax verified');
