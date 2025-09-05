// tailwind-init.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tailwindPath = path.resolve('node_modules', 'tailwindcss', 'lib', 'cli.js');

if (!fs.existsSync(tailwindPath)) {
  console.error('Tailwind CSS not found in node_modules!');
  process.exit(1);
}

execSync(`node ${tailwindPath} init -p`, { stdio: 'inherit' });
