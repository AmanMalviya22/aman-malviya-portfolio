import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpDown, Check, Grid2X2, Lightbulb, RotateCcw, Trophy, Zap } from 'lucide-react';

type Game = 'tic' | '2048' | 'sudoku' | 'maze' | 'wend';

const emptyBoard = Array.from({ length: 9 }, () => null as 'X' | 'O' | null);

function storedNumber(key:string, fallback=0){
  if(typeof window==='undefined') return fallback;
  return Number(window.localStorage.getItem(key) || fallback);
}

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
  type Result='win'|'loss'|'draw';
  const [board,setBoard]=useState<(string|null)[]>([...emptyBoard]);
  const [thinking,setThinking]=useState(false);
  const [stats,setStats]=useState(()=>({
    wins:storedNumber('brain-tic-wins'),
    losses:storedNumber('brain-tic-losses'),
    draws:storedNumber('brain-tic-draws'),
    streak:storedNumber('brain-tic-streak')
  }));
  const [last,setLast]=useState('');
  const w=winner(board);
  const record=(result:Result)=>{
    setStats(prev=>{
      const next={wins:prev.wins+(result==='win'?1:0),losses:prev.losses+(result==='loss'?1:0),draws:prev.draws+(result==='draw'?1:0),streak:result==='win'?prev.streak+1:0};
      localStorage.setItem('brain-tic-wins',String(next.wins));localStorage.setItem('brain-tic-losses',String(next.losses));localStorage.setItem('brain-tic-draws',String(next.draws));localStorage.setItem('brain-tic-streak',String(next.streak));
      return next;
    });
  };
  const move=(i:number)=>{
    if(board[i]||w||thinking)return;
    const next=[...board];next[i]='X';const humanResult=winner(next);setBoard(next);
    if(humanResult){setLast(humanResult==='X'?'You win! 🔥':'Draw — rematch?');record(humanResult==='X'?'win':'draw');return;}
    setThinking(true);
    window.setTimeout(()=>{
      const pick=aiMove(next),out=[...next];out[pick]='O';const result=winner(out);setBoard(out);setThinking(false);
      if(result){setLast(result==='O'?'AI wins — run it back.':'Draw — rematch?');record(result==='O'?'loss':'draw');}
    },220);
  };
  const reset=()=>{setBoard([...emptyBoard]);setThinking(false);setLast('');};
  return <div className="game-panel">
    <div className="game-topline">
      <div><span>Wins</span><strong>{stats.wins}</strong></div><div><span>Losses</span><strong>{stats.losses}</strong></div>
      <div><span>Streak</span><strong>{stats.streak} 🔥</strong></div><div><span>Engine</span><strong>Minimax</strong></div>
    </div>
    <div className="tic-board">{board.map((v,i)=><motion.button whileHover={{backgroundColor:'rgba(255,255,255,.055)',scale:1.02}} whileTap={{scale:.95}} className={'tic-cell '+(v||'')} onClick={()=>move(i)} key={i}>{v||''}</motion.button>)}</div>
    <div className="game-actions"><span className="game-status">{last || (w==='draw'?'Draw.':w?w+' wins.':thinking?'AI thinking…':'Your move — build a streak.')}</span><button className="lab-button" onClick={reset}><RotateCcw size={13}/> Rematch</button></div>
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

type Board2048 = number[];

