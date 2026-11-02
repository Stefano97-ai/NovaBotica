import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root = path.resolve('src');
const files = fs.readdirSync(root, {recursive:true}).filter(file => /\.tsx?$/.test(file));
const failures = [];
const rank = {domain:0,application:1,infrastructure:2,presentation:2};
function layer(file) { return file.split('/').find(part => part in rank); }
for (const file of files) {
  const relative = file.replaceAll('\\','/');
  const source = ts.createSourceFile(relative, fs.readFileSync(path.join(root,file),'utf8'), ts.ScriptTarget.Latest, true);
  const ownLayer = layer(relative);
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (!specifier.startsWith('.')) {
        if (ownLayer === 'domain' || ownLayer === 'application') failures.push(`${relative}: inner layer imports ${specifier}`);
      } else {
        const target = path.relative(root,path.resolve(path.dirname(path.join(root,file)),specifier)).replaceAll('\\','/');
        const targetLayer = layer(target);
        if (ownLayer && target.startsWith('app/')) failures.push(`${relative}: depends on app composition`);
        if (ownLayer && targetLayer && (rank[targetLayer] > rank[ownLayer] || (ownLayer === 'presentation' && targetLayer === 'infrastructure') || (ownLayer === 'infrastructure' && targetLayer === 'presentation'))) failures.push(`${relative}: forbidden ${ownLayer} -> ${targetLayer}`);
        if (relative.startsWith('shared/') && target.startsWith('features/')) failures.push(`${relative}: shared depends on feature`);
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(source);
  if (ownLayer === 'presentation' && /\b(fetch|localStorage)\b/.test(source.text)) failures.push(`${relative}: direct transport/storage access`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Architecture OK: ${files.length} source files, inward dependencies and no presentation HTTP/storage.`);
