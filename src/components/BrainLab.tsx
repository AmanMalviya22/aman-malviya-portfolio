import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpDown, Brain, Check, Clock3, Grid2X2, Lightbulb, RotateCcw, Sun, Trophy, Zap } from 'lucide-react';

type Game = 'memory' | 'tic' | 'reaction' | '2048' | 'sudoku' | 'maze' | 'tango' | 'crossclimb';

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
  const [score,setScore]=useState(0);
  const [best,setBest]=useState(()=>Number(localStorage.getItem('brain-2048-best')||0));
  const [over,setOver]=useState(false);
  const reset=()=>{setBoard(empty2048());setScore(0);setOver(false)};
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const key=e.key.toLowerCase();
      const map:Record<string,'L'|'R'|'U'|'D'>={arrowleft:'L',a:'L',arrowright:'R',d:'R',arrowup:'U',w:'U',arrowdown:'D',s:'D'};
      if(!map[key])return;
      e.preventDefault();
      const result=moved2048(board,map[key]);
      if(!result.changed)return;
      const next=[...result.next];addRandom2048(next);setBoard(next);
      const s=score+result.gained;setScore(s);
      if(s>best){setBest(s);localStorage.setItem('brain-2048-best',String(s))}
      setOver(!canMove2048(next));
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[board,score,best]);
  return <div className="game-panel">
    <div className="game-topline"><div><span>Score</span><strong>{score}</strong></div><div><span>Best</span><strong>{best}</strong></div><div><span>Controls</span><strong>WASD / arrows</strong></div></div>
    {over&&<div className="game-over">No moves left. Start a new board.</div>}
    <div className="game-2048">{board.map((v,i)=><motion.div layout key={i} className={'tile-2048 v-'+v}>{v||''}</motion.div>)}</div>
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
  const [path,setPath]=useState<Set<string>>(new Set()),[visited,setVisited]=useState<Set<string>>(new Set());
  const startNode={r:0,c:0},endNode={r:size-1,c:size-1};
  const key=(n:Node)=>n.r+','+n.c;
  const wall=(r:number,c:number)=>((r*17+c*31)%11)<3 && !(r===0&&c<3) && !(c===size-1&&r>size-4);
  const solve=()=>{
    const score=new Map<string,number>([[key(startNode),0]]);
    const prev=new Map<string,string>();const seen=new Set<string>();const frontier:{node:Node;priority:number}[]=[{node:startNode,priority:0}];
    const pop=()=>{frontier.sort((a,b)=>a.priority-b.priority);return algorithm==='DFS'?frontier.pop()!:frontier.shift()!};
    while(frontier.length){
      const current=pop();const curKey=key(current.node);if(seen.has(curKey))continue;seen.add(curKey);
      if(curKey===key(endNode))break;
      for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const next={r:current.node.r+dr,c:current.node.c+dc};
        if(next.r<0||next.r>=size||next.c<0||next.c>=size||wall(next.r,next.c))continue;
        const nk=key(next),g=(score.get(curKey)??0)+1;
        if(!score.has(nk)||g<(score.get(nk)??Infinity)){
          score.set(nk,g);prev.set(nk,curKey);
          const h=Math.abs(next.r-endNode.r)+Math.abs(next.c-endNode.c);
          const priority=algorithm==='A*'?g+h:(algorithm==='BFS'?g:0);
          frontier.push({node:next,priority});
        }
      }
    }
    const p=new Set<string>();let at=key(endNode);
    if(!prev.has(at)&&at!==key(startNode)){setVisited(seen);setPath(p);return;}
    while(at){p.add(at);if(at===key(startNode))break;at=prev.get(at)||''}
    setVisited(seen);setPath(p);
  };
  return <div className="game-panel">
    <div className="game-topline"><div><span>Algorithm</span><strong>{algorithm}</strong></div><div><span>Nodes</span><strong>{visited.size||'—'}</strong></div><div><span>Path</span><strong>{path.size||'—'} steps</strong></div></div>
    <div className="maze-toolbar">{(['BFS','DFS','A*'] as const).map(a=><button className={'lab-button '+(algorithm===a?'selected':'')} onClick={()=>{setAlgorithm(a);setPath(new Set());setVisited(new Set())}} key={a}>{a}</button>)}</div>
    <div className="maze-grid">{Array.from({length:size*size},(_,i)=>{const r=Math.floor(i/size),c=i%size,k=r+','+c;return <div key={k} className={'maze-cell '+(wall(r,c)?'wall ':'')+(visited.has(k)?'visited ':'')+(path.has(k)?'path ':'')+(r===0&&c===0?'start ':'')+(r===size-1&&c===size-1?'end ':'')}></div>})}</div>
    <div className="game-actions"><button className="lab-button primary" onClick={solve}>Run {algorithm}</button><span className="game-status">Find a route from S to E.</span></div>
  </div>;
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

