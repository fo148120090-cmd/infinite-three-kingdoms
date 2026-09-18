
import { useEffect, useMemo, useState } from "react";
import { Brain, ChevronRight, CirclePause, CirclePlay, Coins, Gem, Heart, Map, Package, RotateCcw, Shield, Sparkles, Swords, Trophy, UserPlus, UserRound, Zap } from "lucide-react";
import { cloneTendencies, createMonster, defaultTendencies, heroesSeed, randomGeneralItem, createRecruitHero, type BattleUnit, type Hero, type Item, type Job, type RoomKind, type Tendencies, uniqueItems } from "./dungeonData";
import { grantExperience, promotionActions, promotionLabel } from "./promotion";
import { bondAfterBattle, decayMemories, relationshipFromMap, strongestBond } from "./relationships";
import { evolutionHint, monsterEvolutionTrees } from "./monsterEvolution";
import type { MonsterLineage } from "./dungeonData";
import { monsterActions } from "./monsterAbilities";
import { resolveDungeonEvent, resolveHiddenRoom } from "./dungeonEvents";
import { applyBehaviorHistory, behaviorSummary, buildProfile, partyPreference } from "./progression";
import { awardChronicle, chronicleBonuses, chronicleLabel, systemEvaluation, systemMood, systemStatus } from "./chronicle";
import { costumeLabel, costumesForJob } from "./costumes";
import { environmentDecisionBonus, environmentFor, environmentInfo, environmentTick, type EnvironmentKind } from "./dungeonEnvironment";

type Screen = "home" | "party" | "dungeon" | "battle" | "inventory" | "recruit";
type BattleMode = "dungeon" | "defense" | "raid";
type DefenseObjective = "gate" | "relic" | "escort";
type Save = { heroes: Hero[]; party: string[]; gold: number; materials: number; gems: number; floor: number; stage: number; items: Item[]; monsterLineages: MonsterLineage[]; scenarioClears:Record<string,number>; worldSealed?:boolean };
type Decision = { action: string; target?: string; detail: string; score: number };

const KEY = "autonomous-dungeon-demo-v1";
const jobKo: Record<Job,string> = {Warrior:"전사",Guardian:"수호자",Archer:"궁수",Mage:"마법사",Cleric:"성직자"};
const jobIcon: Record<Job,string> = {Warrior:"⚔️",Guardian:"🛡️",Archer:"🏹",Mage:"🔮",Cleric:"✚"};
const roomIcon: Record<RoomKind,string> = {battle:"⚔",elite:"☠",treasure:"◆",rest:"🔥",event:"?",hidden:"◇",boss:"👑",evilCave:"🕳"};
const roomKo: Record<RoomKind,string> = {battle:"일반 전투",elite:"정예 전투",treasure:"보물방",rest:"휴식처",event:"던전 이벤트",hidden:"숨은 방",boss:"심층 보스",evilCave:"악의 동굴"};
const defenseObjectiveKo: Record<DefenseObjective,string> = {gate:"성문",relic:"성유물",escort:"호위 대상"};
const tendencyKo: Record<keyof Tendencies,string> = {aggression:"공격성",bravery:"용맹",caution:"신중함",survival:"생존본능",protect:"아군보호",pursuit:"추적성",focus:"집중력",greed:"탐욕",curiosity:"호기심",cooperation:"협동성"};
const defenseObjectiveForFloor=(floor:number):DefenseObjective=>floor%3===1?"gate":floor%3===2?"relic":"escort";
const raidBossForFloor=(floor:number)=>floor%3===1?"Uruk":floor%3===2?"Arachne":"Demon";

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Save;
      return {...s, heroes:s.heroes.map(h=>({...h,tendencies:{...defaultTendencies[h.job],...h.tendencies}})), items:s.items||[], monsterLineages:(s.monsterLineages||[]).filter(x=>!x.id.endsWith("-boss")), scenarioClears:s.scenarioClears||{}, worldSealed:!!s.worldSealed};
    }
  } catch {}
  return {heroes:heroesSeed.map(h=>({...h,tendencies:cloneTendencies(h.tendencies)})),party:heroesSeed.slice(0,4).map(h=>h.id),gold:2500,materials:100,gems:100,floor:1,stage:0,items:[],monsterLineages:[],scenarioClears:{},worldSealed:false};
}
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const pct=(u:{hp:number;maxHp:number})=>u.maxHp?u.hp/u.maxHp:0;
const dist=(a:BattleUnit,b:BattleUnit)=>Math.abs(a.pos-b.pos);
const live=(u:BattleUnit[],team:"player"|"enemy")=>u.filter(x=>x.team===team&&x.alive);
const aiT=(t:Tendencies,item?:Item):Tendencies=>{
  const n={...t}; if(item) (Object.keys(item.aiMods) as (keyof Tendencies)[]).forEach(k=>n[k]=clamp(n[k]+(item.aiMods[k]||0))); return n;
};
const combatStats=(hero:Hero)=>{
  const m=hero.item.combatMods||{};
  const bonus=chronicleBonuses(hero);
  const hp=Math.round(hero.hp*(1+((m.hpPct||0)+(bonus.hpPct||0))/100));
  return {hp,maxHp:hp,attack:hero.attack+(m.attack||0)+(bonus.attack||0),defense:hero.defense+(m.defense||0)+(bonus.defense||0),speed:hero.speed*(1+((m.speedPct||0)+(bonus.speedPct||0))/100),range:hero.range+(m.range||0)};
};

function spawn(heroes:Hero[],party:string[],room:RoomKind,floor:number): BattleUnit[] {
  const ps: BattleUnit[] = heroes.filter(h=>party.includes(h.id)).map((h,i)=>{
    const s=combatStats(h);
    return {id:h.id,name:h.name,job:h.job,team:"player" as const,hp:s.hp,maxHp:s.maxHp,attack:s.attack,defense:s.defense,
      speed:s.speed,range:s.range,pos:1.1+i*.62,alive:true,tendencies:aiT(h.tendencies,h.item),item:h.item,
      relationships:h.relationships,memories:h.memories,promotionPath:h.promotionPath,actionText:"대기",cooldown:0,guard:0,xp:0,behaviorCounts:{...(h.behaviorCounts||{})}};
  });
  const pool=floor<3?["Goblin","Kobold","Slime"]:floor<5?["Gnoll","Lizardman","Arachne"]:["Orc","Uruk","Ogre"];
  const count=room==="boss"||room==="evilCave"?3:room==="elite"?4:3;
  let es=Array.from({length:count},(_,i)=>createMonster(pool[(i+floor)%pool.length],floor+2,room==="boss"?"Boss":room==="elite"?"Elite":"Normal",i));
  if(room==="boss"||room==="evilCave"){
    const bossSpecies=room==="evilCave"?"Demon":raidBossForFloor(floor);
    const base=createMonster(bossSpecies,Math.max(8,floor+5),"Boss",0);
    const bossName=room==="evilCave"?"악의 동굴 수문장":bossSpecies==="Uruk"?"우르크 전쟁대장":bossSpecies==="Arachne"?"둥지의 여왕":"지옥의 대공";
    es[0]={...base,name:bossName,pos:8.8};
  }
  return ps.concat(es.map(e=>({id:e.id,name:e.name,species:e.species,grade:e.grade,team:"enemy" as const,hp:e.hp,maxHp:e.maxHp,attack:e.attack,defense:e.defense,
    speed:e.speed,range:e.range,pos:e.pos,alive:true,tendencies:e.tendencies,mutation:e.mutation,actionText:"대기",cooldown:0,guard:0,xp:0})));
}

function asEnemy(e:ReturnType<typeof createMonster>,suffix="",lineage?:MonsterLineage):BattleUnit{
  const m=lineage?applyLineage(e,lineage):e;
  return {id:m.id+suffix,name:m.name,species:m.species,grade:m.grade,team:"enemy" as const,hp:m.hp,maxHp:m.maxHp,attack:m.attack,defense:m.defense,speed:m.speed,range:m.range,pos:m.pos,alive:true,tendencies:m.tendencies,mutation:m.mutation,actionText:"대기",cooldown:0,guard:0,xp:0};
}

