import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpDown, Check, Lightbulb, RotateCcw, Trophy } from 'lucide-react';

type Game = 'tic' | 'wend';

const emptyBoard = Array.from({ length: 9 }, () => null as 'X' | 'O' | null);

function storedNumber(key:string, fallback=0){
  if(typeof window==='undefined') return fallback;
  return Number(window.localStorage.getItem(key) || fallback);
}

function winner(board:(string|null)[]){
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const [a,b,c] of lines){
    if(board[a]&&board[a]===board[b]&&board[a]===board[c]) return board[a];
  }
  return board.every(Boolean) ? 'draw' : null;
}

function minimax(board:(string|null)[], maximizing:boolean):number{
  const w=winner(board);
  if(w==='O') return 1;
  if(w==='X') return -1;
  if(w==='draw') return 0;

  const moves=board.map((v,i)=>v?null:i).filter((v):v is number=>v!==null);
  const scores=moves.map(i=>{
    const next=[...board];
    next[i]=maximizing?'O':'X';
    return minimax(next,!maximizing);
  });
  return maximizing?Math.max(...scores):Math.min(...scores);
}

function aiMove(board:(string|null)[]){
  const moves=board.map((v,i)=>v?null:i).filter((v):v is number=>v!==null);
  let best=-Infinity;
  let pick=moves[0]??0;

  for(const i of moves){
    const next=[...board];
    next[i]='O';
    const score=minimax(next,false);
    if(score>best){
      best=score;
      pick=i;
    }
  }
  return pick;
}

function Tic(){
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
      const next={
        wins:prev.wins+(result==='win'?1:0),
        losses:prev.losses+(result==='loss'?1:0),
        draws:prev.draws+(result==='draw'?1:0),
        streak:result==='win'?prev.streak+1:0
      };
      window.localStorage.setItem('brain-tic-wins',String(next.wins));
      window.localStorage.setItem('brain-tic-losses',String(next.losses));
      window.localStorage.setItem('brain-tic-draws',String(next.draws));
      window.localStorage.setItem('brain-tic-streak',String(next.streak));
      return next;
    });
  };

  const move=(i:number)=>{
    if(board[i]||w||thinking) return;

    const next=[...board];
    next[i]='X';
    const humanResult=winner(next);
    setBoard(next);

    if(humanResult){
      setLast(humanResult==='X'?'You win! 🔥':'Draw — rematch?');
      record(humanResult==='X'?'win':'draw');
      return;
    }

    setThinking(true);
    window.setTimeout(()=>{
      const pick=aiMove(next);
      const out=[...next];
      out[pick]='O';
      const result=winner(out);
      setBoard(out);
      setThinking(false);

      if(result){
        setLast(result==='O'?'AI wins — run it back.':'Draw — rematch?');
        record(result==='O'?'loss':'draw');
      }
    },220);
  };

  const reset=()=>{
    setBoard([...emptyBoard]);
    setThinking(false);
    setLast('');
  };

  return <div className="game-panel">
    <div className="game-topline">
      <div><span>Wins</span><strong>{stats.wins}</strong></div>
      <div><span>Losses</span><strong>{stats.losses}</strong></div>
      <div><span>Streak</span><strong>{stats.streak} 🔥</strong></div>
      <div><span>Engine</span><strong>Minimax</strong></div>
    </div>

    <div className="tic-board">
      {board.map((v,i)=><motion.button
        whileHover={{backgroundColor:'rgba(255,255,255,.055)',scale:1.02}}
        whileTap={{scale:.95}}
        className={'tic-cell '+(v||'')}
        onClick={()=>move(i)}
        key={i}
        aria-label={'Tic-Tac-Toe cell '+(i+1)}
      >{v||''}</motion.button>)}
    </div>

    <div className="game-actions">
      <span className="game-status">{last||(w==='draw'?'Draw.':w?w+' wins.':thinking?'AI thinking…':'Your move — build a streak.')}</span>
      <button className="lab-button" onClick={reset}><RotateCcw size={13}/> Rematch</button>
    </div>
  </div>;
}

