import { spawn } from 'node:child_process';
const children = ['server', 'client'].map(name => spawn(process.execPath, [process.env.npm_execpath, 'run', 'dev', '--workspace', name], { stdio: 'inherit' }));
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; for (const child of children) child.kill(); process.exitCode = code; }
children.forEach(child => child.on('exit', code => stop(code || 0)));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
