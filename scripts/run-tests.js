const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const testDir = path.join(__dirname, '..', 'dist-test', 'tests');

if (!fs.existsSync(testDir)) {
  console.error('Error: dist-test/tests directory does not exist. Run tsc -p tsconfig.test.json first.');
  process.exit(1);
}

const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'))
  .sort()
  .map(file => path.join(testDir, file));

if (testFiles.length === 0) {
  console.error('Error: No .test.js files found in ' + testDir);
  process.exit(1);
}

console.log(`Running ${testFiles.length} test suites with node:test...`);
const result = spawnSync(process.execPath, ['--test', ...testFiles], { stdio: 'inherit' });
process.exit(result.status ?? 0);