function Crossclimb() {
  type Rung = { id: string; answer: string; clue: string; locked?: boolean };

  const puzzle = useMemo<Rung[]>(() => [
    { id: 'top', answer: 'COLD', clue: 'Not warm', locked: true },
    { id: 'r1', answer: 'CORD', clue: 'A length of rope or string-like material' },
    { id: 'r2', answer: 'CARD', clue: 'Plastic used for payment or identification' },
    { id: 'r3', answer: 'WARD', clue: 'A person under someone’s care' },
    { id: 'r4', answer: 'WARM', clue: 'Comfortably hot' },
    { id: 'r5', answer: 'WORM', clue: 'A small soft-bodied invertebrate' },
    { id: 'bottom', answer: 'WORD', clue: 'A unit of language', locked: true }
  ], []);

  const middleInitial = useMemo(() => puzzle.slice(1,-1), [puzzle]);
  const [rungs, setRungs] = useState<Rung[]>(middleInitial);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [topAnswer, setTopAnswer] = useState('');
  const [bottomAnswer, setBottomAnswer] = useState('');
  const [revealed, setRevealed] = useState<Record<string,number>>({});
  const [autoCheck, setAutoCheck] = useState(false);
  const [autoReorder, setAutoReorder] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [started, setStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [status, setStatus] = useState('Solve each clue, then arrange the ladder.');
  const [solved, setSolved] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    const saved = Number(localStorage.getItem('brain-crossclimb-best') || 0);
    if (saved) setBest(saved);
  }, []);

  useEffect(() => {
    if (!started || solved) return;
    const id = window.setInterval(() => setElapsed(performance.now() - started), 100);
    return () => window.clearInterval(id);
  }, [started, solved]);

  const formatTime = (ms:number) => {
    const total = Math.floor(ms / 1000);
    return String(Math.floor(total / 60)).padStart(2,'0') + ':' + String(total % 60).padStart(2,'0');
  };

  const oneLetterApart = (a:string,b:string) => {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i=0;i<a.length;i++) if (a[i] !== b[i] && ++diff > 1) return false;
    return diff === 1;
  };

  const normalized = (value:string) => value.trim().toUpperCase().replace(/[^A-Z]/g,'');

  const kickOff = () => {
    if (!started) setStarted(performance.now());
  };

  const revealLetter = (id:string, answer:string) => {
    kickOff();
    setHints(x => x + 1);
    setRevealed(prev => ({...prev, [id]: Math.min((prev[id] ?? 0) + 1, answer.length)}));
    setStatus('Hint used — a letter has been revealed.');
  };

  const revealRow = (id:string, answer:string) => {
    kickOff();
    setHints(x => x + 1);
    setAnswers(prev => ({...prev, [id]: answer}));
    setRevealed(prev => ({...prev, [id]: answer.length}));
    setStatus('Row revealed. Keep climbing.');
    if (autoReorder) maybeAutoReorder();
  };

  const maybeAutoReorder = () => setRungs([...middleInitial]);

  const handleInput = (id:string,value:string,isTop=false,isBottom=false) => {
    kickOff();
    const clean = normalized(value).slice(0,4);
    if (isTop) setTopAnswer(clean);
    else if (isBottom) setBottomAnswer(clean);
    else setAnswers(prev => ({...prev,[id]:clean}));

    if (autoCheck) {
      const target = puzzle.find(r => r.id === id);
      if (target && clean && clean !== target.answer) setStatus('That entry does not match the clue.');
      else if (target && clean === target.answer) setStatus('Correct clue answer.');
    }
  };

  const validateMiddle = () => {
    let ok = true;
    for (const rung of rungs) {
      if (normalized(answers[rung.id] || '') !== rung.answer) ok = false;
    }
    if (!ok) {
      setMistakes(x => x + 1);
      setStatus('Some clue answers are incorrect. Use a hint or try again.');
      return false;
    }
    return true;
  };

  const ladderValid = () => {
    const values = rungs.map(r => normalized(answers[r.id] || '') || '----');
    return values.every((word,i) => i===0 || oneLetterApart(values[i-1],word));
  };

  const unlock = () => {
    kickOff();
    if (!validateMiddle()) return;
    if (!ladderValid()) {
      setMistakes(x => x + 1);
      setStatus('Your words are right, but the ladder order is not. Rearrange the middle rungs.');
      return;
    }
    setUnlocked(true);
    setStatus('Ladder unlocked. Solve the final top and bottom clues.');
  };

  const checkFinal = () => {
    kickOff();
    const top = normalized(topAnswer), bottom = normalized(bottomAnswer);
    const middle = rungs.map(r => normalized(answers[r.id] || ''));
    if (!validateMiddle() || !ladderValid()) return;
    if (top !== 'COLD' || bottom !== 'WORD') {
      setMistakes(x => x + 1);
      setStatus('The final clues are not correct yet.');
      return;
    }
    if (!oneLetterApart(top,middle[0]) || !oneLetterApart(middle[middle.length-1],bottom)) {
      setMistakes(x => x + 1);
      setStatus('The final words must also be one letter apart from their neighbors.');
      return;
    }
    setSolved(true);
    const finalTime = Math.max(1, performance.now() - (started ?? performance.now()));
    setElapsed(finalTime);
    if (!best || finalTime < best) {
      setBest(finalTime);
      localStorage.setItem('brain-crossclimb-best', String(finalTime));
    }
    setStatus('Ladder complete. Nice climb.');
  };

  const dragStart = (id:string) => setDragId(id);
  const drop = (targetId:string) => {
    if (!dragId || dragId === targetId) return;
    setRungs(prev => {
      const next = [...prev];
      const from = next.findIndex(r => r.id === dragId);
      const to = next.findIndex(r => r.id === targetId);
      const [item] = next.splice(from,1);
      next.splice(to,0,item);
      return next;
    });
    setDragId(null);
  };

  const reset = () => {
    setRungs(middleInitial);
    setAnswers({});
    setTopAnswer('');
    setBottomAnswer('');
    setRevealed({});
    setSelected(null);
    setStarted(null);
    setElapsed(0);
    setMistakes(0);
    setHints(0);
    setSolved(false);
    setUnlocked(false);
    setStatus('Solve each clue, then arrange the ladder.');
  };

  const renderWordInput = (rung:Rung, index:number, locked=false) => {
    const value = locked ? (rung.id === 'top' ? topAnswer : bottomAnswer) : (answers[rung.id] || '');
    const revealedCount = revealed[rung.id] || 0;
    const target = rung.answer;
    const prefix = revealedCount ? target.slice(0,revealedCount) : '';
    const displayValue = revealedCount && !value ? prefix : value;
    const correct = displayValue === target;

    return <div className={'cross-row '+(locked?'locked ':'')+(correct?'correct ':'')}>
      <div className="cross-rung-no">{locked ? (index===0?'TOP':'FINAL') : String(index).padStart(2,'0')}</div>
      <div className="cross-clue">
        <span className="cross-clue-text">{rung.clue}</span>
        {!locked && <div className="cross-tools">
          <button className="cross-mini" onClick={()=>revealLetter(rung.id,target)} title="Reveal one letter"><Lightbulb size={12}/> Hint</button>
          <button className="cross-mini" onClick={()=>revealRow(rung.id,target)} title="Reveal entire word">Reveal row</button>
        </div>}
      </div>
      <input
        aria-label={'Answer for clue: '+rung.clue}
        value={displayValue}
        placeholder="4 letters"
        maxLength={4}
        disabled={locked && !unlocked && !solved}
        onChange={e=>handleInput(rung.id,e.target.value,rung.id==='top',rung.id==='bottom')}
        onFocus={kickOff}
        className={autoCheck && value && !correct ? 'wrong-input' : ''}
      />
      <span className="cross-check">{correct ? <Check size={15}/> : ''}</span>
    </div>;
  };

  const mixed = rungs;
  return <div className="game-panel crossclimb-panel">
    <div className="game-topline">
      <div><span>Time</span><strong>{formatTime(elapsed)}</strong></div>
      <div><span>Mistakes</span><strong>{mistakes}</strong></div>
      <div><span>Hints</span><strong>{hints}</strong></div>
      <div><span>Best</span><strong>{best ? formatTime(best) : '—'}</strong></div>
    </div>

    <div className="cross-intro">
      <p className="game-instructions">Solve the clues. Then arrange the middle words so each neighboring word differs by exactly one letter.</p>
      <div className="cross-toggles">
        <label><input type="checkbox" checked={autoCheck} onChange={e=>setAutoCheck(e.target.checked)}/> Auto-check</label>
        <label><input type="checkbox" checked={autoReorder} onChange={e=>setAutoReorder(e.target.checked)}/> Auto-reorder</label>
      </div>
    </div>

    <div className="cross-ladder">
      {renderWordInput(puzzle[0],0,true)}
      <div className="cross-middle">
        {mixed.map((rung,index) => (
          <div key={rung.id} className="cross-drag-wrap" draggable={!solved} onDragStart={()=>dragStart(rung.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(rung.id)}>
            <button className={'cross-drag-handle '+(selected===rung.id?'active':'')} onClick={()=>setSelected(rung.id)} title="Select rung to move"><ArrowUpDown size={13}/></button>
            {renderWordInput(rung,index+1,false)}
          </div>
        ))}
      </div>
      {renderWordInput(puzzle[puzzle.length-1],puzzle.length-1,true)}
    </div>

    <div className="cross-status">{status}</div>

    <div className="game-actions cross-actions">
      <button className="lab-button primary" onClick={unlock} disabled={solved}>Unlock top & bottom</button>
      <button className="lab-button primary" onClick={checkFinal} disabled={!unlocked || solved}>Finish ladder</button>
      <button className="lab-button" onClick={reset}><RotateCcw size={13}/> New puzzle</button>
    </div>

    <div className="cross-note">Original word-ladder puzzle inspired by the Crossclimb mechanic · client-side only · no backend.</div>
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
    {id:'maze' as const,label:'Maze Solver',note:'BFS · DFS · A*',icon:Zap},
    {id:'tango' as const,label:'Tango Logic',note:'Equal / different',icon:Sun},
    {id:'crossclimb' as const,label:'Crossclimb',note:'Word ladder',icon:ArrowUpDown}
  ],[]);
  return <div className="brain-lab">
    <div className="lab-tabs">{tabs.map(({id,label,note,icon:Icon})=><button className={game===id?'active':''} onClick={()=>setGame(id)} key={id}><Icon size={14}/><span>{label}</span><small>{note}</small></button>)}</div>
    <div className="lab-caption"><span>client-side experiments</span><span>•</span><span>scores stored locally</span><span>•</span><span>no backend</span></div>
    <AnimatePresence mode="wait">
      <motion.div key={game} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.22}}>{game==='memory'&&<Memory/>}{game==='tic'&&<Tic/>}{game==='reaction'&&<Reaction/>}{game==='2048'&&<Game2048/>}{game==='sudoku'&&<Sudoku/>}{game==='maze'&&<Maze/>}{game==='tango'&&<Tango/>}{game==='crossclimb'&&<Crossclimb/>}</motion.div>
    </AnimatePresence>
  </div>;
}