function empty2048(): Board2048 {
  const b=Array(16).fill(0);
  addRandom2048(b); addRandom2048(b);
  return b;
}
function addRandom2048(board:Board2048){
  const free=board.map((v,i)=>v===0?i:-1).filter(i=>i>=0);
  if(!free.length)return;
  const spot=free[Math.floor(Math.random()*free.length)];
  board[spot]=Math.random()<0.9?2:4;
}
function compress2048(line:number[]){
  const values=line.filter(Boolean),out:number[]=[],merges:number[]=[];
  for(let i=0;i<values.length;i++){
    if(values[i]===values[i+1]){const merged=values[i]*2;out.push(merged);merges.push(merged);i++;}
    else out.push(values[i]);
  }
  while(out.length<4)out.push(0);
  return {out,gained:merges.reduce((a,v)=>a+v,0)};
}
function moved2048(board:Board2048,dir:'L'|'R'|'U'|'D'){
  const next=Array(16).fill(0);let gained=0;
  for(let line=0;line<4;line++){
    let input:number[]=[];
    if(dir==='L'||dir==='R') for(let i=0;i<4;i++) input.push(board[line*4+i]);
    else for(let i=0;i<4;i++) input.push(board[i*4+line]);
    if(dir==='R'||dir==='D')input.reverse();
    const result=compress2048(input);gained+=result.gained;
    const out=(dir==='R'||dir==='D')?result.out.reverse():result.out;
    if(dir==='L'||dir==='R')for(let i=0;i<4;i++)next[line*4+i]=out[i];
    else for(let i=0;i<4;i++)next[i*4+line]=out[i];
  }
  return {next,gained,changed:next.some((v,i)=>v!==board[i])};
}
function canMove2048(board:Board2048){
  if(board.some(v=>v===0))return true;
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){
    const v=board[r*4+c];
    if(c<3&&v===board[r*4+c+1])return true;
    if(r<3&&v===board[(r+1)*4+c])return true;
  }
  return false;
}
function Game2048(){
  const [board,setBoard]=useState<Board2048>(()=>empty2048());
  const [score,setScore]=useState(0),[best,setBest]=useState(()=>storedNumber('brain-2048-best'));
  const [over,setOver]=useState(false),[moves,setMoves]=useState(0);
  const [undo,setUndo]=useState<{board:Board2048;score:number;over:boolean}|null>(null);
  const touchStart=useRef<{x:number;y:number}|null>(null);
  const makeMove=(dir:'L'|'R'|'U'|'D')=>{
    if(over)return;const result=moved2048(board,dir);if(!result.changed)return;
    const next=[...result.next];addRandom2048(next);setUndo({board:[...board],score,over});setBoard(next);
    const s=score+result.gained;setScore(s);setMoves(m=>m+1);
    if(s>best){setBest(s);localStorage.setItem('brain-2048-best',String(s))}
    setOver(!canMove2048(next));
  };
  const reset=()=>{setBoard(empty2048());setScore(0);setMoves(0);setOver(false);setUndo(null)};
  const undoMove=()=>{if(!undo)return;setBoard(undo.board);setScore(undo.score);setOver(undo.over);setUndo(null);setMoves(m=>Math.max(0,m-1));};
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{const key=e.key.toLowerCase();const map:Record<string,'L'|'R'|'U'|'D'>={arrowleft:'L',a:'L',arrowright:'R',d:'R',arrowup:'U',w:'U',arrowdown:'D',s:'D'};if(!map[key])return;e.preventDefault();makeMove(map[key]);};
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[board,score,best,over]);
  const onTouchStart=(e:React.TouchEvent)=>{const t=e.changedTouches[0];touchStart.current={x:t.clientX,y:t.clientY};};
  const onTouchEnd=(e:React.TouchEvent)=>{const s=touchStart.current;if(!s)return;const t=e.changedTouches[0],dx=t.clientX-s.x,dy=t.clientY-s.y;touchStart.current=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;if(Math.abs(dx)>Math.abs(dy))makeMove(dx>0?'R':'L');else makeMove(dy>0?'D':'U');};
  return <div className="game-panel"><div className="game-topline">
    <div><span>Score</span><strong>{score}</strong></div><div><span>Best</span><strong>{best}</strong></div><div><span>Moves</span><strong>{moves}</strong></div><div><span>Goal</span><strong>2048</strong></div>
  </div>{over&&<div className="game-over">No moves left. Beat your best score and start another run.</div>}
  <div className="game-2048 mobile-swipe" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>{board.map((v,i)=><motion.div layout key={i} className={'tile-2048 v-'+v}>{v||''}</motion.div>)}</div>
  <div className="game-actions"><button className="lab-button" onClick={undoMove} disabled={!undo}>Undo</button><button className="lab-button" onClick={reset}><RotateCcw size={13}/> New run</button><span className="game-status">Swipe on mobile · WASD / arrows on desktop.</span></div></div>;
}
const puzzleBase:number[][]=[
[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]
];
function solveSudoku(board:number[][]){for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(board[r][c]===0){for(let n=1;n<=9;n++){if(valid(board,r,c,n)){board[r][c]=n;if(solveSudoku(board))return true;board[r][c]=0} }return false}return true}
function valid(b:number[][],r:number,c:number,n:number){for(let i=0;i<9;i++)if(b[r][i]===n||b[i][c]===n)return false;const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;for(let y=0;y<3;y++)for(let x=0;x<3;x++)if(b[br+y][bc+x]===n)return false;return true}
function Sudoku(){
  const solvedBase=useMemo(()=>{const copy=puzzleBase.map(r=>[...r]);solveSudoku(copy);return copy;},[]);
  const [board,setBoard]=useState(()=>puzzleBase.map(r=>[...r])),[solved,setSolved]=useState(false),[mistakes,setMistakes]=useState(0),[hints,setHints]=useState(0),[seconds,setSeconds]=useState(0);
  useEffect(()=>{if(solved)return;const id=window.setInterval(()=>setSeconds(s=>s+1),1000);return()=>window.clearInterval(id);},[solved]);
  const reset=()=>{setBoard(puzzleBase.map(r=>[...r]));setSolved(false);setMistakes(0);setHints(0);setSeconds(0)};
  const update=(r:number,c:number,value:string)=>{if(puzzleBase[r][c]!==0||solved)return;const n=Math.max(0,Math.min(9,Number(value)||0));const next=board.map(row=>[...row]);next[r][c]=n;setBoard(next);setSolved(next.every((row,rr)=>row.every((v,cc)=>v!==0&&v===solvedBase[rr][cc])))};
  const check=()=>{let wrong=0;for(let r=0;r<9;r++)for(let col=0;col<9;col++)if(puzzleBase[r][col]===0&&board[r][col]!==0&&board[r][col]!==solvedBase[r][col])wrong++;setMistakes(w=>w+wrong);if(wrong===0&&board.every(row=>row.every(Boolean)))setSolved(true)};
  const hint=()=>{for(let r=0;r<9;r++)for(let col=0;col<9;col++)if(puzzleBase[r][col]===0&&board[r][col]===0){const next=board.map(row=>[...row]);next[r][col]=solvedBase[r][col];setBoard(next);setHints(h=>h+1);return;}};
  const time=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  return <div className="game-panel"><div className="game-topline"><div><span>Time</span><strong>{time}</strong></div><div><span>Mistakes</span><strong>{mistakes}</strong></div><div><span>Hints</span><strong>{hints}</strong></div><div><span>State</span><strong>{solved?'Solved':'In play'}</strong></div></div>
    <div className="sudoku-grid">{board.flatMap((row,r)=>row.map((v,col)=>{const fixed=puzzleBase[r][col]!==0,wrong=!fixed&&v!==0&&v!==solvedBase[r][col];return <input key={r*9+col} className={'sudoku-cell sudoku-input '+(r%3===2?'edge-r ':'')+(col%3===2?'edge-c ':'')+(wrong?'wrong':'')} value={v||''} inputMode="numeric" maxLength={1} disabled={fixed||solved} onChange={e=>update(r,col,e.target.value)} aria-label={'Sudoku row '+(r+1)+' column '+(col+1)}/>;}))}</div>
    <div className="game-actions"><button className="lab-button primary" onClick={check}>Check</button><button className="lab-button" onClick={hint} disabled={solved}><Lightbulb size={13}/> Hint</button><button className="lab-button" onClick={()=>{setBoard(solvedBase.map(r=>[...r]));setSolved(true)}}>Solve</button><button className="lab-button" onClick={reset}><RotateCcw size={13}/> Reset</button></div>
    <div className="game-status">Fill it yourself, keep mistakes low, then beat your time.</div></div>;
}
function Maze(){
  const size=15;const [algorithm,setAlgorithm]=useState<'BFS'|'DFS'|'A*'>('A*');const [seed,setSeed]=useState(1);
  const [path,setPath]=useState<Set<string>>(new Set()),[visited,setVisited]=useState<Set<string>>(new Set()),[runs,setRuns]=useState(0);
  const startNode={r:0,c:0},endNode={r:size-1,c:size-1};const key=(n:Node)=>n.r+','+n.c;
  const wall=(r:number,c:number)=>{const n=(r*17+c*31+seed*13)%11;return n<3&&!(r===0&&c<3)&&!(c===size-1&&r>size-4)};
  const solve=()=>{const score=new Map<string,number>([[key(startNode),0]]),prev=new Map<string,string>(),seen=new Set<string>(),frontier:{node:Node;priority:number}[]=[{node:startNode,priority:0}];
    const pop=()=>{frontier.sort((a,b)=>a.priority-b.priority);return algorithm==='DFS'?frontier.pop()!:frontier.shift()!};
    while(frontier.length){const current=pop(),curKey=key(current.node);if(seen.has(curKey))continue;seen.add(curKey);if(curKey===key(endNode))break;
      for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const next={r:current.node.r+dr,c:current.node.c+dc};if(next.r<0||next.r>=size||next.c<0||next.c>=size||wall(next.r,next.c))continue;const nk=key(next),g=(score.get(curKey)??0)+1;if(!score.has(nk)||g<(score.get(nk)??Infinity)){score.set(nk,g);prev.set(nk,curKey);const h=Math.abs(next.r-endNode.r)+Math.abs(next.c-endNode.c);frontier.push({node:next,priority:algorithm==='A*'?g+h:(algorithm==='BFS'?g:0)});}}}
    const p=new Set<string>();let at=key(endNode);if(!prev.has(at)&&at!==key(startNode)){setVisited(seen);setPath(p);return;}while(at){p.add(at);if(at===key(startNode))break;at=prev.get(at)||''}setVisited(seen);setPath(p);setRuns(r=>r+1);};
  const nextMaze=()=>{setSeed(s=>s+1);setPath(new Set());setVisited(new Set())};
  return <div className="game-panel"><div className="game-topline"><div><span>Algorithm</span><strong>{algorithm}</strong></div><div><span>Nodes</span><strong>{visited.size||'—'}</strong></div><div><span>Path</span><strong>{path.size||'—'} steps</strong></div><div><span>Runs</span><strong>{runs}</strong></div></div>
    <div className="maze-toolbar">{(['BFS','DFS','A*'] as const).map(a=><button className={'lab-button '+(algorithm===a?'selected':'')} onClick={()=>{setAlgorithm(a);setPath(new Set());setVisited(new Set())}} key={a}>{a}</button>)}<button className="lab-button" onClick={nextMaze}>New maze ↻</button></div>
    <div className="maze-grid">{Array.from({length:size*size},(_,i)=>{const r=Math.floor(i/size),col=i%size,k=r+','+col;return <div key={k} className={'maze-cell '+(wall(r,col)?'wall ':'')+(visited.has(k)?'visited ':'')+(path.has(k)?'path ':'')+(r===0&&col===0?'start ':'')+(r===size-1&&col===size-1?'end ':'')}></div>})}</div>
    <div className="game-actions"><button className="lab-button primary" onClick={solve}>Run {algorithm}</button><span className="game-status">Try each algorithm, then generate another maze.</span></div></div>;
}
function Tango() {
  type Cell = 'sun' | 'moon' | null;
  const solution:Cell[][] = [
    ['sun','sun','moon','moon','sun','moon'],
    ['moon','moon','sun','sun','moon','sun'],
    ['sun','moon','sun','moon','moon','sun'],
    ['moon','sun','moon','sun','sun','moon'],
    ['moon','sun','sun','moon','sun','moon'],
    ['sun','moon','moon','sun','moon','sun'],
  ];
  const clue:Array<Array<Cell>> = [
    ['sun',null,null,'moon',null,null],
    [null,'moon',null,null,'moon',null],
    [null,null,'sun',null,null,'sun'],
    ['moon',null,null,'sun',null,null],
    [null,'sun',null,null,'sun',null],
    [null,null,'moon',null,null,'sun'],
  ];
  const links:Array<{r1:number;c1:number;r2:number;c2:number;kind:'same'|'diff'}> = [
    {r1:0,c1:1,r2:0,c2:2,kind:'diff'},{r1:0,c1:2,r2:0,c2:3,kind:'same'},
    {r1:1,c1:0,r2:1,c2:1,kind:'same'},{r1:1,c1:3,r2:1,c2:4,kind:'diff'},
    {r1:2,c1:2,r2:2,c2:3,kind:'diff'},{r1:2,c1:3,r2:2,c2:4,kind:'same'},
    {r1:3,c1:0,r2:3,c2:1,kind:'diff'},{r1:4,c1:2,r2:4,c2:3,kind:'diff'},
    {r1:5,c1:2,r2:5,c2:3,kind:'same'},
    {r1:0,c1:2,r2:1,c2:2,kind:'diff'},{r1:2,c1:4,r2:3,c2:4,kind:'diff'},
  ];
  const [board,setBoard]=useState<Cell[][]>(()=>clue.map(r=>[...r]));
  const [solved,setSolved]=useState(false),[mistakes,setMistakes]=useState(0);
  const setCell=(r:number,c:number)=>{ if(clue[r][c]) return; setBoard(prev=>{const next=prev.map(row=>[...row]); next[r][c]=next[r][c]===null?'sun':next[r][c]==='sun'?'moon':null; return next;}); setSolved(false); };
  const check=()=>{
    let ok=true;
    for(let r=0;r<6;r++){
      const row=board[r]; if(row.some(v=>v===null)||row.filter(v=>v==='sun').length!==3) ok=false;
      for(let c=0;c<4;c++) if(row[c]&&row[c]===row[c+1]&&row[c+1]===row[c+2]) ok=false;
    }
    for(let c=0;c<6;c++){
      const col=board.map(row=>row[c]); if(col.some(v=>v===null)||col.filter(v=>v==='sun').length!==3) ok=false;
      for(let r=0;r<4;r++) if(col[r]&&col[r]===col[r+1]&&col[r+1]===col[r+2]) ok=false;
    }
    for(const l of links){const a=board[l.r1][l.c1],b=board[l.r2][l.c2];if(!a||!b||(l.kind==='same'?a!==b:a===b))ok=false;}
    if(ok&&board.every(row=>row.every(Boolean))){setSolved(true);return;}
    setMistakes(x=>x+1);
  };
  const reset=()=>{setBoard(clue.map(r=>[...r]));setSolved(false);setMistakes(0)};
  return <div className="game-panel">
    <div className="game-topline"><div><span>Grid</span><strong>6 × 6</strong></div><div><span>Mistakes</span><strong>{mistakes}</strong></div><div><span>Rule</span><strong>{solved?'Solved':'3 + 3 symbols'}</strong></div></div>
    <p className="game-instructions">Fill each row and column with 3 suns and 3 moons. Never place three identical symbols together. Symbols joined by <b>=</b> must match; <b>×</b> must differ.</p>
    <div className="tango-grid">
      {Array.from({length:6*6},(_,i)=>{const r=Math.floor(i/6),c=i%6;const value=board[r][c];return <button key={i} onClick={()=>setCell(r,c)} className={'tango-cell '+(value||'empty')+(clue[r][c]?' fixed':'')} aria-label={'Tango row '+(r+1)+' column '+(c+1)}>{value==='sun'?'☀':value==='moon'?'●':''}{links.filter(l=>l.r1===r&&l.c1===c).map((l,idx)=><span key={'r'+idx} className={'tango-link '+l.kind}>{l.kind==='same'?'=':'×'}</span>)}</button>})}
    </div>
    <div className="game-actions"><button className="lab-button primary" onClick={check}>{solved?'Solved ✓':'Check solution'}</button><button className="lab-button" onClick={reset}><RotateCcw size={13}/> Reset</button><span className="game-status">Original Tango-style logic puzzle · no backend.</span></div>
  </div>;
}