function decisions(a:BattleUnit,u:BattleUnit[],env?:EnvironmentKind):Decision[] {
  const allies=live(u,a.team), enemies=live(u,a.team==="player"?"enemy":"player");
  const nearest=enemies.slice().sort((x,y)=>dist(a,x)-dist(a,y))[0];
  const weak=enemies.slice().sort((x,y)=>pct(x)-pct(y))[0];
  const ally=allies.slice().sort((x,y)=>pct(x)-pct(y))[0];
  const t=a.tendencies; const arr:Decision[]=[];
  const threat=nearest?Math.min(100,(1-pct(a))*100+60):0;
  const mod=a.item?.aiMods||{};
  const lossBias=(a.memories||[]).filter(m=>m.text.includes("전사")).reduce((n,m)=>n+m.weight,0);
  const envBonus=env?environmentDecisionBonus(a,env):0;
  if(a.cooldown<=0) for(const p of promotionActions(a.promotionPath)){
    let score=p.bonus+(t.focus+t.bravery+t.protect+t.aggression)*.08+envBonus;
    if((p.name.includes("대회복")||p.name.includes("수호"))&&ally) score+=Math.max(0,(1-pct(ally))*55);
    if((p.name.includes("사격")||p.name.includes("사냥")||p.name.includes("심판"))&&weak) score+=Math.max(0,(1-pct(weak))*45);
    if((p.name.includes("폭발")||p.name.includes("저주"))&&enemies.length>=2) score+=enemies.length*10;
    arr.push({action:p.name,detail:p.detail,score});
  }
  if(a.team==="enemy"&&a.species&&a.cooldown<=0){
    for(const m of monsterActions(a.species,a.grade,a.mutation)){
      let score=m.bonus+t.focus*.08+envBonus;
      if((m.name==="대지 강타"||m.name==="분열"||m.name==="영역 지배")&&enemies.length>=2)score+=18;
      if((m.name==="무리 사냥"||m.name==="약점 추적"||m.name==="역할 분석")&&weak)score+=Math.max(0,(1-pct(weak))*35);
      if(m.name==="회피 기동"&&pct(a)<.5)score+=35;
      arr.push({action:m.name,detail:m.detail,score});
    }
  }

  if(nearest){
    let s=50+t.aggression*.35+t.bravery*.2+t.focus*.1+(1-pct(weak))*40+envBonus;
    if(pct(weak)<.2)s+=25; if(dist(a,nearest)<=a.range)s+=30; s+=(mod.aggression||0)*.7;
    arr.push({action:"일반 공격",target:(a.job==="Archer"||a.job==="Mage"?weak.id:nearest.id),detail:"위협과 마무리 가능성을 계산",score:s});
  }
  if(a.job==="Warrior") arr.push({action:"추격",target:weak?.id,detail:"약해진 적을 끝까지 압박",score:25+t.pursuit*.5+t.aggression*.2+t.bravery*.15-threat*.2+(mod.pursuit||0)*.8});
  if(a.job==="Guardian"&&ally) arr.push({action:"아군 보호",target:ally.id,detail:"위험한 아군 쪽으로 접근해 피해를 줄임",score:20+t.protect*.5+t.cooperation*.25+(1-pct(ally))*55+relationshipFromMap(a.relationships,ally.id).trust*.22+relationshipFromMap(a.relationships,ally.id).bond*.12+(mod.protect||0)*.8+Math.min(12,lossBias*.2)});
  if(a.job==="Cleric"&&ally) arr.push({action:"회복",target:ally.id,detail:"가장 위험한 아군을 먼저 치료",score:30+t.protect*.35+t.cooperation*.25+(1-pct(ally))*75+relationshipFromMap(a.relationships,ally.id).trust*.16+relationshipFromMap(a.relationships,ally.id).bond*.1+(mod.protect||0)*.7-(pct(ally)>.78?35:0)+Math.min(8,lossBias*.15)});
  if(a.job==="Mage") arr.push({action:"광역 마법",detail:"사거리에 들어온 적 수를 계산",score:40+t.aggression*.2+t.focus*.2+enemies.filter(x=>dist(a,x)<=5).length*14+(mod.focus||0)*.8});
  if(a.team==="enemy"&&a.species==="Goblin") arr.push({action:"기습 후퇴",target:nearest?.id,detail:"위험해지면 생존을 위해 물러남",score:20+t.greed*.2+t.caution*.35+(1-pct(a))*60});
  if(a.team==="enemy"&&a.grade==="Boss"){
    const phase=pct(a)>0.65?1:pct(a)>0.35?2:3;
    arr.push({action:"보스 패턴",detail:"페이즈 "+phase+" 패턴을 선택하고 전장을 압박",score:42+t.focus*.25+t.bravery*.25+(phase-1)*18});
  }
  arr.push({action:"후퇴",detail:"현재 HP와 적 위협을 기준으로 생존 판단",score:20+t.survival*.45+t.caution*.3+threat*.4-t.bravery*.25+envBonus+(pct(a)<.12?20:0)-(a.item?.id==="berserker-heart"?35:0)});
  arr.push({action:"대기",detail:"즉시 행동의 가치가 낮다고 판단",score:16+t.caution*.05+envBonus*.2});
  return arr;
}

function weighted(ds:Decision[]):Decision {
  const list=ds.filter(d=>d.score>0).sort((a,b)=>b.score-a.score).slice(0,4);
  const top=list.map((d,i)=>({...d,score:d.score*Math.pow(.82,i)}));
  const total=top.reduce((n,d)=>n+d.score,0); let r=Math.random()*total;
  for(const d of top){r-=d.score;if(r<=0)return d;} return top[0];
}

function hit(a:BattleUnit,b:BattleUnit,m=1){
  const critChance=Math.min(.35,(a.tendencies.focus>82?.15:0)+(a.item?.combatMods?.critPct||0)/100);
  const crit=Math.random()<critChance?1.55:1;
  return Math.max(4,Math.round((a.attack*m-b.defense*.58)*crit*(.93+Math.random()*.14)));
}

