// Inventories copy in every explicitly released HTML page and public UI script.
// Source inventory complements, but does not replace, real browser testing.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {Window} from 'happy-dom';
import {PUBLIC_RELEASE_FILES} from './public-release-manifest.mjs';

const htmlPaths=PUBLIC_RELEASE_FILES.filter(p=>p.endsWith('.html'));
const jsPaths=PUBLIC_RELEASE_FILES.filter(p=>p.endsWith('.js')&&!p.startsWith('vendor/'));
const records=[];
const forbidden=[
  /owner-provided certificate/i,
  /approved (?:résumé|resume|CV)/i,
  /as listed on the poster/i,
  /unlock your potential/i,
  /comprehensive ecosystem/i,
  /seamless integration/i,
  /transforming passion into purpose/i
];
const issues=[];
const shorten=s=>String(s||'').replace(/\s+/g,' ').trim();
function locate(el){
  if(!el)return '(unknown)';
  const closest=el.closest?.('[id]');
  if(closest)return '#'+closest.getAttribute('id');
  const pieces=[];
  for(let node=el,n=0;node&&node.tagName&&n<4;node=node.parentElement,n++){
    const parent=node.parentElement;
    const siblings=parent?[...parent.children].filter(x=>x.tagName===node.tagName):[];
    pieces.unshift(node.tagName.toLowerCase()+(siblings.length>1?':nth-of-type('+(siblings.indexOf(node)+1)+')':''));
  }
  return pieces.join(' > ');
}
function add(path,kind,selector,value,state){
  const text=shorten(value);
  if(!text)return;
  records.push({path,kind,selector,text,state});
  for(const rx of forbidden)if(rx.test(text))issues.push(path+' '+selector+': '+rx);
}
for(const path of htmlPaths){
  const win=new Window({url:'https://coach-nate.netlify.app/'+path});
  win.document.write(readFileSync(path,'utf8'));
  const doc=win.document;
  const walk=doc.createTreeWalker(doc.body,4);
  while(walk.nextNode()){
    const node=walk.currentNode;
    const el=node.parentElement;
    if(!el||['SCRIPT','STYLE','TEMPLATE'].includes(el.tagName))continue;
    const hidden=Boolean(el.closest('[hidden],[aria-hidden="true"]'));
    const closed=Boolean(el.closest('details:not([open])'));
    add(path,'text',locate(el),node.textContent,hidden?'hidden':closed?'closed-details':'default');
  }
  for(const el of doc.querySelectorAll('body *')){
    for(const [attr,kind] of [['alt','image-alt'],['title','title'],['placeholder','placeholder'],['aria-label','accessible-name']]){
      if(el.hasAttribute(attr))add(path,kind,locate(el),el.getAttribute(attr),'attribute');
    }
    if(['BUTTON','SUMMARY','A'].includes(el.tagName))
      add(path,el.tagName.toLowerCase()+'-label',locate(el),el.textContent,'control');
  }
  for(const el of doc.querySelectorAll('title,meta[name="description"],meta[property^="og:"],meta[name^="twitter:"]'))
    add(path,'head-metadata',el.tagName.toLowerCase(),el.tagName==='TITLE'?el.textContent:el.getAttribute('content'),'metadata');
  win.happyDOM.abort();
}
for(const path of jsPaths){
  const source=readFileSync(path,'utf8');
  const re=/(?:textContent|innerText|setCustomValidity)\s*=\s*(['"])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  for(const match of source.matchAll(re))add(path,'js-ui-literal','assignment',match[2],'script');
}
const summary={pageCount:htmlPaths.length,scriptCount:jsPaths.length,elementCount:records.length,issueCount:issues.length,kinds:Object.fromEntries([...new Set(records.map(r=>r.kind))].map(k=>[k,records.filter(r=>r.kind===k).length]))};
mkdirSync('qa-screenshots',{recursive:true});
writeFileSync('qa-screenshots/public-copy-inventory.json',JSON.stringify({summary,records},null,2)+'\n');
console.log('NAV source copy inventory:',JSON.stringify(summary));
if(issues.length){console.error('Public wording requiring editorial review:\n'+issues.join('\n'));process.exitCode=1;}