function Wend() {
  type Puzzle = { size:number; grid:string[]; words:string[]; lengths:number[]; paths:number[][] };

  const puzzles: Puzzle[] = [
    {
      size: 7,
      grid: [
        'E','C','A','T','A','L','E',
        'T','T','D','A','B','R','N',
        'I','U','R','S','E','E','K',
        'H','Q','E','E','T','H','R',
        'C','U','E','U','A','T','E',
        'R','E','A','C','L','E','A',
        'A','H','C','Y','C','N','D'
      ],
      words: ['ARCHITECTURE','DATABASE','LATENCY','THREAD','KERNEL','CACHE','QUEUE'],
      lengths: [12,8,7,6,6,5,5],
      paths: [
        [42,35,28,21,14,7,0,1,8,15,16,23],
        [9,2,3,4,11,10,17,18],
        [39,32,33,40,47,46,45],
        [25,26,27,34,41,48],
        [20,19,12,13,6,5],
        [38,37,44,43,36],
        [22,29,30,31,24]
      ]
    },
    {
      size: 7,
      grid: [
        'E','R','N','E','L','A','D',
        'K','E','C','Y','R','E','E',
        'U','R','N','T','H','C','H',
        'T','E','E','T','A','A','C',
        'C','U','Q','A','L','B','A',
        'E','E','U','R','D','A','S',
        'T','I','H','C','A','T','E'
      ],
      words: ['ARCHITECTURE','DATABASE','LATENCY','THREAD','KERNEL','CACHE','QUEUE'],
      lengths: [12,8,7,6,6,5,5],
      paths: [
        [31,38,45,44,43,42,35,28,21,14,15,8],
        [39,46,47,40,33,34,41,48],
        [32,25,24,23,16,9,10],
        [17,18,11,12,5,6],
        [7,0,1,2,3,4],
        [27,26,19,20,13],
        [30,37,36,29,22]
      ]
    },
    {
      size: 7,
      grid: [
        'T','H','R','E','A','D','A',
        'E','R','U','T','C','C','R',
        'S','E','T','A','E','H','K',
        'A','N','E','L','T','I','E',
        'B','C','Y','U','E','N','R',
        'A','D','U','E','L','E','C',
        'T','A','Q','E','H','C','A'
      ],
      words: ['ARCHITECTURE','DATABASE','LATENCY','THREAD','KERNEL','CACHE','QUEUE'],
      lengths: [12,8,7,6,6,5,5],
      paths: [
        [6,13,12,19,26,25,18,11,10,9,8,7],
        [36,43,42,35,28,21,14,15],
        [24,17,16,23,22,29,30],
        [0,1,2,3,4,5],
        [20,27,34,33,40,39],
        [41,48,47,46,45],
        [44,37,38,31,32]
      ]
    }
  ];

  const [puzzleIndex,setPuzzleIndex]=useState(0);
  const puzzle=puzzles[puzzleIndex];
  const [path,setPath]=useState<number[]>([]);
  const [found,setFound]=useState<string[]>([]);
  const [history,setHistory]=useState<number[][]>([]);
  const [mistake,setMistake]=useState<string>('');
  const [hints,setHints]=useState(0);
  const [elapsed,setElapsed]=useState(0);
  const [started,setStarted]=useState<number|null>(null);
  const [complete,setComplete]=useState(false);
  const [score,setScore]=useState(0);
  const [streak,setStreak]=useState(()=>storedNumber('brain-wend-streak'));
  const [best,setBest]=useState(()=>storedNumber('brain-wend-best'));
  const [usedHint,setUsedHint]=useState<number|null>(null);
  const [dragging,setDragging]=useState(false);
  const usedCells=new Set(history.flat());

  useEffect(()=>{
    setElapsed(0);setStarted(null);setComplete(false);setPath([]);setFound([]);setHistory([]);
    setMistake('');setHints(0);setUsedHint(null);setScore(0);setDragging(false);setStreak(0);
  },[puzzleIndex]);

  useEffect(()=>{
    if(!started||complete)return;
    const id=window.setInterval(()=>setElapsed(performance.now()-started),100);
    return()=>window.clearInterval(id);
  },[started,complete]);

  const key=(ms:number)=>String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0');
  const row=(i:number)=>Math.floor(i/puzzle.size),col=(i:number)=>i%puzzle.size;
  const adjacent=(a:number,b:number)=>Math.abs(row(a)-row(b))+Math.abs(col(a)-col(b))===1;
  const word=(ids:number[])=>ids.map(i=>puzzle.grid[i]).join('');

  const begin=(i:number)=>{
    if(complete||found.length===puzzle.words.length||usedCells.has(i))return;
    if(!started)setStarted(performance.now());
    setMistake('');setDragging(true);setUsedHint(null);setPath([i]);
  };

  const extend=(i:number)=>{
    if(!dragging||complete||path.length===0)return;
    const last=path[path.length-1];
    if(i===last||path.includes(i)||usedCells.has(i)||!adjacent(last,i))return;
    setPath(prev=>[...prev,i]);
  };

  const finish=()=>{
    if(!dragging)return;
    setDragging(false);
    if(path.length<2){setPath([]);return;}
    const formed=word(path);
    const targetIndex=puzzle.words.indexOf(formed);
    const targetPath=targetIndex>=0?puzzle.paths[targetIndex]:null;
    const isExactPath=targetPath?.length===path.length && targetPath.every((cell,idx)=>cell===path[idx]);
    if(targetIndex>=0&&!found.includes(formed)&&isExactPath){
      setHistory(prev=>[...prev,path]);
      setFound(prev=>{
        const next=[...prev,formed];
        const gained=formed.length*100+Math.max(0,100-hints*12);
        setScore(s=>s+gained);
        setStreak(s=>{const n=s+1;window.localStorage.setItem('brain-wend-streak',String(n));return n});
        if(next.length===puzzle.words.length){
          setComplete(true);
          setElapsed(performance.now()-(started??performance.now()));
          setBest(b=>{const n=Math.max(b,score+gained);window.localStorage.setItem('brain-wend-best',String(n));return n});
        }
        return next;
      });
      setMistake('');setPath([]);return;
    }
    setStreak(0);window.localStorage.setItem('brain-wend-streak','0');
    setMistake(formed+' is not the hidden path.');setPath([]);
  };

  useEffect(()=>{
    const onPointerUp=()=>{if(dragging)finish();};
    window.addEventListener('pointerup',onPointerUp);
    return()=>window.removeEventListener('pointerup',onPointerUp);
  },[dragging,path,found,hints,started,score]);

  const undo=()=>{
    setPath([]);setMistake('');setDragging(false);
    if(history.length===0)return;
    const nextHistory=history.slice(0,-1);
    const removedPath=history[history.length-1];
    const removedWord=word(removedPath);
    setHistory(nextHistory);setFound(prev=>prev.filter(w=>w!==removedWord));setComplete(false);
  };

  const reset=()=>{
    setPath([]);setFound([]);setHistory([]);setMistake('');setHints(0);setUsedHint(null);
    setComplete(false);setElapsed(0);setStarted(null);setDragging(false);setScore(0);setStreak(0);
    window.localStorage.setItem('brain-wend-streak','0');
  };

  const hint=()=>{
    if(complete||puzzle.words.length===found.length)return;
    if(!started)setStarted(performance.now());
    const targetIndex=puzzle.words.findIndex(w=>!found.includes(w));
    const target=puzzle.words[targetIndex];const targetPath=puzzle.paths[targetIndex];
    if(!target||!targetPath)return;
    const nextIndex=Math.min(hints,targetPath.length-1);
    setHints(hints+1);setUsedHint(targetPath[nextIndex]);
    setMistake('Hint: start with '+target[0]+' and watch the highlighted tile.');
  };

  const newPuzzle=()=>setPuzzleIndex(i=>(i+1)%puzzles.length);
  const formed=word(path);
  const points=(ids:number[])=>ids.map(i=>((col(i)+.5)/puzzle.size*500)+','+((row(i)+.5)/puzzle.size*500)).join(' ');

  return <div className="game-panel wend-panel">
    <div className="game-topline">
      <div><span>Difficulty</span><strong>Hard</strong></div>
      <div><span>Time</span><strong>{key(elapsed)}</strong></div>
      <div><span>Score</span><strong>{score}</strong></div>
      <div><span>Streak</span><strong>{streak} 🔥</strong></div>
      <div><span>Best</span><strong>{best}</strong></div>
      <div><span>Found</span><strong>{found.length}/{puzzle.words.length}</strong></div>
    </div>

    <div className="wend-help"><span>7 × 7 board · no diagonals</span><span>Words may bend and cross your instincts</span><span>Every tile is used exactly once</span></div>

    <div className="wend-layout">
      <div className="wend-board-wrap">
        <svg className="wend-lines" viewBox="0 0 500 500" aria-hidden="true">
          {history.map((ids,idx)=><polyline key={'f'+idx} points={points(ids)} />)}
          {path.length>1&&<polyline className="active-path" points={points(path)} />}
        </svg>
        <div
          className="wend-grid"
          onPointerUp={finish}
          onPointerCancel={finish}
          onPointerMove={e=>{
            if(!dragging)return;
            const hit=document.elementFromPoint(e.clientX,e.clientY);
            const cell=hit?.closest?.('[data-wend-index]') as HTMLElement | null;
            const index=cell ? Number(cell.dataset.wendIndex) : NaN;
            if(Number.isFinite(index))extend(index);
          }}
        >
          {puzzle.grid.map((letter,i)=>{
            const isPath=path.includes(i),isFound=usedCells.has(i);
            return <button
              key={i}
              type="button"
              data-wend-index={i}
              className={'wend-cell '+(isPath?'current ':'')+(isFound?'found ':'')+(usedHint===i?'hinted ':'')}
              onPointerDown={e=>{e.preventDefault();begin(i)}}
              aria-label={'Letter '+letter+', position '+(i+1)}
            >{letter}</button>
          })}
        </div>
      </div>

      <aside className="wend-word-list" aria-live="polite">
        <div className="wend-list-title">Find these lengths</div>
        {puzzle.lengths.map((len,i)=>{
          const hit=puzzle.words[i]&&found.includes(puzzle.words[i])?puzzle.words[i]:undefined;
          return <div className={'wend-target '+(hit?'done':'')} key={i}><span>{hit||Array.from({length:len},()=>'_').join(' ')}</span>{hit&&<Check size={14}/>}</div>;
        })}
        {formed&&<div className="wend-live">Current: <b>{formed}</b></div>}
        {mistake&&<div className="wend-error">{mistake}</div>}
        {complete&&<div className="wend-complete">Puzzle complete · {key(elapsed)} · {score} points</div>}
      </aside>
    </div>

    <div className="game-actions">
      <button className="lab-button primary" onClick={hint} disabled={complete}><Lightbulb size={13}/> Hint</button>
      <button className="lab-button" onClick={undo} disabled={history.length===0}><RotateCcw size={13}/> Undo</button>
      <button className="lab-button" onClick={reset}><RotateCcw size={13}/> Reset</button>
      <button className="lab-button" onClick={newPuzzle}>New puzzle</button>
    </div>
    <div className="cross-note">LinkedIn-inspired difficulty · original puzzle data · client-side only · no backend.</div>
  </div>;
}

