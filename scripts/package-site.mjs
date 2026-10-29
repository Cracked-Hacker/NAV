import {cpSync, mkdirSync, readdirSync, rmSync} from 'node:fs';

const output = '.site-build';
rmSync(output, {recursive:true,force:true});
mkdirSync(output);
for (const name of readdirSync('.')) {
  if (['account','classroom','vendor'].includes(name) || /\.(html|css|xml|txt)$/.test(name)) cpSync(name, `${output}/${name}`, {recursive:true});
}
console.log('Packaged public assets only; server source, tests, docs, and development dependencies are excluded.');
