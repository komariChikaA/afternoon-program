import {cp,mkdir,readFile,rm,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(root,'dist');
// Only clear this tool's generated directory, including on Windows.
if(path.dirname(out)!==root||path.basename(out)!=='dist')throw new Error('Unexpected build target');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const name of ['engine','game','editor','assets/generated'])await cp(path.join(root,name),path.join(out,name),{recursive:true});
for(const name of ['project.js','app.html','assets/ASSETS.md','assets/source/attribution.json','assets/source/music/gymnopedie-1.ogg']){
  const dest=path.join(out,name);await mkdir(path.dirname(dest),{recursive:true});await cp(path.join(root,name),dest);
}
await writeFile(path.join(out,'index.html'),await readFile(path.join(root,'app.html')));
await writeFile(path.join(out,'.nojekyll'),'');
const project=JSON.parse((await readFile(path.join(root,'project.js'),'utf8')).replace(/^window\.VN_PROJECT\s*=\s*/,'').replace(/;\s*$/,''));
for(const scene of project.scenes)for(const src of [scene.background?.src,scene.character?.src].filter(Boolean))await stat(path.join(out,src));
console.log(`Built ${out}: ${project.scenes.length} scenes, relative URLs, no research or test output`);
