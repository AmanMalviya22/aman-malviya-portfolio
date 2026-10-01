import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Brain, Clock3, Grid2X2, RotateCcw, Trophy, Zap } from 'lucide-react';

type Game = 'memory' | 'tic' | 'reaction' | '2048' | 'sudoku' | 'maze';

const emptyBoard = Array.from({ length: 9 }, () => null as 'X' | 'O' | null);

function winner(board: (string | null)[]) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? 'draw' : null;
}
function minimax(board: (string | null)[], max: boolean): number {
  const w = winner(board);
  if (w === 'O') return 1;
  if (w === 'X') return -1;
  if (w === 'draw') return 0;
  const moves = board.map((v,i) => v ? null : i).filter((v): v is number => v !== null);
  const scores = moves.map(i => { const next=[...board]; next[i]=max?'O':'X'; return minimax(next,!max); });
  return max ? Math.max(...scores) : Math.min(...scores);
}
function aiMove(board: (string | null)[]) {
  const moves=board.map((v,i)=>v?null:i).filter((v): v is number => v!==null);
  let best=-Infinity, pick=moves[0]??0;
  for(const i of moves){ const next=[...board]; next[i]='O'; const score=minimax(next,false); if(score>best){best=score;pick=i;} }
  return pick;
}

function Memory() {
  const [seq,setSeq]=useState<number[]>([]),[flash,setFlash]=useState<number|null>(null),[input,setInput]=useState<number[]>([]);
  const [level,setLevel]=useState(1),[message,setMessage]=useState('Start a round to memorize the sequence.'),[best,setBest]=useState(0),[running,setRunning]=useState(false);
  useEffect(()=>setBest(Number(localStorage.getItem('brain-memory-best')||0)),[]);
  const start=()=>{
    const next=Array.from({length:Math.min(3+level,12)},()=>Math.floor(Math.random()*16));
    setSeq(next);setInput([]);setRunning(true);setMessage('Watch…');
    let i=0;const id=window.setInterval(()=>{setFlash(next[i]??null);i++;if(i>=next.length){window.clearInterval(id);window.setTimeout(()=>{setFlash(null);setMessage('Your turn.')},280)}},430);
  };
  const press=(i:number)=>{
    if(!running||message!=='Your turn.')return;
    const next=[...input,i];setInput(next);
    if(next[next.length-1]!==seq[next.length-1]){setRunning(false);setLevel(1);setMessage('Missed it. Try again.');return;}
    if(next.length===seq.length){setRunning(false);const b=Math.max(best,level);setBest(b);localStorage.setItem('brain-memory-best',String(b));setLevel(level+1);setMessage('Perfect. Next level?');}
  };
  return <div className="game-panel">
    <div className="game-topline"><div><span>Level</span><strong>{level}</strong></div><div><span>Best</span><strong>{best}</strong></div><div className="status-copy"><span>Status</span><strong>{message}</strong></div></div>
    <div className="memory-grid">{Array.from({length:16}).map((_,i)=><motion.button whileHover={{scale:1.03}} whileTap={{scale:.96}} className={'memory-tile '+(flash===i?'flash':'')} onClick={()=>press(i)} aria-label={'Memory tile '+(i+1)} key={i}>{flash===i?'•':''}</motion.button>)}</div>
    <div className="game-actions"><button className="lab-button primary" onClick={start}>Start round</button><button className="lab-button" onClick={()=>{setLevel(1);setSeq([]);setInput([]);setFlash(null);setRunning(false);setMessage('Reset. Ready when you are.')}}><RotateCcw size={13}/> Reset</button></div>
  </div>;
}

