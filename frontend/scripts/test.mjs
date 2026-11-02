import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const compiler = spawnSync(process.execPath, ['../node_modules/typescript/bin/tsc', '-p', 'tests/tsconfig.json'], {stdio:'inherit'});
if (compiler.status !== 0) process.exit(compiler.status ?? 1);
writeFileSync('.test-build/package.json', JSON.stringify({type:'commonjs'}));
const tests = spawnSync(process.execPath, ['--test', 'tests/contracts.test.cjs'], {stdio:'inherit'});
process.exit(tests.status ?? 1);
