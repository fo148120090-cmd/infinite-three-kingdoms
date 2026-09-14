import { useEffect, useMemo, useState } from 'react';
import type { Terrain, Unit } from './game/types';
import { GENERAL_BY_ID } from './game/data/generals';
import { createMonsterEnemies } from './game/systems/monsterBattle';
import { canEndPlayerTurn, createBattleState, endPlayerTurn, getBattleTargetable, moveBattleUnit, selectBattleTarget, selectBattleUnit, attackBattleTarget, useBattleSkill, waitBattleUnit, type BattleState } from './game/systems/battleState';
import { buildBattlePresentation } from './game/systems/battlePresentation';
import { getTowerFloorRule } from './game/systems/towerRules';
import { BOARD_HEIGHT, BOARD_WIDTH } from './game/data/constants';

const KEY='infinite-three-kingdoms-save-v2';
const terrain:Terrain[]=Array.from({length:42},(_,i)=>i===17||i===18||i===24?'forest':i===11||i===12?'hill':i===26||i===27?'water':i===32?'fort':'plain');
const terrainLabel:Record<Terrain,string>={plain:'평지',forest:'숲',hill:'고지',water:'물',fort:'요새'};

type SaveLike={floor?:number;level?:number;formation?:string[];equipment?:Record<string,{level?:number;equipped?:boolean}>;stars?:Record<string,number>;gold?:number;gems?:number;materials?:number};

function readSave():SaveLike{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}

function buildPlayers(save:SaveLike):Unit[]{
 const formation=(save.formation||[]).map(id=>GENERAL_BY_ID[id]).filter(Boolean).slice(0,5);
 return formation.map((g,i)=>{
  const eq=save.equipment?.[g.id];
  const star=save.stars?.[g.id]||1;
  const level=save.level||1;
  const equipLevel=eq?.equipped===false?0:(eq?.level||0);
  const mult=1+0.05*(star-1);
  const hp=Math.floor((g.hp+(level-1)*12+equipLevel*10)*mult);
  const atk=Math.floor((g.atk+(level-1)*3+equipLevel*4)*mult);
  return {...g,hp,atk,maxHp:hp,currentHp:hp,team:'player' as const,x:i%3,y:5-Math.floor(i/3),acted:false,rage:0,buff:0,movePoints:g.move,status:'none' as const,statusTurns:0};
 });
}

function terrainClass(t:Terrain){return `be-terrain-${t}`}

export default function BattleEngine(){
 const[save,setSave]=useState<SaveLike>(readSave);
 const[engine,setEngine]=useState<BattleState|null>(null);
 const floor=save.floor||1;
 const rule=getTowerFloorRule(floor);
 const players=useMemo(()=>buildPlayers(save),[save]);
 const start=()=>{const enemies=createMonsterEnemies(floor);setEngine(createBattleState([...players,...enemies],[`천탑 ${floor}층 · ${rule.kind==='boss'?'BOSS':'일반'} 전투`]));};
 useEffect(()=>{start()},[floor,players.length]);
 if(!engine)return null;
 const presentation=buildBattlePresentation(engine.units,terrain,engine.selectedId);
 const selected=presentation.selected;
 const reachable=new Set(presentation.cells.filter(cell=>cell.reachable).map(cell=>`${cell.x},${cell.y}`));
 const targets=new Set(presentation.cells.filter(cell=>cell.targetable).map(cell=>`${cell.x},${cell.y}`));
 const apply=(next:BattleState)=>setEngine(next);
 const clickCell=(x:number,y:number)=>{
  const cell=presentation.cells.find(candidate=>candidate.x===x&&candidate.y===y);
  if(cell?.unit?.team==='player'){apply(selectBattleUnit(engine,cell.unit.id));return}
  if(cell?.unit?.team==='enemy'){apply(selectBattleTarget(engine,cell.unit.id));return}
  const result=moveBattleUnit(engine,terrain,x,y);if(result.success)apply(result.state);
 };
 const act=(fn:(s:BattleState)=>{state:BattleState;success:boolean})=>{const r=fn(engine);if(r.success)apply(r.state)};
 const victory=engine.phase==='victory';
 const defeat=engine.phase==='defeat';
 const finish=()=>{if(victory){const nextFloor=Math.min(100,floor+1);const fresh={...save,floor:nextFloor,gold:(save.gold||0)+rule.reward.gold,gems:(save.gems||0)+rule.reward.gems,materials:(save.materials||0)+rule.reward.materials};localStorage.setItem(KEY,JSON.stringify(fresh));setSave(fresh);setEngine(null)}else{start()}};
 return <section className="be-shell">
  <header className="be-header"><div><small>INFINITE THREE KINGDOMS · MANUAL SRPG</small><h2>천탑 {floor}층 {rule.kind==='boss'?'· BOSS':''}</h2><p>7×6 전장 · 이동 → 일반공격/고유 스킬/대기 · 몬스터 AI 턴</p></div><div className={engine.turn==='player'?'be-turn':'be-turn enemy'}>{engine.turn==='player'?'PLAYER TURN':'MONSTER TURN'}</div></header>
  <div className="be-layout"><div>
   <div className="be-grid">{presentation.cells.map(cell=>{const key=`${cell.x},${cell.y}`,u=cell.unit;return <button key={key} className={`be-cell ${terrainClass(cell.terrain)} ${u?.team||''} ${cell.selected?'selected':''} ${u?.id===engine.targetId?'target':''} ${reachable.has(key)?'reachable':''} ${targets.has(key)?'targetable':''}`} onClick={()=>clickCell(cell.x,cell.y)}><span className="be-terrain-label">{terrainLabel[cell.terrain]}</span>{u&&<><b>{u.name.slice(0,2)}</b><small>{Math.max(0,u.currentHp)}/{u.maxHp}</small></>}</button>})}</div>
   <div className="be-actions"><strong>{selected?`${selected.name} · HP ${selected.currentHp}/${selected.maxHp} · 이동 ${selected.movePoints}`:'장수를 선택하세요'}</strong><button onClick={()=>act(s=>attackBattleTarget(s,terrain))} disabled={!engine.targetId}>⚔ 일반공격</button><button onClick={()=>act(s=>useBattleSkill(s,terrain))} disabled={!selected||selected.acted}>✦ 고유 스킬</button><button onClick={()=>act(waitBattleUnit)} disabled={!selected||selected.acted}>대기</button><button onClick={()=>act(s=>endPlayerTurn(s,terrain))} disabled={!canEndPlayerTurn(engine)}>몬스터 턴 진행</button></div>
   {(victory||defeat)&&<div className="be-result"><h2>{victory?'전투 승리!':'전투 패배...'}</h2>{victory&&<p>보상: 금화 +{rule.reward.gold} · 보옥 +{rule.reward.gems} · 재료 +{rule.reward.materials}</p>}<button onClick={finish}>{victory?'다음 층':'다시 도전'}</button></div>}
  </div><aside className="be-side"><h3>전투 로그</h3>{engine.log.slice(-8).reverse().map((x,i)=><p key={`${x}-${i}`}>{x}</p>)}<div className="be-roster"><h3>편성</h3>{presentation.playerUnits.map(u=><button key={u.id} className={u.id===engine.selectedId?'active':''} onClick={()=>apply(selectBattleUnit(engine,u.id))}><b>{u.name}</b><span>{u.acted?'행동 완료':`이동 ${u.movePoints}`}</span></button>)}</div></aside></div>
 </section>;
}