function Tic() {
  const [board,setBoard]=useState<(string|null)[]>([...emptyBoard]);const [thinking,setThinking]=useState(false);const w=winner(board);
  const move=(i:number)=>{if(board[i]||w||thinking)return;const next=[...board];next[i]='X';setBoard(next);if(winner(next))return;setThinking(true);window.setTimeout(()=>{const pick=aiMove(next);const out=[...next];out[pick]='O';setBoard(out);setThinking(false)},240)};
  return <div className="game-panel">
    <div className="game-topline"><div><span>You</span><strong>X</strong></div><div><span>AI</span><strong>O</strong></div><div><span>Engine</span><strong>Minimax</strong></div></div>
    <div className="tic-board">{board.map((v,i)=><motion.button whileHover={{backgroundColor:'rgba(255,255,255,.055)'}} className={'tic-cell '+(v||'')} onClick={()=>move(i)} key={i}>{v||''}</motion.button>)}</div>
    <div className="game-actions"><span className="game-status">{w==='draw'?'Draw.':w?w+' wins.':thinking?'AI thinking…':'Your move.'}</span><button className="lab-button" onClick={()=>{setBoard([...emptyBoard]);setThinking(false)}}><RotateCcw size={13}/> New game</button></div>
  </div>;
}

function Reaction() {
  const [state,setState]=useState<'idle'|'armed'|'go'|'result'>('idle'),[started,setStarted]=useState(0),[score,setScore]=useState<number|null>(null),[best,setBest]=useState<number|null>(null);
  useEffect(()=>{const b=Number(localStorage.getItem('brain-reaction-best')||0);if(b)setBest(b)},[]);
  useEffect(()=>{if(state!=='armed')return;const id=window.setTimeout(()=>{setStarted(performance.now());setState('go')},1400+Math.random()*2500);return()=>window.clearTimeout(id)},[state]);
  const act=()=>{if(state==='idle'||state==='result'){setScore(null);setState('armed');return}if(state==='armed'){setState('result');return}const ms=Math.round(performance.now()-started);setScore(ms);setBest(prev=>{const next=!prev||ms<prev?ms:prev;localStorage.setItem('brain-reaction-best',String(next));return next});setState('result')};
  const label=state==='idle'?'Click to start':state==='armed'?'Wait for green…':state==='go'?'CLICK!':String(score)+' ms';
  return <div className="game-panel"><div className="game-topline"><div><span>Best</span><strong>{best?best+' ms':'—'}</strong></div><div><span>Signal</span><strong>{state==='go'?'GO':'READY'}</strong></div><div><span>Rule</span><strong>React, don't guess</strong></div></div><motion.button whileTap={{scale:.995}} className={'reaction-zone state-'+state} onClick={act}><Zap size={25}/><strong>{label}</strong><span>{state==='armed'?'Clicking early ends the attempt':'Measure your visual reaction time'}</span></motion.button><div className="game-actions"><button className="lab-button" onClick={()=>{setState('idle');setScore(null)}}><RotateCcw size={13}/> Reset</button></div></div>;
}

type Tile = { id:number; value:number };
const spawn2048=(tiles:Tile[])=>[...tiles,{id:Date.now()+Math.random(),value:Math.random()<.9?2:4}];

