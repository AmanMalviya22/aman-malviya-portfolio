import { useEffect, useMemo, useState } from 'react';
import { Brain, Clock3, RotateCcw, Trophy, Zap } from 'lucide-react';

type Game = 'memory' | 'tic' | 'reaction';
const blank = Array.from({length:9}, () => null as 'X' | 'O' | null);

function winner(board:(string|null)[]) {
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const line of lines) { const a=line[0],b=line[1],c=line[2]; if(board[a] && board[a]===board[b] && board[a]===board[c]) return board[a]; }
  return board.every(Boolean) ? 'draw' : null;
}
function minimax(board:(string|null)[], max:boolean):number {
  const w=winner(board); if(w==='O') return 1; if(w==='X') return -1; if(w==='draw') return 0;
  const moves=board.map((v,i)=>v?null:i).filter((v):v is number => v!==null);
  const scores=moves.map(i=>{const next=[...board]; next[i]=max?'O':'X'; return minimax(next,!max)});
  return max?Math.max(...scores):Math.min(...scores);
}
function aiMove(board:(string|null)[]) {
  const moves=board.map((v,i)=>v?null:i).filter((v):v is number => v!==null); let best=-Infinity, pick=moves[0] ?? 0;
  for(const i of moves){const next=[...board];next[i]='O';const score=minimax(next,false);if(score>best){best=score;pick=i}} return pick;
}

function Memory() {
  const [seq,setSeq]=useState<number[]>([]),[flash,setFlash]=useState<number|null>(null),[input,setInput]=useState<number[]>([]);
  const [level,setLevel]=useState(1),[message,setMessage]=useState('Start a round to memorize the sequence.'),[best,setBest]=useState(0),[running,setRunning]=useState(false);
  useEffect(()=>{setBest(Number(localStorage.getItem('brain-memory-best')||0))},[]);
  const start=()=>{const next=Array.from({length:Math.min(3+level,12)},()=>Math.floor(Math.random()*16));setSeq(next);setInput([]);setRunning(true);setMessage('Watch…');let i=0;const id=window.setInterval(()=>{setFlash(next[i] ?? null);i++;if(i>=next.length){window.clearInterval(id);window.setTimeout(()=>{setFlash(null);setMessage('Your turn.')},300)}},430)};
  const press=(i:number)=>{if(!running||message!=='Your turn.')return;const next=[...input,i];setInput(next);if(next[next.length-1]!==seq[next.length-1]){setRunning(false);setLevel(1);setMessage('Missed it. Try again.');return}if(next.length===seq.length){setRunning(false);const b=Math.max(best,level);setBest(b);localStorage.setItem('brain-memory-best',String(b));setLevel(level+1);setMessage('Perfect. Next level?')}};
  return <div className="game-panel"><div className="game-meta"><div><span>Level</span><strong>{level}</strong></div><div><span>Best</span><strong>{best}</strong></div><div><span>Status</span><strong>{message}</strong></div></div><div className="memory-grid">{Array.from({length:16}).map((_,i)=><button className={'memory-tile '+(flash===i?'flash':'')} onClick={()=>press(i)} aria-label={'Memory tile '+(i+1)} key={i}>{flash===i?'•':''}</button>)}</div><div className="game-actions"><button className="lab-button primary" onClick={start}>Start round</button><button className="lab-button" onClick={()=>{setLevel(1);setMessage('Reset. Ready when you are.')}}><RotateCcw size={13}/> Reset</button></div></div>
}

function Tic() {
  const [board,setBoard]=useState<(string|null)[]>([...blank]); const [thinking,setThinking]=useState(false); const w=winner(board);
  const move=(i:number)=>{if(board[i]||w||thinking)return;const next=[...board];next[i]='X';setBoard(next);if(winner(next))return;setThinking(true);window.setTimeout(()=>{const pick=aiMove(next);const out=[...next];out[pick]='O';setBoard(out);setThinking(false)},240)};
  return <div className="game-panel"><div className="game-meta"><div><span>You</span><strong>X</strong></div><div><span>AI</span><strong>O</strong></div><div><span>Engine</span><strong>Minimax</strong></div></div><div className="tic-board">{board.map((v,i)=><button className={'tic-cell '+(v||'')} onClick={()=>move(i)} key={i}>{v||''}</button>)}</div><div className="game-actions"><span className="game-status">{w==='draw'?'Draw.':w?w+' wins.':thinking?'AI thinking…':'Your move.'}</span><button className="lab-button" onClick={()=>{setBoard([...blank]);setThinking(false)}}><RotateCcw size={13}/> New game</button></div></div>
}

function Reaction() {
  const [state,setState]=useState<'idle'|'armed'|'go'|'result'>('idle'),[started,setStarted]=useState(0),[score,setScore]=useState<number|null>(null),[best,setBest]=useState<number|null>(null);
  useEffect(()=>{const b=Number(localStorage.getItem('brain-reaction-best')||0);if(b)setBest(b)},[]);
  useEffect(()=>{if(state!=='armed')return;const id=window.setTimeout(()=>{setStarted(performance.now());setState('go')},1400+Math.random()*2500);return()=>window.clearTimeout(id)},[state]);
  const act=()=>{if(state==='idle'||state==='result'){setScore(null);setState('armed');return}if(state==='armed'){setState('result');return}const ms=Math.round(performance.now()-started);setScore(ms);setBest(prev=>{const next=!prev||ms<prev?ms:prev;localStorage.setItem('brain-reaction-best',String(next));return next});setState('result')};
  const label=state==='idle'?'Click to start':state==='armed'?'Wait for green…':state==='go'?'CLICK!':String(score)+' ms';
  return <div className="game-panel"><div className="game-meta"><div><span>Best</span><strong>{best?best+' ms':'—'}</strong></div><div><span>Signal</span><strong>{state==='go'?'GO':'READY'}</strong></div></div><button className={'reaction-zone state-'+state} onClick={act}><Zap size={25}/><strong>{label}</strong><span>{state==='armed'?'Clicking early resets the attempt':'Measure your visual reaction time'}</span></button><div className="game-actions"><button className="lab-button" onClick={()=>{setState('idle');setScore(null)}}><RotateCcw size={13}/> Reset</button></div></div>
}

export default function BrainLab() {
  const [game,setGame]=useState<Game>('memory');
  const tabs=useMemo(()=>[{id:'memory',label:'Memory Matrix',note:'Sequence recall',icon:Brain},{id:'tic',label:'Tic-Tac-Toe AI',note:'Minimax',icon:Trophy},{id:'reaction',label:'Reaction Test',note:'Human vs milliseconds',icon:Clock3}],[]);
  return <div className="brain-lab"><div className="lab-tabs">{tabs.map(({id,label,note,icon:Icon})=><button className={game===id?'active':''} onClick={()=>setGame(id as Game)} key={id}><Icon size={14}/><span>{label}</span><small>{note}</small></button>)}</div>{game==='memory'&&<Memory/>}{game==='tic'&&<Tic/>}{game==='reaction'&&<Reaction/>}</div>;
}