function doAI(u:BattleUnit[],id:string,env?:EnvironmentKind):{units:BattleUnit[];decision:Decision;line:string}{
  const n=u.map(x=>({...x,behaviorCounts:{...(x.behaviorCounts||{})}})); const a=n.find(x=>x.id===id)!; const d=weighted(decisions(a,n,env));
  const enemies=live(n,a.team==="player"?"enemy":"player"), allies=live(n,a.team);
  const nearest=enemies.slice().sort((x,y)=>dist(a,x)-dist(a,y))[0];
  const weak=enemies.slice().sort((x,y)=>pct(x)-pct(y))[0];
  a.behaviorCounts![d.action]=(a.behaviorCounts![d.action]||0)+1;
  const by=(x?:string)=>n.find(q=>q.id===x&&q.alive);
  const move=(target:BattleUnit)=>{
    const baseStep=(a.job==="Archer"||a.job==="Mage"||a.job==="Cleric") ? .65 : .9;
    const step=env==="narrow"?baseStep*.72:env==="water"&&a.species!=="Lizardman"?baseStep*.86:baseStep;
    a.pos+=(target.pos>a.pos?step:-step); a.pos=Math.max(.3,Math.min(9.7,a.pos));
  };
  let line="";
  if(d.action==="광폭 돌격"){
    const t=by(d.target)||nearest; if(t){if(dist(a,t)>a.range)move(t);else{const x=hit(a,t,1.35);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.pos=Math.min(9.7,a.pos+.25);a.actionText="광폭 돌격 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="수호 맹세"){
    const t=by(d.target)||allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){a.pos += t.pos>a.pos?.55:-.55;a.guard=3;t.guard=Math.max(t.guard,2);a.actionText="수호 맹세 → "+t.name;line=a.actionText;}
  } else if(d.action==="결투 집중"||d.action==="정밀 사격"||d.action==="사냥 본능"||d.action==="심판"){
    const t=by(d.target)||weak||nearest; if(t){if(dist(a,t)>a.range)move(t);else{const x=hit(a,t,d.action==="정밀 사격"?1.25:1.12);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText=d.action+" → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="철벽 진형"){
    const t=allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){a.guard=4;t.guard=3;a.pos += t.pos>a.pos?.45:-.45;a.actionText="철벽 진형 → "+t.name;line=a.actionText;}
  } else if(d.action==="원소 폭발"||d.action==="저주 확산"){
    const ts=enemies.filter(x=>dist(a,x)<=5).slice(0,4); if(ts.length){const bits=ts.map(t=>{const x=hit(a,t,d.action==="원소 폭발"?0.9:0.7);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;return t.name+" -"+x});a.actionText=d.action+" → "+bits.join(", ");line=a.actionText;}
  } else if(d.action==="비전 해방"){
    const t=weak||nearest; if(t){if(dist(a,t)>a.range)move(t);else{const x=hit(a,t,1.45);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText="비전 해방 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="대회복"){
    const t=allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){const x=Math.round(t.maxHp*((.30+a.tendencies.cooperation*.001)*(1+(a.item?.combatMods?.healPct||0)/100)));t.hp=Math.min(t.maxHp,t.hp+x);t.guard=Math.max(t.guard,1);a.actionText="대회복 → "+t.name+" (+"+x+")";line=a.actionText;}
  } else if(d.action==="분열"){
    if(pct(a)>.55 && n.filter(x=>x.team==="enemy").length<8){
      const child={...a,id:a.id+"-split-"+Math.random().toString(36).slice(2,5),name:a.name+" 분열체",hp:Math.round(a.maxHp*.28),maxHp:Math.round(a.maxHp*.28),attack:Math.max(3,Math.round(a.attack*.45)),defense:Math.max(1,Math.round(a.defense*.45)),pos:Math.max(.4,a.pos-.4),alive:true};
      n.push(child);a.hp=Math.round(a.hp*.72);a.actionText="분열 → "+child.name;line=a.actionText;
    } else {a.actionText="분열 대기";line=a.actionText;}
  } else if(d.action==="함정 투척"||d.action==="매복 함정"||d.action==="거미줄"){
    const t=by(d.target)||weak||nearest;
    if(t){t.speed=Math.max(.35,t.speed-.22);a.actionText=d.action+" → "+t.name;line=a.actionText;}
  } else if(d.action==="무리 사냥"||d.action==="약점 추적"||d.action==="연계 공격"){
    const t=by(d.target)||weak||nearest;
    if(t){if(dist(a,t)>a.range)move(t);else{const x=hit(a,t,1.2);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText=d.action+" → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="전투 함성"||d.action==="지휘 명령"){
    live(n,"enemy").filter(x=>x.id!==a.id).forEach(x=>{x.tendencies.aggression=Math.min(100,x.tendencies.aggression+7);x.tendencies.focus=Math.min(100,x.tendencies.focus+5);});
    a.actionText=d.action+" · 아군 강화";line=a.actionText;
  } else if(d.action==="측면 습격"||d.action==="급강하"||d.action==="굴 파기 기습"){
    const t=by(d.target)||weak||nearest;
    if(t){a.pos=Math.max(.3,t.pos-.7);const x=hit(a,t,1.18);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText=d.action+" → "+t.name+" (-"+x+")";line=a.actionText;}
  } else if(d.action==="독성 압박"||d.action==="매혹"){
    const t=by(d.target)||weak||nearest;
    if(t){t.tendencies.focus=Math.max(0,t.tendencies.focus-(d.action==="매혹"?12:7));t.attack=Math.max(1,Math.round(t.attack*.92));const x=hit(a,t,.9);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText=d.action+" → "+t.name+" (-"+x+")";line=a.actionText;}
  } else if(d.action==="대지 강타"){
    const ts=enemies.filter(x=>dist(a,x)<=2.4).slice(0,4);
    if(ts.length){const bits=ts.map(t=>{const x=hit(a,t,1.05);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;return t.name+" -"+x});a.actionText="대지 강타 → "+bits.join(", ");line=a.actionText;}
  } else if(d.action==="회피 기동"){
    a.pos=Math.max(.3,a.pos-.95);a.tendencies.survival=Math.min(100,a.tendencies.survival+7);a.actionText="회피 기동 · 거리 확보";line=a.actionText;
  } else if(d.action==="역할 분석"){
    const t=enemies.slice().sort((x,y)=>(x.job==="Cleric"?0:1)-(y.job==="Cleric"?0:1)||pct(x)-pct(y))[0]||weak||nearest;
    if(t){if(dist(a,t)>a.range)move(t);else{const x=hit(a,t,1.28);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText="역할 분석 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="영역 지배"){
    a.guard=2;live(n,"enemy").filter(x=>x.id!==a.id).forEach(x=>x.tendencies.bravery=Math.min(100,x.tendencies.bravery+8));
    a.actionText="영역 지배 · 보스 오라";line=a.actionText;
  } else if(d.action==="광폭화"){
    a.attack=Math.round(a.attack*1.16);a.tendencies.survival=Math.max(0,a.tendencies.survival-10);a.tendencies.aggression=Math.min(100,a.tendencies.aggression+10);
    a.actionText="광폭화 · 공격 상승";line=a.actionText;
  } else if(d.action==="연계 공격"){
    const t=by(d.target)||weak||nearest;
    if(t){const x=hit(a,t,1.12);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText="연계 공격 → "+t.name+" (-"+x+")";line=a.actionText;}
  } else if(d.action==="일반 공격"){
    const t=by(d.target)||enemies[0]; if(t){if(dist(a,t)>a.range) move(t),a.actionText="접근 → "+t.name; else {const x=hit(a,t);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText="일반 공격 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="추격"){
    const t=by(d.target)||enemies[0]; if(t){if(dist(a,t)>a.range)move(t),a.actionText="추격 → "+t.name;else{const x=hit(a,t,1.18);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText="추격 공격 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="아군 보호"){
    const t=by(d.target)||allies[0]; if(t){a.pos += t.pos > a.pos ? .5 : -.5;a.guard=2;t.guard=Math.max(t.guard,1);a.actionText="아군 보호 → "+t.name;line=a.actionText;}
  } else if(d.action==="회복"){
    const t=by(d.target)||allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){const x=Math.round(t.maxHp*((.18+a.tendencies.cooperation*.001)*(1+(a.item?.combatMods?.healPct||0)/100)));t.hp=Math.min(t.maxHp,t.hp+x);a.actionText="회복 → "+t.name+" (+"+x+")";line=a.actionText;}
  } else if(d.action==="광역 마법"){
    const ts=enemies.filter(x=>dist(a,x)<=5).slice(0,3); if(ts.length){const bits=ts.map(t=>{const x=hit(a,t,.72);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;return t.name+" -"+x});a.actionText="광역 마법 → "+bits.join(", ");line=a.actionText;} else if(enemies[0])move(enemies[0]),a.actionText="광역 사거리 확보";
  } else if(d.action==="기습 후퇴"||d.action==="후퇴"){a.pos=Math.max(.3,a.pos-.95);a.actionText=d.action+" · 생존 우선";line=a.actionText;
  } else if(d.action==="보스 패턴"){
    const phase=pct(a)>0.65?1:pct(a)>0.35?2:3;
    const minions=live(n,"enemy").filter(x=>x.id!==a.id);
    const boost=phase===1?1.05:phase===2?1.16:1.3;
    minions.forEach(x=>{x.attack=Math.round(x.attack*boost);if(phase>=2)x.speed+=1;});
    const bossSpecies=a.species;
    if(bossSpecies==="Arachne"){
      enemies.filter(x=>dist(a,x)<5).slice(0,3).forEach(x=>x.speed=Math.max(.35,x.speed-(phase===3?.35:.18)));
      a.actionText="보스 패턴 · 거미줄 지대 · PHASE "+phase;
      line=a.actionText;
    }else if(bossSpecies==="Demon"){
      const target=enemies.slice().sort((x,y)=>(x.job==="Cleric"?-1:1)-(y.job==="Cleric"?-1:1)||pct(x)-pct(y))[0];
      if(target){const x=hit(a,target,phase===3?1.25:1);target.hp=Math.max(0,target.hp-x);target.alive=target.hp>0;}
      enemies.forEach(x=>x.tendencies.caution=Math.max(0,x.tendencies.caution-(phase===3?8:4)));
      a.actionText="보스 패턴 · 지배의 파동 · PHASE "+phase;
      line=a.actionText;
    }else{
      a.guard=phase===3?1:0;
      a.actionText="보스 패턴 · 전쟁 지휘 · PHASE "+phase;
      line=a.actionText+" · 부하 강화";
    }
  } else {a.guard=1;a.actionText="대기 · 다음 판단 준비";line=a.actionText;}
  if(["광폭 돌격","수호 맹세","결투 집중","정밀 사격","사냥 본능","심판","철벽 진형","원소 폭발","저주 확산","비전 해방","대회복","분열","함정 투척","매복 함정","거미줄","무리 사냥","약점 추적","연계 공격","전투 함성","지휘 명령","측면 습격","급강하","굴 파기 기습","독성 압박","매혹","대지 강타","회피 기동","역할 분석","영역 지배","광폭화"].includes(d.action))a.cooldown=2;
  n.forEach(x=>{if(!x.alive)x.hp=0;if(x.guard>0&&x.id!==a.id)x.guard-=.2;if(x.id!==a.id&&x.cooldown>0)x.cooldown=Math.max(0,x.cooldown-.25);});
  return {units:n,decision:d,line:line||a.actionText};
}

function route(stage:number,floor:number,curiosity=0){
  if(floor>=6 && stage>=4)return [{kind:"evilCave" as RoomKind,title:"악의 동굴",summary:"마계와 이어진 세계의 구멍. 강력한 수문장을 쓰러뜨리고 봉인해야 한다."}];
  if(stage>=5)return [{kind:"boss" as RoomKind,title:"심층 관문",summary:"던전 최심부의 지휘관이 길을 막고 있다."}];
  const rows=[
    [{kind:"battle" as RoomKind,title:"정찰 통로",summary:"좁은 통로에서 정찰 무리가 다가온다."},{kind:"treasure" as RoomKind,title:"낡은 보급창",summary:"장비 상자와 자원이 남아 있다."},{kind:"event" as RoomKind,title:"붕괴 직전의 갈림길",summary:"탐욕과 신중함에 따라 다른 결과가 열린다."}],
    [{kind:"battle" as RoomKind,title:"수정 동굴",summary:"슬라임과 코볼트가 길을 막는다."},{kind:"elite" as RoomKind,title:"거미 둥지",summary:"정예 아라크네가 통로를 봉쇄했다."},{kind:"event" as RoomKind,title:"봉인된 제단",summary:"호기심이 강한 파티일수록 더 많은 것을 발견한다."}],
    [{kind:"rest" as RoomKind,title:"폐허 야영지",summary:"남은 모닥불로 상처를 추스를 수 있다."},{kind:"elite" as RoomKind,title:"전쟁 통로",summary:"규율 잡힌 우르크 부대가 기다린다."},{kind:"event" as RoomKind,title:"불안정한 지맥",summary:"생존본능과 용맹에 따라 위험을 감수할 수 있다."}]
  ];
  const base=rows[stage%3].map((x,i)=>({...x,title:x.title+" · "+floor+"F"}));
  if(curiosity>=72 && (floor+stage)%4===0){
    base.push({kind:"hidden" as RoomKind,title:"숨은 통로 · "+floor+"F",summary:"높은 호기심을 가진 파티만 존재를 알아차릴 수 있는 비밀 방."});
  }
  return base;
}

export default function App(){
  const [save,setSave]=useState<Save>(load);
  const [screen,setScreen]=useState<Screen>("home");
  const [mode,setMode]=useState<BattleMode>("dungeon");
  const [selectedHero,setSelectedHero]=useState(save.party[0]||save.heroes[0].id);
  const [battle,setBattle]=useState<{units:BattleUnit[];log:string[];room:RoomKind;round:number;tick:number;ended:boolean;result?:string;next?:string;mode:BattleMode;wave:number;deadline?:number;objectiveHp:number;phase:number;objectiveKind?:DefenseObjective;environment?:EnvironmentKind;repeatScenarioFloor?:number;repeatCount?:number;rewardMultiplier?:number;elitePack?:boolean}>({units:[],log:[],room:"battle",round:0,tick:0,ended:false,mode:"dungeon",wave:1,objectiveHp:100,phase:1});
  const [paused,setPaused]=useState(false);
  const [speed,setSpeed]=useState(1);
  const [decision,setDecision]=useState("상황 감지 → 행동 후보 생성 → 성향/장비 보정 → 확률 선택");
  const [toast,setToast]=useState("");
  const party=useMemo(()=>save.heroes.filter(h=>save.party.includes(h.id)),[save.heroes,save.party]);
  const partyPref=useMemo(()=>partyPreference(party),[party]);
  const hero=save.heroes.find(h=>h.id===selectedHero)||save.heroes[0];
  const active=battle.units.find(u=>u.id===battle.next&&u.alive);
  const notify=(s:string)=>{setToast(s);window.setTimeout(()=>setToast(""),1800);};

  useEffect(()=>localStorage.setItem(KEY,JSON.stringify(save)),[save]);

  const start=(kind:RoomKind)=>{
    if(kind==="hidden"){
      const env=environmentFor(save.floor,kind,"dungeon");
      const outcome=resolveHiddenRoom(save.heroes,save.party,save.floor,env);
      setSave(s=>({...s,
        heroes:s.heroes.map(h=>{
          const update=outcome.heroUpdates[h.id];
          if(!update)return h;
          const nextT={...h.tendencies,...(update.tendencies||{})};
          return {...h,hp:Math.min(h.hp,Math.max(1,h.hp+(update.hpDelta||0))),tendencies:nextT};
        }),
        gold:s.gold+outcome.gold,materials:s.materials+outcome.materials,
        items:outcome.item?[...s.items,outcome.item]:s.items,stage:s.stage+1
      }));
      notify(outcome.text);
      return;
    }
    if(kind==="event"){
      const env=environmentFor(save.floor,kind,"dungeon");
      const outcome=resolveDungeonEvent(save.heroes,save.party,save.floor,env);
      setSave(s=>({...s,
        heroes:s.heroes.map(h=>{
          const update=outcome.heroUpdates[h.id];
          if(!update)return h;
          const nextT={...h.tendencies,...Object.fromEntries(Object.entries(update.tendencies||{}).map(([k,v])=>[k,clamp(v as number)]))};
          return {...h,hp:Math.max(1,h.hp+(update.hpDelta||0)),tendencies:nextT};
        }),
        gold:s.gold+outcome.gold,materials:s.materials+outcome.materials,
        items:outcome.item?[...s.items,outcome.item]:s.items,stage:s.stage+1
      }));
      notify(outcome.text);
      return;
    }
    if(kind==="treasure"){
      const uniqueDrop=Math.random()<.12 ? uniqueItems[Math.floor(Math.random()*uniqueItems.length)] : undefined;
      const item=uniqueDrop||randomGeneralItem(save.floor+2,partyPref);
      setSave(s=>({...s,items:[...s.items,item],gold:s.gold+180,stage:s.stage+1}));
      notify("보물: "+item.name+(uniqueDrop?" · 고유 장비 발견":"")+" 획득");
      return;
    }
    if(kind==="rest"){
      setSave(s=>({...s,heroes:s.heroes.map(h=>save.party.includes(h.id)?{...grantExperience(h,4).hero,hp:Math.round(h.hp*1.15)}:h),stage:s.stage+1}));
      notify("휴식: 경험 기록 +4 · HP 15% 회복");
      return;
    }
    const env=environmentFor(save.floor,kind,"dungeon");
    const units=spawn(save.heroes,save.party,kind,save.floor);
    setMode("dungeon");
    setBattle({units,log:[roomKo[kind]+" · "+environmentInfo[env].name+" · 전투 명령은 AI가 전부 결정합니다."],room:kind,round:1,tick:0,ended:false,next:units[0].id,mode:"dungeon",wave:1,objectiveHp:100,phase:1,environment:env});
    setPaused(false);setScreen("battle");setDecision("AI가 첫 행동을 분석 중...");
  };

  const startRepeat=(scenarioFloor:number)=>{
    if(save.worldSealed){notify("세계의 구멍이 이미 봉인되었습니다.");return;}
    const repeatCount=(save.scenarioClears[String(scenarioFloor)]||1);
    const elitePack=Math.random()<.25;
    const room:RoomKind=elitePack?"elite":"battle";
    const env=environmentFor(scenarioFloor,room,"dungeon");
    const units=spawn(save.heroes,save.party,room,scenarioFloor);
    const rewardMultiplier=Math.max(.3,.6-.1*Math.max(0,repeatCount-1));
    setBattle({units,log:[scenarioFloor+"F 완료 시나리오 재도전 · 반복 "+repeatCount+"회 · "+(elitePack?"정예 무리 출현":"일반 적 편성")+" · 보상 "+Math.round(rewardMultiplier*100)+"%"],room,round:1,tick:0,ended:false,next:units[0].id,mode:"dungeon",wave:1,objectiveHp:100,phase:1,environment:env,repeatScenarioFloor:scenarioFloor,repeatCount,rewardMultiplier,elitePack});
    setPaused(false);setScreen("battle");setDecision(elitePack?"재도전 중 정예 무리의 전투 성향을 분석 중...":"완료 시나리오의 적 행동을 다시 분석 중...");
  };

  const startMode=(nextMode:BattleMode)=>{
    setMode(nextMode);
    const room:RoomKind=nextMode==="raid"?"boss":"battle";
    const env=environmentFor(save.floor,room,nextMode);
    const units=spawn(save.heroes,save.party,room,save.floor);
    const objectiveKind=defenseObjectiveForFloor(save.floor);
    const label=nextMode==="defense"
      ? `방어전 시작 · ${defenseObjectiveKo[objectiveKind]} · 30초 동안 웨이브가 계속됩니다.`
      : `보스 레이드 시작 · ${raidBossForFloor(save.floor)} 보스 · 페이즈는 AI가 자동 전환됩니다.`;
    setBattle({units,log:[label+" · "+environmentInfo[env].name],room,round:1,tick:0,ended:false,next:units[0].id,mode:nextMode,wave:1,deadline:nextMode==="defense"?Date.now()+30000:undefined,objectiveHp:100,phase:1,objectiveKind,environment:env});
    setPaused(false);setScreen("battle");
    setDecision(nextMode==="defense"?"방어 목표와 생존 경로를 계산 중...":"보스 패턴과 페이즈 전환을 분석 중...");
  };

  useEffect(()=>{
    if(screen!=="battle"||paused||battle.ended)return;
    const timer=window.setTimeout(()=>{
      setBattle(prev=>{
        if(prev.ended||!prev.units.length)return prev;
        const alive=prev.units.filter(x=>x.alive);
        if(!alive.length)return {...prev,ended:true,result:"defeat"};
        const actor=alive.sort((a,b)=>a.pos-b.pos||b.speed-a.speed)[Math.floor(Math.random()*Math.min(2,alive.length))];
        const out=doAI(prev.units,actor.id,prev.environment);
        let wave=prev.wave,objectiveHp=prev.objectiveHp,phase=prev.phase,ended=false,result:string|undefined;
        const now=Date.now();
        const environmentLog=prev.environment?environmentTick(out.units,prev.environment,prev.tick,phase):undefined;
        let p=live(out.units,"player"),e=live(out.units,"enemy");

        if(prev.mode==="defense"){
          e.forEach(x=>{if(x.pos>0.45)x.pos=Math.max(0.45,x.pos-(0.075+wave*.006));});
          const nearGoal=e.filter(x=>x.pos<0.8).length;
          const bossNear=e.filter(x=>x.grade==="Boss"&&x.pos<1.4).length;
          const pressure=prev.objectiveKind==="gate"?nearGoal*3+bossNear*5:prev.objectiveKind==="relic"?nearGoal*2+bossNear*6:nearGoal*4;
          if(prev.tick%4===0 && pressure>0) objectiveHp=Math.max(0,objectiveHp-pressure);
          if(prev.objectiveKind==="escort"&&prev.tick%5===0&&p.some(x=>x.job==="Guardian")) objectiveHp=Math.min(100,objectiveHp+2);
          if(p.length===0||objectiveHp<=0){ended=true;result="defeat";}
          else if(now>=(prev.deadline||now)){ended=true;result="victory";}
          else if(e.length===0){
            wave+=1;
            const pool=["Goblin","Kobold","Gnoll","Orc","Uruk","Arachne","Ogre"];
            const count=Math.min(7,2+wave);
            const nextEnemies=Array.from({length:count},(_,i)=>{
              const m=createMonster(pool[(i+wave+save.floor)%pool.length],Math.max(1,save.floor+wave-1),wave>=4?"Elite":"Normal",i);
              return asEnemy({...m,pos:8.2+i*.55},"-w"+wave);
            });
            out.units=out.units.concat(nextEnemies);
          }
        }else if(prev.mode==="raid"){
          const boss=out.units.find(x=>x.grade==="Boss"&&x.alive);
          if(boss) phase=pct(boss)>0.65?1:pct(boss)>0.35?2:3;
          ended=p.length===0||e.length===0;
          result=e.length===0?"victory":p.length===0?"defeat":undefined;
        }else{
          ended=p.length===0||e.length===0;
          result=e.length===0?"victory":p.length===0?"defeat":undefined;
        }

        if(out.decision) setDecision(out.decision.detail+" · 후보점수 "+Math.round(out.decision.score));
        const logLine=out.line+(out.decision.detail?" / "+out.decision.detail:"");
        const waveLine=prev.mode==="defense"&&wave>prev.wave?" / WAVE "+wave+" 증원":"";
        return {...prev,units:out.units,log:[(environmentLog?environmentLog+" / ":"")+logLine+waveLine].concat(prev.log).slice(0,12),round:prev.round+(actor.team==="enemy"?1:0),tick:prev.tick+1,ended,result,next:out.units.find(x=>x.id===actor.id&&x.alive)?.id,wave,objectiveHp,phase};
      });
    },Math.max(150,850/speed));
    return ()=>window.clearTimeout(timer);
  },[screen,paused,battle.ended,speed,battle.tick,battle.mode,save.floor]);

  useEffect(()=>{
    if(screen!=="battle"||!battle.ended)return;
    const victory=battle.result==="victory";
    const deadIds=battle.units.filter(u=>u.team==="player"&&!u.alive).map(u=>u.id);
    const isRepeat=battle.repeatScenarioFloor!==undefined;
    const isElite=battle.room==="elite"||!!battle.elitePack;
    const isBoss=battle.room==="boss";
    const isFinal=battle.room==="evilCave";
    const baseStats={wins:0,losses:0,eliteWins:0,bossWins:0,repeatWins:0,finalWins:0};
    const buildHero=(h:Hero,unit:BattleUnit|undefined,won:boolean,stats:any)=>{
      if(!unit)return h;
      const base={...h,campaignStats:stats};
      const behaviorBase=applyBehaviorHistory(base,unit.behaviorCounts||{});
      const behavioral={...behaviorBase,
        ...(isFinal&&won?{statusNote:"악의 동굴 수문장 격파 · 봉인 대기"}:{}),
        history:unit.actionText?[unit.actionText,...behaviorBase.history].slice(0,6):behaviorBase.history};
      const awarded=awardChronicle(behavioral);
      return {...awarded,mood:systemMood(awarded),statusNote:systemStatus(awarded),evaluation:systemEvaluation(awarded)};
    };
    setSave(s=>{
      const bonded=bondAfterBattle(s.heroes,s.party,deadIds).map(decayMemories);
      const statsById:Record<string,any>={};
      s.heroes.forEach(h=>statsById[h.id]={...baseStats,...(h.campaignStats||{})});
      s.party.forEach(id=>{
        const h=s.heroes.find(x=>x.id===id);
        const unit=battle.units.find(u=>u.id===id);
        if(h){
          const st=statsById[id];
          if(victory){st.wins+=1;if(isElite)st.eliteWins+=1;if(isBoss)st.bossWins+=1;if(isRepeat)st.repeatWins+=1;if(isFinal)st.finalWins+=1;}
          else st.losses+=1;
        }
      });
      const scenarioClears={...s.scenarioClears};
      if(victory&&battle.room==="boss")scenarioClears[String(s.floor)]=(scenarioClears[String(s.floor)]||0)+1;
      if(victory&&isRepeat)scenarioClears[String(battle.repeatScenarioFloor)]=(scenarioClears[String(battle.repeatScenarioFloor)]||1)+1;
      const rewardMultiplier=isRepeat?(battle.rewardMultiplier||.6):1;
      const baseGold=180+battle.units.filter(u=>u.team==="enemy").length*55+(isBoss?900:0)+(isFinal?1800:0);
      const baseMaterials=isFinal?100:isBoss?60:18;
      const exp=Math.max(8,Math.round((22+(isElite?15:0)+(isBoss?70:0)+(isFinal?110:0))*(isRepeat?.85:1)));
      return {...s,
        gold:s.gold+(victory?Math.round(baseGold*rewardMultiplier):0),
        materials:s.materials+(victory?Math.max(5,Math.round(baseMaterials*rewardMultiplier)):0),
        scenarioClears,
        floor:victory&&isBoss?s.floor+1:s.floor,
        stage:victory?(isBoss?0:(isFinal?s.stage:s.stage+1)):s.stage,
        heroes:s.heroes.map(h=>{
          if(!s.party.includes(h.id))return h;
          return buildHero(bonded.find(x=>x.id===h.id)||h,battle.units.find(u=>u.id===h.id),victory,statsById[h.id]);
        })
      };
    });
  },[battle.ended,battle.result]);

  const toggleParty=(id:string)=>{
    if(save.party.includes(id)){if(save.party.length===1)return;setSave(s=>({...s,party:s.party.filter(x=>x!==id)}));}
    else if(save.party.length<4)setSave(s=>({...s,party:s.party.concat(id)}));
    else notify("데모 파티 최대 4명");
  };
  const equip=(item:Item)=>{
    setSave(s=>({...s,heroes:s.heroes.map(h=>h.id===selectedHero?{...h,item}:h)}));
    notify(hero.name+" · "+item.name+" 장착");
  };
  const randomEquip=()=>{
    if(save.materials<12){notify("재료가 부족합니다.");return;}
    const item=randomGeneralItem(hero.level,hero.tendencies); setSave(s=>({...s,materials:s.materials-12,heroes:s.heroes.map(h=>h.id===selectedHero?{...h,item}:h)}));notify("장기 성향에 맞춰 장비 옵션을 새로 굴렸습니다.");
  };
  const recruit=(job:Job)=>{
    if(save.gold<350){notify("모집 자금이 부족합니다.");return;}
    const newHero=createRecruitHero(job);
    setSave(s=>({...s,gold:s.gold-350,heroes:[...s.heroes,newHero]}));
    setSelectedHero(newHero.id);
    notify(newHero.name+" · "+jobKo[job]+" 신규 용사 모집");
  };
  const equipCostume=(costumeId:string)=>{
    setSave(s=>({...s,heroes:s.heroes.map(h=>h.id===selectedHero?{...h,costumeId}:h)}));
    notify(hero.name+" · "+costumeLabel(hero.job,costumeId)+" 착용");
  };
  const sealWorld=()=>{
    setSave(s=>({...s,worldSealed:true,heroes:s.heroes.map(h=>{
      const next={...h,statusNote:"세계의 구멍 봉인 완료"};
      const awarded=awardChronicle(next);
      return {...awarded,mood:systemMood(awarded),statusNote:systemStatus(awarded),evaluation:systemEvaluation(awarded)};
    })}));
    setScreen("home");
    notify("세계의 구멍을 봉인했습니다. 악의 침입이 차단되었습니다.");
  };
  const reset=()=>{localStorage.removeItem(KEY);setSave(load());setScreen("home");notify("데모 초기화 완료");};

  return <main className="game-shell">
    <header className="topbar"><div className="brand" onClick={()=>setScreen("home")}><div className="brand-mark"><Brain size={21}/></div><div><b>무한 던전 : AI Chronicle</b><small>자율 AI 던전 RPG / RTS 프로토타입</small></div></div>
      <div className="resources"><span><Coins size={15}/> {save.gold}</span><span><Gem size={15}/> {save.gems}</span><span>🧱 {save.materials}</span><span>심도 {save.floor}F</span></div></header>
    <nav className="main-nav">{([["home","대시보드"],["party","캐릭터"],["dungeon","던전"],["inventory","장비"],["recruit","모집"]] as [Screen,string][]).map(x=><button key={x[0]} className={screen===x[0]?"nav-on":""} onClick={()=>setScreen(x[0])}>{x[1]}</button>)}</nav>
    {toast&&<div className="toast">{toast}</div>}

    {screen==="home"&&<section className="page"><div className="hero-panel"><div><span className="eyebrow">AUTONOMOUS DUNGEON</span>
      <h1>플레이어가 캐릭터를 조종하는 것이 아니라,<br/>캐릭터가 살아온 방식이 미래를 결정한다.</h1>
      <p>플레이어는 <b>파티와 장비, 다음 경로</b>를 결정한다. 전투에서는 직접 이동하거나 공격 대상을 지정하지 않는다.</p>
      <div className="hero-actions"><button className="primary-btn" onClick={()=>setScreen("dungeon")}><Map size={18}/> 던전 데모 시작 <ChevronRight size={17}/></button><button className="ghost-btn" onClick={()=>setScreen("party")}><UserRound size={17}/> 파티 준비</button></div>
    </div><div className="hero-orb"><Swords size={108}/></div></div>
    <div className="feature-grid"><Feature icon={<Brain/>} title="자율 AI 전투" text="상황 + 성향 10종 + 직업 + 장비 + 경험으로 행동을 결정합니다."/><Feature icon={<Package/>} title="AI 빌드" text="장비의 수치뿐 아니라 추격·후퇴·보호 우선순위도 바뀝니다."/><Feature icon={<Map/>} title="경로 선택" text="직접 이동 명령 대신 다음 방의 위험과 보상을 선택합니다."/><Feature icon={<Sparkles/>} title="행동 기록" text="반복된 행동이 성향에 조금씩 누적되어 캐릭터의 미래가 달라집니다."/></div>
    <div className="mode-grid">
      <ModeCard title="DUNGEON" subtitle="던전" text="방을 선택하고 탐색·전투·보상·보스까지 진행합니다." icon="⚔" onClick={()=>{setMode("dungeon");setScreen("dungeon")}} />
      <ModeCard title="DEFENSE" subtitle="방어전" text="30초 동안 웨이브가 계속됩니다. 목표와 파티 생존을 AI가 지킵니다." icon="🛡" onClick={()=>startMode("defense")} />
      <ModeCard title="BOSS RAID" subtitle="보스 레이드" text="보스의 체력에 따라 3페이즈 패턴이 자동 전환됩니다." icon="♛" onClick={()=>startMode("raid")} />
    </div>
    <div className="evolution-section">
      <div className="section-mini-head"><div><span className="eyebrow">MONSTER EVOLUTION</span><h3>14종 종족의 진화 계통</h3><p>번식으로 개체 수를 늘리지 않고, 장기적으로 기록되는 종족·개체 계보만 행동 편향에 따라 진화합니다. 보스는 매번 별도의 전투 경험 없이 새 개체로 등장합니다.</p></div></div>
      <div className="evolution-grid">{Object.entries(monsterEvolutionTrees).map(([species,branches])=>{
        const lineage=save.monsterLineages.find(x=>x.species===species);
        const activeLine=lineage?evolutionHint(lineage):"아직 계보 기억 없음";
        return <article className="evolution-card" key={species}><b>{species}</b><small>{activeLine}</small><div>{branches.slice(0,3).map((b,i)=><span key={i}>{b.forms.join(" → ")}</span>)}</div></article>;
      })}</div>
    </div>
    <div className="demo-note"><div><b>이번 데모</b><span>던전 / 자동 실시간 전투 / AI 빌드 / 장비 / 성장 기록</span></div><div><b>제외</b><span>멸종 / 번식 / 직접 공격 명령 / 직접 이동 명령 / 수동 스킬 대상 지정</span></div></div></section>}

    {screen==="party"&&<section className="page"><div className="section-head"><div><span className="eyebrow">CHARACTERS</span><h2>원정대 구성</h2><p className="muted">전투 전에만 편성과 장비를 변경할 수 있습니다.</p></div><span className="counter">{save.party.length}/4</span></div>
      <div className="party-grid">{save.heroes.map(h=><HeroCard key={h.id} hero={h} active={save.party.includes(h.id)} onClick={()=>{setSelectedHero(h.id);toggleParty(h.id)}}/>)}</div>
      <div className="subpanel"><div><b>현재 편성</b><span>{party.map(h=>jobIcon[h.job]+" "+h.name).join(" · ")}</span></div><div className="social-summary"><span>관계는 전투를 함께할수록 강화되고, 동료를 잃으면 기억이 남습니다.</span></div><button className="primary-btn compact" onClick={()=>setScreen("dungeon")}><Swords size={16}/> 던전으로</button></div>
      <div className="status-panel"><div className="status-main"><span className="eyebrow">HERO STATUS</span><h3>{hero.name} · {chronicleLabel(hero)}</h3><p><b>기분</b> · {systemMood(hero)}</p><p><b>상태</b> · {systemStatus(hero)}</p><p><b>시스템 평가</b> · {systemEvaluation(hero)}</p><small>연대기 가산 · 공격 +{chronicleBonus.attack||0} · 방어 +{chronicleBonus.defense||0} · HP +{chronicleBonus.hpPct||0}% · 속도 +{chronicleBonus.speedPct||0}%</small></div><div className="chronicle-list"><b>영웅 연대기</b>{(hero.chronicle||[]).slice().reverse().map((e,i)=><em key={i}><strong>{e.kind==="title"?"칭호":"업적"}</strong> · {e.name} — {e.description}</em>)}</div></div><div className="memory-panel"><div><b>{hero.name}의 최근 기억</b><span>최근 전투에서 강하게 남은 경험이 다음 판단에 영향을 줍니다.</span></div><div className="memory-list">{(hero.memories||[]).slice(0,4).map((m,i)=><em key={i}>{m.text} · 영향 {Math.round(m.weight*10)/10}</em>)}</div></div><div className="costume-panel"><div><b>직업별 코스튬</b><span>{costumeLabel(hero.job,hero.costumeId)}</span></div><div className="costume-grid">{costumesForJob(hero.job).map(c=><button key={c.id} className={"costume-card "+c.tier+(hero.costumeId===c.id?" equipped":"")} onClick={()=>equipCostume(c.id)}><small>{c.tier}</small><b>{c.name.split(" · ")[1]}</b><span>{c.description}</span></button>)}</div></div></section>}

    {screen==="recruit"&&<section className="page"><div className="section-head"><div><span className="eyebrow">RECRUITMENT</span><h2>용사 모집란</h2><p className="muted">기초직업 5종의 신규 용사를 지속적으로 모집할 수 있습니다. 모집비 350 골드.</p></div><span className="counter">{save.heroes.length}명</span></div><div className="recruit-panel"><div><b>기초직업 모집</b><span>모집된 용사는 Lv.1에서 시작하며 기본 직업과 서로 다른 초기 성향을 가집니다.</span></div><div className="recruit-grid">{(Object.keys(jobKo) as Job[]).map(j=><article className="recruit-card" key={j}><div className="room-icon">{jobIcon[j]}</div><b>{jobKo[j]}</b><p>기초 직업 · 장기 성향이 성장하며 자동 전직합니다.</p><button className="primary-btn compact" disabled={save.gold<350} onClick={()=>recruit(j)}><UserPlus size={15}/> 모집 350G</button></article>)}</div></div><div className="subpanel"><div><b>모집 원칙</b><span>신규 용사의 미래는 실제 행동과 경험이 결정합니다.</span></div><button className="primary-btn compact" onClick={()=>setScreen("party")}><UserRound size={16}/> 캐릭터 보기</button></div></section>}

    {screen==="dungeon"&&<section className="page"><div className="section-head"><div><span className="eyebrow">DUNGEON</span><h2>{save.floor}F · 다음 방 선택</h2><p className="muted">경로만 선택할 수 있습니다. 전투가 시작되면 AI가 전부 결정합니다.</p></div><button className="ghost-btn" onClick={()=>setScreen("party")}><UserRound size={16}/> 파티 수정</button></div>
      <div className="progress-strip">{Array.from({length:6},(_,i)=><div key={i} className={"progress-node "+(i<save.stage?"done":i===save.stage?"current":"")}><span>{i<save.stage?"✓":i+1}</span><small>{i===5?"BOSS":"ROOM "+(i+1)}</small></div>)}</div>
      {Object.keys(save.scenarioClears).length>0&&<div className="repeat-panel"><div><b>완료 시나리오 재도전</b><span>성장을 위해 완료한 시나리오를 반복할 수 있습니다. 반복할수록 보상이 감소하고 25% 확률로 정예 몬스터 무리가 등장합니다.</span></div><div className="repeat-list">{Object.keys(save.scenarioClears).sort((a,b)=>Number(b)-Number(a)).map(k=>{const n=save.scenarioClears[k];const mult=Math.max(.3,.6-.1*Math.max(0,n-1));return <button key={k} className="repeat-card" onClick={()=>startRepeat(Number(k))}><b>{k}F 시나리오</b><span>클리어 {n}회 · 다음 보상 {Math.round(mult*100)}%</span><ChevronRight size={16}/></button>})}</div></div>}
      <div className="route-grid">{route(save.stage,save.floor,party.length?party.reduce((n,h)=>n+h.tendencies.curiosity,0)/party.length:0).map((r,i)=><button key={i} className={"route-card room-"+r.kind} onClick={()=>start(r.kind)}><div className="room-icon">{roomIcon[r.kind]}</div><div><small>{roomKo[r.kind]}</small><h3>{r.title}</h3><p>{r.summary}</p></div><ChevronRight size={20}/></button>)}</div>
      <div className="dungeon-meta"><div><b>현재 파티</b>{party.map(h=><span key={h.id}>{jobIcon[h.job]} {h.name}</span>)}</div><div><b>대서사의 목표</b><span>{save.worldSealed?"세계의 구멍 봉인 완료":"동굴을 돌파해 악의 동굴을 찾고 세계의 구멍을 봉인하세요."}</span></div></div></section>}

    {screen==="battle"&&<section className="page"><div className="battle-header"><div><span className="eyebrow">{roomKo[battle.room]}</span><h2>{battle.room==="evilCave"?"악의 동굴 · 세계의 구멍":battle.room==="boss"?"심층 관문":battle.repeatScenarioFloor!==undefined?"시나리오 재도전":"자동 전투 진행 중"}</h2><p className="muted">전투 명령 없음 · 일시정지와 재생 속도만 조절할 수 있습니다.</p></div>
      <div className="battle-tools"><button className="ghost-btn" onClick={()=>setPaused(x=>!x)}>{paused?<CirclePlay size={17}/>:<CirclePause size={17}/>} {paused?"재생":"일시정지"}</button>{[.5,1,2,4].map(x=><button key={x} className={speed===x?"speed-on":"speed-btn"} onClick={()=>setSpeed(x)}>{x}x</button>)}</div></div>
      <div className="battle-summary-strip">
        <span>MODE · {battle.repeatScenarioFloor!==undefined?"SCENARIO REPLAY":battle.mode==="defense"?"DEFENSE":battle.mode==="raid"?"BOSS RAID":"DUNGEON"}</span>{battle.repeatScenarioFloor!==undefined&&<><span>재도전 · {battle.repeatScenarioFloor}F</span><span>반복 {battle.repeatCount}회</span><span>보상 {Math.round((battle.rewardMultiplier||1)*100)}%</span>{battle.elitePack&&<span>정예 무리 출현</span>}
        {battle.mode==="defense"&&<><span>목표 · {defenseObjectiveKo[battle.objectiveKind||"gate"]}</span><span>WAVE {battle.wave}</span><span>목표 내구도 {battle.objectiveHp}%</span><span>남은 시간 {Math.max(0,Math.ceil(((battle.deadline||Date.now())-Date.now())/1000))}초</span></>}
        {battle.mode==="raid"&&<><span>보스 · {battle.units.find(u=>u.team==="enemy"&&u.grade==="Boss")?.name||"—"}</span><span>PHASE {battle.phase} · 종족별 패턴 AI</span></>}
        {battle.environment&&<span>환경 · {environmentInfo[battle.environment].name}</span>}
      </div>
      {battle.environment&&<div className="environment-note"><b>{environmentInfo[battle.environment].name}</b><span>{environmentInfo[battle.environment].detail}</span></div>}
      <div className="battle-layout"><div className="cave-panel"><div className="cave-label"><span>입구</span><span>심층</span></div><div className="cave-lane"><div className="cave-floor"/>
        {battle.units.map(u=><div key={u.id} className={"battle-unit "+u.team+" "+(u.alive?"":"dead")+" "+(active?.id===u.id?"active-unit":"")} style={{left:(u.pos*9.3)+"%"}}>
          <div className="unit-token">{u.team==="player"?jobIcon[u.job!]:u.grade==="Boss"?"♛":"👹"}</div><b>{u.name}</b>{u.mutation&&<small className="mutation-label">{u.mutation}</small>}<div className="hp-bar"><span style={{width:(100*pct(u))+"%"}}/></div><small>{Math.max(0,Math.round(u.hp))}/{u.maxHp}</small></div>)}
      </div><div className="battle-status">{battle.ended?<><Trophy size={17}/> {battle.result==="victory"?"승리 · 성장 기록 반영":"패배 · 원정 종료"}</>:<><Zap size={16}/> ROUND {battle.round} · {active?.name||"AI 계산"}</>}</div></div>
      <aside className="ai-panel"><div className="panel-title"><Brain size={18}/> AI 판단 실시간</div><div className="ai-focus"><small>현재 판단 주체</small><b>{active?.name||"—"}</b><span>{active?.job?jobKo[active.job]:active?.species||"—"}</span></div><div className="decision-box">{decision}</div><h4>전투 로그</h4><div className="combat-log">{battle.log.map((x,i)=><div key={i}>{x}</div>)}</div><div className="inspect-box"><small>선택 캐릭터</small><b>{hero.name}</b><span>{jobKo[hero.job]} · Lv.{hero.level} · {promotionLabel(hero)} · {hero.item.name}</span><small>기억 {hero.memories?.length||0} · 관계 {Object.keys(hero.relationships||{}).length}</small><small>{behaviorSummary(hero)}</small><div className="tag-row">{tags(hero).map(t=><em key={t}>{t}</em>)}</div></div></aside></div>
      {battle.ended&&<div className="result-panel"><div className={"result-icon "+(battle.result==="victory"?"win":"lose")}>{battle.result==="victory"?"✓":"×"}</div><div><small>{battle.result==="victory"?"원정대 생존":"전멸"}</small><h3>{battle.result==="victory"?"다음 방으로":"원정 종료"}</h3><p>{battle.result==="victory"?"전투에서 쌓인 행동 기록과 경험이 캐릭터에 반영됩니다.":"다시 던전에 들어가 같은 파티를 시험할 수 있습니다."}</p></div><button className="primary-btn" onClick={()=>{if(battle.result==="victory"&&battle.room==="evilCave"){sealWorld();return;}setScreen("dungeon");setBattle(b=>({...b,ended:false,result:undefined}));}}>{battle.result==="victory"&&battle.room==="evilCave"?"세계의 구멍 봉인":battle.result==="victory"?"경로 선택":"다시 시작"} <ChevronRight size={17}/></button></div>}</section>}

    {screen==="inventory"&&<section className="page"><div className="section-head"><div><span className="eyebrow">EQUIPMENT</span><h2>장비 연구실</h2><p className="muted">직업 제한 없음 · 일반 장비는 무작위 롤 · 고유 장비는 AI 행동까지 바꿉니다.</p></div></div>
      <div className="inventory-grid"><div className="subpanel equipment-hero"><div><small>현재 선택</small><b>{hero.name}</b><span>{jobKo[hero.job]} · {hero.item.name}</span><small>자동 빌드 · {buildProfile(hero).name}</small></div><button className="primary-btn compact" onClick={randomEquip} disabled={save.materials<12}><RotateCcw size={16}/> 무작위 재굴림 · 12</button></div>
      <div className="item-list"><ItemCard item={hero.item} equipped/><div className="unique-title"><Sparkles size={16}/> 대표 고유 장비</div>{uniqueItems.filter(x=>x.id!==hero.item.id).map(i=><ItemCard key={i.id} item={i} onEquip={()=>equip(i)}/>)}{save.items.map(i=><ItemCard key={i.id} item={i} onEquip={()=>{equip(i);setSave(s=>({...s,items:s.items.filter(x=>x.id!==i.id)}));}}/> )}</div></div></section>}

    <footer><span>Prototype · autonomous dungeon AI</span><button onClick={reset}><RotateCcw size={14}/> 초기화</button></footer>
  </main>;
}

function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <article className="feature-card"><div className="feature-icon">{icon}</div><b>{title}</b><p>{text}</p></article>;}
function HeroCard({hero,active,onClick}:{hero:Hero;active:boolean;onClick:()=>void}){
  const bond=strongestBond(hero);
  const bondName=heroesSeed.find(h=>h.id===bond?.id)?.name||"동료";
  return <article className={"hero-card "+(active?"hero-selected":"")} onClick={onClick}>
    <div className="hero-avatar" style={{background:hero.color}}>{jobIcon[hero.job]}</div>
    <div className="hero-card-main">
      <div className="name-row"><b>{hero.name}</b><span>Lv.{hero.level}</span></div>
      <p>{jobKo[hero.job]} · {promotionLabel(hero)} · 경험 {hero.experience}/100</p>
      <div className="tag-row">{tags(hero).map(t=><em key={t}>{t}</em>)}</div>
      <small>장비 · {hero.item.name}{hero.item.unique?" · UNIQUE":""}</small><small>코스튬 · {costumeLabel(hero.job,hero.costumeId)}</small>
      <small>{behaviorSummary(hero)}</small><small>AI 빌드 · {buildProfile(hero).name} · {buildProfile(hero).detail}</small>
      <div className="social-meta">
        {bond&&<span>유대 · {bondName} {Math.round(bond.relation.bond)}</span>}
        <span>기억 {hero.memories?.length||0}</span>
      </div>
    </div>
    <ChevronRight size={17}/>
  </article>;
}
function tags(h:Hero){const ks=(Object.keys(tendencyKo) as (keyof Tendencies)[]).sort((a,b)=>(h.tendencies[b]+(h.item.aiMods[b]||0))-(h.tendencies[a]+(h.item.aiMods[a]||0)));return ks.slice(0,3).map(k=>tendencyKo[k]+" "+((h.tendencies[k]+(h.item.aiMods[k]||0))>=80?"높음":(h.tendencies[k]+(h.item.aiMods[k]||0))>=60?"중상":"보통"));}
function ItemCard({item,equipped,onEquip}:{item:Item;equipped?:boolean;onEquip?:()=>void}){return <article className={"item-card "+(item.unique?"unique-item":"")}><div className="item-top"><span>{item.rarity}</span>{item.unique&&<b>UNIQUE</b>}</div><h3>{item.name}</h3><small>{item.slot} · Lv.{item.level}</small><div className="stat-list">{item.stats.map(s=><span key={s}>{s}</span>)}</div><div className="ai-mod"><Brain size={14}/>{Object.entries(item.aiMods).map(([k,v])=><span key={k}>{tendencyKo[k as keyof Tendencies]} {(v||0)>0?"+":""}{v}</span>)}</div><p>{item.description}</p>{onEquip&&<button className="ghost-btn" onClick={onEquip}>{equipped?"장착 중":"장착"}</button>}</article>;}


function ModeCard({title,subtitle,text,icon,onClick}:{title:string;subtitle:string;text:string;icon:string;onClick:()=>void}){
  return <button className="mode-card" onClick={onClick}><div className="mode-glyph">{icon}</div><div><small>{title}</small><b>{subtitle}</b><span>{text}</span></div><ChevronRight size={18}/></button>;
}