type WendPuzzle={
  size:number;
  grid:string[];
  words:string[];
  lengths:number[];
  paths:number[][];
};

function snakeTour(size:number){
  const tour:number[]=[];
  for(let r=0;r<size;r++){
    if(r%2===0){
      for(let c=0;c<size;c++) tour.push(r*size+c);
    }else{
      for(let c=size-1;c>=0;c--) tour.push(r*size+c);
    }
  }
  return tour;
}

function columnTour(size:number){
  const tour:number[]=[];
  for(let c=0;c<size;c++){
    if(c%2===0){
      for(let r=0;r<size;r++) tour.push(r*size+c);
    }else{
      for(let r=size-1;r>=0;r--) tour.push(r*size+c);
    }
  }
  return tour;
}

function spiralTour(size:number){
  const out:number[]=[];
  let top=0,bottom=size-1,left=0,right=size-1;
  while(top<=bottom&&left<=right){
    for(let c=left;c<=right;c++) out.push(top*size+c);
    top++;
    for(let r=top;r<=bottom;r++) out.push(r*size+right);
    right--;
    if(top<=bottom){
      for(let c=right;c>=left;c--) out.push(bottom*size+c);
      bottom--;
    }
    if(left<=right){
      for(let r=bottom;r>=top;r--) out.push(r*size+left);
      left++;
    }
  }
  return out;
}

function buildWendPuzzle(
  tour:number[],
  words:string[]
):WendPuzzle{
  const size=Math.sqrt(tour.length);
  const lengths=words.map(word=>word.length);
  const grid=Array<string>(tour.length).fill('');
  const paths:number[][]=[];
  let cursor=0;

  for(const word of words){
    const segment=tour.slice(cursor,cursor+word.length);
    paths.push(segment);
    segment.forEach((cell,i)=>{grid[cell]=word[i];});
    cursor+=word.length;
  }

  return {size,grid,words,lengths,paths};
}

function makeWendPuzzles():WendPuzzle[]{
  const words=['ARCHITECTURE','DATABASE','LATENCY','THREAD','KERNEL','CACHE','QUEUE'];
  const reversed=['QUEUE','CACHE','KERNEL','THREAD','LATENCY','DATABASE','ARCHITECTURE'];
  const rotated=['LATENCY','ARCHITECTURE','CACHE','DATABASE','QUEUE','THREAD','KERNEL'];

  return [
    buildWendPuzzle(snakeTour(7),words),
    buildWendPuzzle(columnTour(7),reversed),
    buildWendPuzzle(spiralTour(7),rotated)
  ];
}

