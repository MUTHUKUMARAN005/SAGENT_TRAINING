const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const child = spawn('cmd.exe', ['/c', 'npm', 'start'], {
  cwd: projectRoot,
  detached: true,
  stdio: 'ignore',
  env: {
    ...process.env,
    PORT: '3000',
    BROWSER: 'none',
  },
});

child.unref();
console.log(`Started npm start in background (pid ${child.pid})`);