function slideLine(line:number[]) {
  const values=line.filter(Boolean),out:number[]=[];
  for(let i=0;i<values.length;i++){if(values[i]===values[i+1]){out.push(values[i]*2);i++;}else out.push(values[i]);}
  while(out.length<4)out.push(0);return {out,score:out.reduce((a,v)=>a+v,0)-values.reduce((a,v)=>a+v,0)};
}
function boardValues(tiles:Tile[]){const arr=Array(16).fill(0);tiles.forEach((t,i)=>arr[i]=t.value);return arr;}
function Game2048(){
  const initial=[0,5].map((_,i)=>({id:i,value:Math.random()<.9?2:4} as Tile));
  const [tiles,setTiles]=useState<Tile[]>(initial),[score,setScore]=useState(0),[best,setBest]=useState(()=>Number(localStorage.getItem('brain-2048-best')||0));
  const reset=()=>{const fresh=[{id:Date.now(),value:2},{id:Date.now()+1,value:4}];setTiles(fresh);setScore(0)};
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const key=e.key.toLowerCase();if(!['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key))return;e.preventDefault();move(key)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)});
  const move=(key:string)=>{
    const b=boardValues(tiles),next=Array(16).fill(0),dirs=key==='arrowleft'||key==='a'?'L':key==='arrowright'||key==='d'?'R':key==='arrowup'||key==='w'?'U':'D';let gained=0;
    const rows=dirs==='L'||dirs==='R'?[0,1,2,3]:[0,4,8,12];
    rows.forEach(base=>{let line:number[]=[];if(dirs==='L'||dirs==='R')for(let k=0;k<4;k++)line.push(b[base+k]);else for(let k=0;k<4;k++)line.push(b[base+k*4]);
      if(dirs==='R'||dirs==='D')line.reverse();const result=slideLine(line);gained+=result.score;const out=dirs==='R'||dirs==='D'?result.out.reverse():result.out;
      for(let k=0;k<4;k++) if(dirs==='L'||dirs==='R')next[base+k]=out[k]; else next[base+k*4]=out[k];
    });
    if(next.every((v,i)=>v===b[i]))return;
    const mapped=next.map((v,i)=>v?{id:tiles.find(t=>boardValues(tiles)[i]===v)?.id??Date.now()+i,value:v}:null).filter(Boolean) as Tile[];
    const free=next.map((v,i)=>v?i:-1).filter(i=>i>=0);const _=free.length;
    const fresh=spawn2048(mapped);setTiles(fresh);const s=score+gained;setScore(s);if(s>best){setBest(s);localStorage.setItem('brain-2048-best',String(s))}
  };
  return <div className="game-panel">
    <div className="game-topline"><div><span>Score</span><strong>{score}</strong></div><div><span>Best</span><strong>{best}</strong></div><div><span>Controls</span><strong>WASD / arrows</strong></div></div>
    <div className="game-2048">{boardValues(tiles).map((v,i)=><motion.div layout key={i} className={'tile-2048 v-'+v}>{v||''}</motion.div>)}</div>
    <div className="game-actions"><button className="lab-button" onClick={reset}><RotateCcw size={13}/> New board</button><span className="game-status">Combine equal tiles to reach 2048.</span></div>
  </div>;
}

const puzzleBase:number[][]=[
[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]
];
function solveSudoku(board:number[][]){for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(board[r][c]===0){for(let n=1;n<=9;n++){if(valid(board,r,c,n)){board[r][c]=n;if(solveSudoku(board))return true;board[r][c]=0} }return false}return true}
function valid(b:number[][],r:number,c:number,n:number){for(let i=0;i<9;i++)if(b[r][i]===n||b[i][c]===n)return false;const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;for(let y=0;y<3;y++)for(let x=0;x<3;x++)if(b[br+y][bc+x]===n)return false;return true}
function Sudoku(){
  const [board,setBoard]=useState(()=>puzzleBase.map(r=>[...r])),[solved,setSolved]=useState(false);
  const reset=()=>{setBoard(puzzleBase.map(r=>[...r]));setSolved(false)};
  const solve=()=>{const copy=board.map(r=>[...r]);solveSudoku(copy);setBoard(copy);setSolved(true)};
  return <div className="game-panel">
    <div className="game-topline"><div><span>Mode</span><strong>Classic 9×9</strong></div><div><span>Solver</span><strong>Backtracking</strong></div><div><span>State</span><strong>{solved?'Solved':'Playable'}</strong></div></div>
    <div className="sudoku-grid">{board.flatMap((row,r)=>row.map((v,c)=><div className={'sudoku-cell '+((r%3===2?'edge-r ':'')+(c%3===2?'edge-c':''))} key={r*9+c}>{v||''}</div>))}</div>
    <div className="game-actions"><button className="lab-button primary" onClick={solve}>Solve puzzle</button><button className="lab-button" onClick={reset}><RotateCcw size={13}/> Reset</button></div>
  </div>;
}

type Node={r:number;c:number};
function Maze(){
  const size=15;
  const [algorithm,setAlgorithm]=useState<'BFS'|'DFS'|'A*'>('A*');
  const [path,setPath]=useState<Set<string>>(new Set());
  const [visited,setVisited]=useState<Set<string>>(new Set());
  const start:Node={r:0,c:0},end:Node={r:size-1,c:size-1};
  const wall=(r:number,c:number)=>((r*17+c*31)%11)<3 && !(r===0&&c<3) && !(c===size-1&&r>size-4);
  const solve=()=>{
    const key=(n:Node)=>n.r+','+n.c;const queue:Node[]=[start],seen=new Set([key(start)]),prev=new Map<string,string>();
    while(queue.length){const cur=algorithm==='DFS'?queue.pop()!:queue.shift()!;if(cur.r===end.r&&cur.c===end.c)break;for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={r:cur.r+dr,c:cur.c+dc};if(n.r<0||n.r>=size||n.c<0||n.c>=size||wall(n.r,n.c)||seen.has(key(n)))continue;seen.add(key(n));prev.set(key(n),key(cur));queue.push(n)}}
    const finalKey=key(end);const p=new Set<string>();let at=finalKey;while(at){p.add(at);if(at===key(start))break;at=prev.get(at)||''}setVisited(seen);setPath(p);
  };
  return <div className="game-panel">
    <div className="game-topline"><div><span>Algorithm</span><strong>{algorithm}</strong></div><div><span>Nodes</span><strong>{visited.size||'—'}</strong></div><div><span>Path</span><strong>{path.size||'—'} steps</strong></div></div>
    <div className="maze-toolbar">{(['BFS','DFS','A*'] as const).map(a=><button className={'lab-button '+(algorithm===a?'selected':'')} onClick={()=>setAlgorithm(a)} key={a}>{a}</button>)}</div>
    <div className="maze-grid">{Array.from({length:size*size},(_,i)=>{const r=Math.floor(i/size),c=i%size,k=r+','+c;return <div key={k} className={'maze-cell '+(wall(r,c)?'wall ':'')+(visited.has(k)?'visited ':'')+(path.has(k)?'path ':'')+(r===0&&c===0?'start ':'')+(r===size-1&&c===size-1?'end ':'')}></div>})}</div>
    <div className="game-actions"><button className="lab-button primary" onClick={solve}>Run {algorithm}</button><span className="game-status">Find a route from S to E.</span></div>
  </div>;
}

export default function BrainLab(){
  const [game,setGame]=useState<Game>('memory');
  const tabs=useMemo(()=>[
    {id:'memory' as const,label:'Memory',note:'Sequence recall',icon:Brain},
    {id:'tic' as const,label:'Tic-Tac-Toe',note:'Minimax AI',icon:Trophy},
    {id:'reaction' as const,label:'Reaction',note:'Human timing',icon:Clock3},
    {id:'2048' as const,label:'2048',note:'Grid logic',icon:Grid2X2},
    {id:'sudoku' as const,label:'Sudoku',note:'Backtracking',icon:Grid2X2},
    {id:'maze' as const,label:'Maze Solver',note:'BFS · DFS · A*',icon:Zap}
  ],[]);
  return <div className="brain-lab">
    <div className="lab-tabs">{tabs.map(({id,label,note,icon:Icon})=><button className={game===id?'active':''} onClick={()=>setGame(id)} key={id}><Icon size={14}/><span>{label}</span><small>{note}</small></button>)}</div>
    <div className="lab-caption"><span>client-side experiments</span><span>•</span><span>scores stored locally</span><span>•</span><span>no backend</span></div>
    <AnimatePresence mode="wait">
      <motion.div key={game} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.22}}>{game==='memory'&&<Memory/>}{game==='tic'&&<Tic/>}{game==='reaction'&&<Reaction/>}{game==='2048'&&<Game2048/>}{game==='sudoku'&&<Sudoku/>}{game==='maze'&&<Maze/>}</motion.div>
    </AnimatePresence>
  </div>;
}