export default function BrainLab(){
  const [game,setGame]=useState<Game>('wend');
  const tabs=useMemo(()=>[
    {id:'tic' as const,label:'Tic-Tac-Toe',note:'Minimax AI',icon:Trophy},
    {id:'2048' as const,label:'2048',note:'Grid logic',icon:Grid2X2},
    {id:'sudoku' as const,label:'Sudoku',note:'Backtracking',icon:Grid2X2},
    {id:'maze' as const,label:'Maze Solver',note:'BFS · DFS · A*',icon:Zap},
    {id:'wend' as const,label:'Wend',note:'Drag to make words',icon:ArrowUpDown}
  ],[]);
  return <div className="brain-lab">
    <div className="lab-tabs">{tabs.map(({id,label,note,icon:Icon})=><button className={game===id?'active':''} onClick={()=>setGame(id)} key={id}><Icon size={14}/><span>{label}</span><small>{note}</small></button>)}</div>
    <div className="lab-caption"><span>client-side experiments</span><span>•</span><span>scores stored locally</span><span>•</span><span>no backend</span></div>
    <AnimatePresence mode="wait">
      <motion.div key={game} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.22}}>{game==='tic'&&<Tic/>}{game==='2048'&&<Game2048/>}{game==='sudoku'&&<Sudoku/>}{game==='maze'&&<Maze/>}{game==='wend'&&<Wend/>}</motion.div>
    </AnimatePresence>
  </div>;
}
