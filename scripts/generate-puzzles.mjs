import fs from 'node:fs';
// Original clue bank. Deterministic generation; no scraped or licensed puzzles.
const bank = fs.readFileSync('data/words.txt','utf8').trim().split('\n').map(line => {const [answer,clue]=line.split('|');return {answer,clue};});
if(new Set(bank.map(w=>w.answer)).size!==bank.length) throw Error('Duplicate answer');
let seed=132718; const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const SIZE=9, puzzles=[], signatures=new Set(), sets=new Set();
function build(){
 const g=Array.from({length:SIZE},()=>Array(SIZE).fill('.')), used=Array.from({length:SIZE},()=>Array(SIZE).fill(0)), entries=[];
 const get=(r,c)=>g[r]?.[c]??'.';
 function fit(w,r,c,d){const dr=d==='down'?1:0,dc=1-dr,bit=dr?2:1;
  if(r<0||c<0||r+dr*(w.length-1)>=SIZE||c+dc*(w.length-1)>=SIZE)return -1;
  if(get(r-dr,c-dc)!=='.'||get(r+dr*w.length,c+dc*w.length)!=='.')return -1;
  let cross=0;
  for(let i=0;i<w.length;i++){const y=r+dr*i,x=c+dc*i,old=get(y,x);
   if(old!=='.'){if(old!==w[i]||(used[y][x]&bit))return -1;cross++;}
   else if(get(y-dc,x-dr)!=='.'||get(y+dc,x+dr)!=='.')return -1;
  }return cross;
 }
 function put(w,r,c,d){for(let i=0;i<w.answer.length;i++){const y=r+(d==='down'?i:0),x=c+(d==='across'?i:0);g[y][x]=w.answer[i];used[y][x]|=d==='down'?2:1;}entries.push({...w,row:r,col:c,direction:d});}
 const words=shuffle(bank);const first=words.find(w=>w.answer.length>=5&&w.answer.length<=7);put(first,4,Math.floor((SIZE-first.answer.length)/2),'across');
 for(let pass=0;pass<2;pass++) for(const w of words){if(entries.some(e=>e.answer===w.answer))continue;const spots=[];
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)for(const d of ['across','down']){const cross=fit(w.answer,r,c,d);if(cross>0)spots.push({r,c,d,score:cross+random()*.8});}
  if(spots.length){spots.sort((a,b)=>b.score-a.score);const s=spots[0];put(w,s.r,s.c,s.d);} if(entries.length>=12)break;
 }
 if(entries.length<9)return null;
 const rows=g.map(r=>r.join('')); const key=rows.join('');const wordset=entries.map(e=>e.answer).sort().join(',');
 if(signatures.has(key)||sets.has(wordset))return null;
 signatures.add(key);sets.add(wordset);
 const starts=[...new Set(entries.map(e=>e.row*SIZE+e.col))].sort((a,b)=>a-b);
 entries.forEach(e=>e.number=starts.indexOf(e.row*SIZE+e.col)+1);entries.sort((a,b)=>a.number-b.number||a.direction.localeCompare(b.direction));
 return {id:puzzles.length+1,size:SIZE,rows,entries};
}
while(puzzles.length<3000){const p=build();if(p)puzzles.push(p);if(puzzles.length%500===0&&p)console.log(puzzles.length);}
fs.writeFileSync('data/puzzles.json',JSON.stringify(puzzles));
console.log(`${puzzles.length} unique puzzles; ${bank.length} original clues`);
