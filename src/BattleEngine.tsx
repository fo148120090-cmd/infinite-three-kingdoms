import { useEffect, useMemo, useState } from 'react';
import type { Terrain, Unit } from './game/types';
import { GENERAL_BY_ID } from './game/data/generals';
import { createBattleField, createBattleFieldSeed } from './game/data/battleField';
import { createMonsterEnemies } from './game/systems/monsterBattle';
import { canEndPlayerTurn, createBattleState, endPlayerTurn, moveBattleUnit, selectBattleTarget, selectBattleUnit, attackBattleTarget, useBattleSkill, waitBattleUnit, type BattleState } from './game/systems/battleState';
import { buildBattlePresentation } from './game/systems/battlePresentation';
import { getTowerFloorRule, getNextTowerFloor } from './game/systems/towerRules';
import { BOARD_HEIGHT, BOARD_WIDTH } from './game/data/constants';
import { applyBattleModifiers } from './game/systems/battleModifiers';

const KEY='infinite-three-kingdoms-save-v2';
const terrainLabel:Record<Terrain,string>={plain:'평지',forest:'숲',hill:'고지',water:'물',fort:'요새'};
const statusLabel:Record<Unit['status'],string>={none:'정상',stun:'기절',burn:'화상',slow:'감속',guard:'방어'};
const statusBadge:Record<Exclude<Unit['status'],'none'>,string>={stun:'💫',burn:'🔥',slow:'🐌',guard:'🛡'};