function Wend(){
  const puzzles=useMemo(()=>makeWendPuzzles(),[]);
  const [puzzleIndex,setPuzzleIndex]=useState(0);
  const puzzle=puzzles[puzzleIndex];
  const [path,setPath]=useState<number[]>([]);
  const [found,setFound]=useState<string[]>([]);
  const [history,setHistory]=useState<number[][]>([]);
  const [message,setMessage]=useState('');
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
    setElapsed(0);
    setStarted(null);
    setComplete(false);
    setPath([]);
    setFound([]);
    setHistory([]);
    setMessage('');
    setHints(0);
    setUsedHint(null);
    setScore(0);
    setDragging(false);
    setStreak(0);
    window.localStorage.setItem('brain-wend-streak','0');
  },[puzzleIndex]);

  useEffect(()=>{
    if(!started||complete) return;
    const id=window.setInterval(()=>setElapsed(performance.now()-started),100);
    return()=>window.clearInterval(id);
  },[started,complete]);

  const formatTime=(ms:number)=>
    String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0');

  const row=(i:number)=>Math.floor(i/puzzle.size);
  const col=(i:number)=>i%puzzle.size;
  const adjacent=(a:number,b:number)=>
    Math.abs(row(a)-row(b))+Math.abs(col(a)-col(b))===1;
  const word=(ids:number[])=>ids.map(i=>puzzle.grid[i]).join('');

  const begin=(i:number)=>{
    if(complete||found.length===puzzle.words.length||usedCells.has(i)) return;
    if(!started) setStarted(performance.now());
    setMessage('');
    setUsedHint(null);
    setDragging(true);
    setPath([i]);
  };

  const extend=(i:number)=>{
    if(!dragging||complete||path.length===0) return;
    const last=path[path.length-1];
    if(i===last||path.includes(i)||usedCells.has(i)||!adjacent(last,i)) return;
    setPath(prev=>[...prev,i]);
  };

  const finish=()=>{
    if(!dragging) return;
    setDragging(false);

    if(path.length<2){
      setPath([]);
      return;
    }

    const formed=word(path);
    const targetIndex=puzzle.words.indexOf(formed);

    if(targetIndex>=0&&!found.includes(formed)){
      setHistory(prev=>[...prev,path]);
      setFound(prev=>{
        const next=[...prev,formed];
        const gained=formed.length*100+Math.max(0,100-hints*12);
        const nextScore=score+gained;

        setScore(nextScore);
        setStreak(prevStreak=>{
          const nextStreak=prevStreak+1;
          window.localStorage.setItem('brain-wend-streak',String(nextStreak));
          return nextStreak;
        });

        if(next.length===puzzle.words.length){
          setComplete(true);
          setElapsed(performance.now()-(started??performance.now()));
          setBest(prevBest=>{
            const nextBest=Math.max(prevBest,nextScore);
            window.localStorage.setItem('brain-wend-best',String(nextBest));
            return nextBest;
          });
        }
        return next;
      });
      setMessage('Nice find — keep the streak alive.');
      setPath([]);
      return;
    }

    setStreak(0);
    window.localStorage.setItem('brain-wend-streak','0');
    setMessage(formed+' is not one of the hidden words.');
    setPath([]);
  };

  useEffect(()=>{
    const onPointerUp=()=>{if(dragging) finish();};
    window.addEventListener('pointerup',onPointerUp);
    return()=>window.removeEventListener('pointerup',onPointerUp);
  },[dragging,path,found,hints,started,score]);

  const undo=()=>{
    setPath([]);
    setMessage('');
    setDragging(false);
    if(history.length===0) return;

    const removedPath=history[history.length-1];
    const removedWord=word(removedPath);
    setHistory(prev=>prev.slice(0,-1));
    setFound(prev=>prev.filter(item=>item!==removedWord));
    setComplete(false);
  };

  const reset=()=>{
    setPath([]);
    setFound([]);
    setHistory([]);
    setMessage('');
    setHints(0);
    setUsedHint(null);
    setComplete(false);
    setElapsed(0);
    setStarted(null);
    setDragging(false);
    setScore(0);
    setStreak(0);
    window.localStorage.setItem('brain-wend-streak','0');
  };

  const hint=()=>{
    if(complete||found.length===puzzle.words.length) return;
    if(!started) setStarted(performance.now());

    const targetIndex=puzzle.words.findIndex(item=>!found.includes(item));
    const targetPath=puzzle.paths[targetIndex];
    if(!targetPath) return;

    const reveal=Math.min(hints,targetPath.length-1);
    setHints(hints+1);
    setUsedHint(targetPath[reveal]);
    setMessage('Hint: the highlighted tile is part of the next word.');
  };

  const newPuzzle=()=>setPuzzleIndex(index=>(index+1)%puzzles.length);
  const formed=word(path);
  const points=(ids:number[])=>
    ids.map(i=>((col(i)+0.5)/puzzle.size*500)+','+((row(i)+0.5)/puzzle.size*500)).join(' ');

  return <div className="game-panel wend-panel">
    <div className="game-topline">
      <div><span>Difficulty</span><strong>Hard</strong></div>
      <div><span>Time</span><strong>{formatTime(elapsed)}</strong></div>
      <div><span>Score</span><strong>{score}</strong></div>
      <div><span>Streak</span><strong>{streak} 🔥</strong></div>
      <div><span>Best</span><strong>{best}</strong></div>
      <div><span>Found</span><strong>{found.length}/{puzzle.words.length}</strong></div>
    </div>

    <div className="wend-help">
      <span>7 × 7 board</span>
      <span>Drag through adjacent letters</span>
      <span>No diagonals</span>
      <span>Use every tile exactly once</span>
    </div>

    <div className="wend-layout">
      <div className="wend-board-wrap">
        <svg className="wend-lines" viewBox="0 0 500 500" aria-hidden="true">
          {history.map((ids,index)=><polyline key={'found-'+index} points={points(ids)} />)}
          {path.length>1&&<polyline className="active-path" points={points(path)} />}
        </svg>

        <div
          className="wend-grid"
          onPointerUp={finish}
          onPointerCancel={finish}
          onPointerMove={event=>{
            if(!dragging) return;
            const hit=document.elementFromPoint(event.clientX,event.clientY);
            const cell=hit?.closest?.('[data-wend-index]') as HTMLElement|null;
            const index=cell?Number(cell.dataset.wendIndex):NaN;
            if(Number.isFinite(index)) extend(index);
          }}
        >
          {puzzle.grid.map((letter,index)=>{
            const isPath=path.includes(index);
            const isFound=usedCells.has(index);

            return <button
              key={index}
              type="button"
              data-wend-index={index}
              className={'wend-cell '+(isPath?'current ':'')+(isFound?'found ':'')+(usedHint===index?'hinted ':'')}
              onPointerDown={event=>{event.preventDefault();begin(index);}}
              aria-label={'Letter '+letter+', tile '+(index+1)}
            >{letter}</button>;
          })}
        </div>
      </div>

      <aside className="wend-word-list" aria-live="polite">
        <div className="wend-list-title">Find these lengths</div>
        {puzzle.lengths.map((length,index)=>{
          const hit=puzzle.words[index]&&found.includes(puzzle.words[index])?puzzle.words[index]:undefined;
          return <div className={'wend-target '+(hit?'done':'')} key={index}>
            <span>{hit||Array.from({length},()=>'_').join(' ')}</span>
            {hit&&<Check size={14}/>}
          </div>;
        })}
        {formed&&<div className="wend-live">Current: <b>{formed}</b></div>}
        {message&&<div className="wend-error">{message}</div>}
        {complete&&<div className="wend-complete">Puzzle complete · {formatTime(elapsed)} · {score} points</div>}
      </aside>
    </div>

    <div className="game-actions">
      <button className="lab-button primary" onClick={hint} disabled={complete}><Lightbulb size={13}/> Hint</button>
      <button className="lab-button" onClick={undo} disabled={history.length===0}><RotateCcw size={13}/> Undo</button>
      <button className="lab-button" onClick={reset}><RotateCcw size={13}/> Reset</button>
      <button className="lab-button" onClick={newPuzzle}>New puzzle</button>
    </div>

    <div className="cross-note">Original hard grid-word challenge · score + streaks saved locally · no backend.</div>
  </div>;
}

export default function BrainLab(){
  const [game,setGame]=useState<Game>('wend');
  const tabs=useMemo(()=>[
    {id:'tic' as const,label:'Tic-Tac-Toe',note:'Minimax AI',icon:Trophy},
    {id:'wend' as const,label:'Grid Word',note:'Drag to make words',icon:ArrowUpDown}
  ],[]);

  return <div className="brain-lab">
    <div className="lab-tabs">
      {tabs.map(({id,label,note,icon:Icon})=>
        <button className={game===id?'active':''} onClick={()=>setGame(id)} key={id}>
          <Icon size={14}/>
          <span>{label}</span>
          <small>{note}</small>
        </button>
      )}
    </div>

    <div className="lab-caption">
      <span>client-side experiments</span><span>•</span><span>scores stored locally</span><span>•</span><span>no backend</span>
    </div>

    <AnimatePresence mode="wait">
      <motion.div
        key={game}
        initial={{opacity:0,y:10}}
        animate={{opacity:1,y:0}}
        exit={{opacity:0,y:-8}}
        transition={{duration:.22}}
      >
        {game==='tic'&&<Tic/>}
        {game==='wend'&&<Wend/>}
      </motion.div>
    </AnimatePresence>
  </div>;
}