type EquipmentState={level?:number;equipped?:boolean;optionA?:number;optionB?:number};
type SaveLike={floor?:number;level?:number;formation?:string[];equipment?:Record<string,EquipmentState>;stars?:Record<string,number>;gold?:number;gems?:number;materials?:number};
function readSave():SaveLike{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function buildPlayers(save:SaveLike):Unit[]{
 const formation=(save.formation||[]).map(id=>GENERAL_BY_ID[id]).filter(Boolean).slice(0,5);
 return formation.map((g,i)=>{
  const eq=save.equipment?.[g.id],star=Math.max(1,Math.min(6,save.stars?.[g.id]||1)),level=Math.max(1,save.level||1),equipLevel=eq?.equipped===false?0:Math.max(0,eq?.level||0),mult=1+0.05*(star-1);
  const hpOption=eq?.equipped===false?0:(eq?.optionA===1?equipLevel*5:eq?.optionB===1?equipLevel*5:0);
  const atkOption=eq?.equipped===false?0:(eq?.optionA===0?equipLevel*2:eq?.optionB===0?equipLevel*2:0);
  const hp=Math.floor((g.hp+(level-1)*12+equipLevel*10+hpOption)*mult),atk=Math.floor((g.atk+(level-1)*3+equipLevel*4+atkOption)*mult),defense=Math.floor((g.defense+(level-1)*1.5+equipLevel*2+((eq?.optionA===1||eq?.optionB===1)?Math.floor(equipLevel*.8):0))*mult);
  const base:Unit={...g,hp,atk,defense,maxHp:hp,currentHp:hp,team:'player',x:1+(i%3),y:8-Math.floor(i/3),acted:false,rage:0,buff:0,movePoints:g.move,status:'none',statusTurns:0};
  return applyBattleModifiers(base,formation);
 });
}
function terrainClass(t:Terrain){return `be-terrain-${t}`}
export default function BattleEngine(){
 const[save,setSave]=useState<SaveLike>(readSave);const[engine,setEngine]=useState<BattleState|null>(null);const[terrain,setTerrain]=useState<Terrain[]>([]);const[seed,setSeed]=useState(0);const floor=save.floor||1;const rule=getTowerFloorRule(floor);const players=useMemo(()=>buildPlayers(save),[save]);
 const start=()=>{const nextSeed=createBattleFieldSeed();const nextTerrain=createBattleField(nextSeed);const enemies=createMonsterEnemies(floor);setSeed(nextSeed);setTerrain(nextTerrain);setEngine(createBattleState([...players,...enemies],[`천탑 ${floor}층 · ${rule.kind==='boss'?'BOSS':'일반'} 전투`,`지형 시드 ${nextSeed}`]));};
 useEffect(()=>{start()},[floor,players.length]);if(!engine||terrain.length!==BOARD_WIDTH*BOARD_HEIGHT)return null;
 const presentation=buildBattlePresentation(engine.units,terrain,engine.selectedId),selected=presentation.selected;const reachable=new Set(presentation.cells.filter(c=>c.reachable).map(c=>`${c.x},${c.y}`)),targets=new Set(presentation.cells.filter(c=>c.targetable).map(c=>`${c.x},${c.y}`));
 const apply=(next:BattleState)=>setEngine(next);const clickCell=(x:number,y:number)=>{const cell=presentation.cells.find(c=>c.x===x&&c.y===y);if(cell?.unit?.team==='player'){apply(selectBattleUnit(engine,cell.unit.id));return}if(cell?.unit?.team==='enemy'){apply(selectBattleTarget(engine,cell.unit.id));return}const result=moveBattleUnit(engine,terrain,x,y);if(result.success)apply(result.state)};
 const act=(fn:(s:BattleState)=>{state:BattleState;success:boolean})=>{const r=fn(engine);if(r.success)apply(r.state)};const victory=engine.phase==='victory',defeat=engine.phase==='defeat',finalFloor=floor>=100;
 const finish=()=>{if(victory){const nextFloor=getNextTowerFloor(floor);const fresh={...save,floor:nextFloor??100,gold:(save.gold||0)+rule.reward.gold,gems:(save.gems||0)+rule.reward.gems,materials:(save.materials||0)+rule.reward.materials};localStorage.setItem(KEY,JSON.stringify(fresh));setSave(fresh);setEngine(null)}else start()};
 return <section className="be-shell"><header className="be-header"><div><small>INFINITE THREE KINGDOMS · MANUAL SRPG</small><h2>천탑 {floor}층 {rule.kind==='boss'?'· BOSS':''}</h2><p>10×10 전장 · 랜덤 지형 · 이동 → 일반공격/고유 스킬/대기 · 몬스터 AI 턴</p></div><div className={engine.turn==='player'?'be-turn':'be-turn enemy'}>{engine.turn==='player'?'PLAYER TURN':'MONSTER TURN'}</div></header>
  <div className="be-layout"><div><div className="be-grid" aria-label="10×10 랜덤 지형 전장">{presentation.cells.map(cell=>{const key=`${cell.x},${cell.y}`,u=cell.unit;const showMove=reachable.has(key)&&!u,showAttack=targets.has(key)&&u?.team==='enemy';return <button key={key} aria-label={`${cell.x+1},${cell.y+1} ${terrainLabel[cell.terrain]}${showMove?' 이동 가능':''}${showAttack?' 공격 가능':''}`} className={`be-cell ${terrainClass(cell.terrain)} ${u?.team||''} ${cell.selected?'selected':''} ${u?.id===engine.targetId?'target':''} ${showMove?'reachable':''} ${showAttack?'targetable':''}`} onClick={()=>clickCell(cell.x,cell.y)}><span className="be-terrain-label">{terrainLabel[cell.terrain]}</span>{showMove&&<span className="be-cell-hint move">이동</span>}{showAttack&&<span className="be-cell-hint attack">공격</span>}{u&&<><b>{u.name.slice(0,2)}</b><small>{Math.max(0,u.currentHp)}/{u.maxHp}</small>{u.status!=='none'&&<span className={`be-unit-status ${u.status}`} title={`${statusLabel[u.status]} ${u.statusTurns}턴`}>{statusBadge[u.status]}<em>{u.statusTurns}</em></span>}</>}</button>})}</div>
   <div className="be-selected-info">{selected?<><div className="be-selected-top"><div><small>선택 장수</small><h3>{selected.name}</h3><p>{selected.title} · {selected.role}</p></div><span className={`be-status-pill ${selected.status}`}>{statusLabel[selected.status]}{selected.statusTurns>0?` · ${selected.statusTurns}턴`:''}</span></div><div className="be-stat-strip"><span>HP <b>{Math.max(0,selected.currentHp)}/{selected.maxHp}</b></span><span>공격 <b>{selected.atk}</b></span><span>방어 <b>{selected.defense}</b></span><span>사거리 <b>{selected.range}</b></span><span>이동 <b>{selected.movePoints}</b></span></div><div className="be-skill-line"><b>✦ {selected.skill}</b><span>위력 {selected.skillPower||'지원형'}</span></div></>:<span>장수를 선택하면 전투 스탯과 고유 스킬이 표시됩니다.</span>}</div>
   <div className="be-actions"><strong>{selected?`${selected.name} · ${selected.acted?'행동 완료':'행동 가능'}`:'장수를 선택하세요'}</strong><button onClick={()=>act(s=>attackBattleTarget(s,terrain))} disabled={!engine.targetId}>⚔ 일반공격</button><button onClick={()=>act(s=>useBattleSkill(s,terrain))} disabled={!selected||selected.acted}>✦ 고유 스킬</button><button onClick={()=>act(waitBattleUnit)} disabled={!selected||selected.acted}>대기</button><button onClick={()=>act(s=>endPlayerTurn(s,terrain,floor))} disabled={!canEndPlayerTurn(engine)}>몬스터 턴 진행</button></div>
   {(victory||defeat)&&<div className="be-result"><h2>{victory?(finalFloor?'천탑 완주!':'전투 승리!'):'전투 패배...'}</h2>{victory&&<p>{finalFloor?'100층을 정복했습니다! 최종 보상을 획득했습니다.':`보상: 금화 +${rule.reward.gold} · 보옥 +${rule.reward.gems} · 재료 +${rule.reward.materials}`}</p>}<button onClick={finish}>{victory?(finalFloor?'완주 확인':'다음 층'):'다시 도전'}</button></div>}</div><aside className="be-side"><h3>전투 로그</h3><p>지형 시드: {seed}</p>{engine.log.slice(-8).reverse().map((x,i)=><p key={`${x}-${i}`}>{x}</p>)}<div className="be-roster"><h3>편성</h3>{presentation.playerUnits.map(u=><button key={u.id} className={u.id===engine.selectedId?'active':''} onClick={()=>apply(selectBattleUnit(engine,u.id))}><b>{u.name}</b><span>{u.acted?'행동 완료':`HP ${Math.max(0,u.currentHp)} · 방어 ${u.defense}`}</span></button>)}</div></aside></div></section>;
}
