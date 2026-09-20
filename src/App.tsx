
import { useEffect, useMemo, useState } from "react";
import { Brain, ChevronRight, CirclePause, CirclePlay, Coins, Gem, Heart, Map as MapIcon, Package, RotateCcw, Shield, Sparkles, Swords, Trophy, UserPlus, UserRound, Zap } from "lucide-react";
import { cloneTendencies, createMonster, defaultTendencies, heroesSeed, randomGeneralItem, createRecruitHero, rollBattleLoot, type BattleUnit, type Hero, type Item, type Job, type RoomKind, type Tendencies, uniqueItems } from "./dungeonData";
import { grantExperience, promotionActions, promotionForecast, promotionLabel } from "./promotion";
import { bondAfterBattle, decayMemories, relationshipFromMap, strongestBond } from "./relationships";
import { applyLineage, emptyLineage, evolutionActionBonus, evolutionHint, monsterEvolutionTrees, recordLineage } from "./monsterEvolution";
import type { MonsterLineage } from "./dungeonData";
import { monsterActions } from "./monsterAbilities";
import { dungeonChoiceEvent, resolveDungeonChoice, resolveDungeonEvent, resolveHiddenRoom, eventTraitEffects, eventArtifactEffects, eventRewardPreview, type DungeonChoiceEvent } from "./dungeonEvents";
import { applyBehaviorHistory, behaviorSummary, buildProfile, habitBias, partyHabitBias, partyMemorySummary, partyPreference, partyTacticalLinks, profileInsight, type PartyMemory } from "./progression";
import { awardChronicle, chronicleBonuses, chronicleLabel, systemEvaluation, systemMood, systemStatus } from "./chronicle";
import { costumeLabel, costumesForJob } from "./costumes";
import { environmentDecisionBonus, environmentFor, environmentInfo, environmentTick, type EnvironmentKind } from "./dungeonEnvironment";
import { bossClearReward, eliteClearReward, hiddenRoomReward, milestoneReward, repeatClearReward, treasureArtifactReward, growthArtifactCatalog, growthTraitCatalog, type GrowthReward } from "./growthRewards";

type Screen = "home" | "party" | "dungeon" | "battle" | "inventory" | "recruit";
type BattleMode = "dungeon" | "defense" | "raid";
type DefenseObjective = "gate" | "relic" | "escort";
type RouteMemoryEntry = { attempts:number; clears:number; failures:number; rewardSamples:number; rewardGold:number };
type RouteMemory = Partial<Record<RoomKind,RouteMemoryEntry>>;
type Save = { heroes: Hero[]; party: string[]; gold: number; materials: number; gems: number; floor: number; stage: number; items: Item[]; monsterLineages: MonsterLineage[]; scenarioClears:Record<string,number>; partyMemory?:PartyMemory; routeMemory?:RouteMemory; worldSealed?:boolean };
type Decision = { action: string; target?: string; detail: string; score: number };
type BattlePlan = { key:"aggressive"|"defensive"|"focused"|"balanced"; label:string; detail:string };
type BattleContext = { mode:BattleMode; objectiveKind?:DefenseObjective; objectiveHp:number; phase:number };

const KEY = "autonomous-dungeon-demo-v1";
const jobKo: Record<Job,string> = {Warrior:"전사",Guardian:"수호자",Archer:"궁수",Mage:"마법사",Cleric:"성직자"};
const jobIcon: Record<Job,string> = {Warrior:"⚔️",Guardian:"🛡️",Archer:"🏹",Mage:"🔮",Cleric:"✚"};
const roomIcon: Record<RoomKind,string> = {battle:"⚔",elite:"☠",treasure:"◆",rest:"🔥",event:"?",hidden:"◇",boss:"👑",evilCave:"🕳"};
const roomKo: Record<RoomKind,string> = {battle:"일반 전투",elite:"정예 전투",treasure:"보물방",rest:"휴식처",event:"던전 이벤트",hidden:"숨은 방",boss:"심층 보스",evilCave:"악의 동굴"};
const defenseObjectiveKo: Record<DefenseObjective,string> = {gate:"성문",relic:"성유물",escort:"호위 대상"};
const tendencyKo: Record<keyof Tendencies,string> = {aggression:"공격성",bravery:"용맹",caution:"신중함",survival:"생존본능",protect:"아군보호",pursuit:"추적성",focus:"집중력",greed:"탐욕",curiosity:"호기심",cooperation:"협동성"};
const defenseObjectiveForFloor=(floor:number):DefenseObjective=>floor%3===1?"gate":floor%3===2?"relic":"escort";
const defenseObjectiveDetail:Record<DefenseObjective,string>={
  gate:"성문 · Guardian이 근처를 지키면 받는 압박이 감소합니다.",
  relic:"성유물 · Mage가 보호하고 Cleric이 회복할 수 있습니다.",
  escort:"호위 대상 · Guardian 생존 시 내구도가 주기적으로 회복됩니다."
};
const raidBossForFloor=(floor:number)=>floor%3===1?"Uruk":floor%3===2?"Arachne":"Demon";

const lineageFor=(lineages:MonsterLineage[],species:string)=>lineages.find(x=>x.species===species);
const createLinedMonster=(species:string,level:number,grade:ReturnType<typeof createMonster>["grade"],index:number,lineages:MonsterLineage[])=>{
  const base=createMonster(species,level,grade,index);
  if(grade==="Boss") return base;
  return applyLineage(base,lineageFor(lineages,species));
};

const defaultPartyMemory:PartyMemory={battles:0,protection:0,recovery:0,losses:0};
const recordRouteMemory=(memory:RouteMemory|undefined,kind:RoomKind,success:boolean,gold:number):RouteMemory=>{
  const prev=memory?.[kind]||{attempts:0,clears:0,failures:0,rewardSamples:0,rewardGold:0};
  const sample=gold>0?1:0;
  return {...(memory||{}),[kind]:{
    attempts:prev.attempts+1,
    clears:prev.clears+(success?1:0),
    failures:prev.failures+(success?0:1),
    rewardSamples:prev.rewardSamples+sample,
    rewardGold:prev.rewardGold+(sample?gold:0)
  }};
};
function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Save;
      return {...s, partyMemory:s.partyMemory||defaultPartyMemory, routeMemory:s.routeMemory||{}, heroes:s.heroes.map(h=>({...h,tendencies:{...defaultTendencies[h.job],...h.tendencies},equipment:(h.equipment??(h.item?[h.item]:[])).slice(0,5) as [Item?,Item?,Item?,Item?,Item?]})), items:s.items||[], monsterLineages:(s.monsterLineages||[]).filter(x=>!x.id.endsWith("-boss")), scenarioClears:s.scenarioClears||{}, worldSealed:!!s.worldSealed};
    }
  } catch {}
  return {heroes:heroesSeed.map(({item,...h})=>({...h,tendencies:cloneTendencies(h.tendencies),equipment:[]})),party:heroesSeed.slice(0,4).map(h=>h.id),gold:2500,materials:100,gems:100,floor:1,stage:0,items:[],monsterLineages:[],scenarioClears:{},partyMemory:defaultPartyMemory,routeMemory:{},worldSealed:false};
}
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const pct=(u:{hp:number;maxHp:number})=>u.maxHp?u.hp/u.maxHp:0;
const dist=(a:BattleUnit,b:BattleUnit)=>Math.abs(a.pos-b.pos);
const live=(u:BattleUnit[],team:"player"|"enemy")=>u.filter(x=>x.team===team&&x.alive);
const equipmentSlotsOf=(hero:Hero|BattleUnit):[Item?,Item?,Item?,Item?,Item?]=>{
  const raw=hero.equipment ?? (hero.item?[hero.item]:[]);
  return [raw[0],raw[1],raw[2],raw[3],raw[4]];
};
const equippedItemsOf=(hero:Hero|BattleUnit)=>equipmentSlotsOf(hero).filter((x):x is Item=>!!x);
const combinedAiMods=(items:Item[])=>{
  const mods:Partial<Tendencies>={};
  for(const item of items) for(const [k,v] of Object.entries(item.aiMods)) mods[k as keyof Tendencies]=(mods[k as keyof Tendencies]||0)+(v||0);
  return mods;
};
const combinedCombatMods=(items:Item[])=>{
  const mods:Record<string,number>={};
  for(const item of items) for(const [k,v] of Object.entries(item.combatMods||{})) mods[k]=(mods[k]||0)+(v||0);
  return mods;
};
const aiT=(t:Tendencies,items:Item[]=[],artifacts:string[]=[]):Tendencies=>{
  const n={...t}; const mods=combinedAiMods(items);
  (Object.keys(mods) as (keyof Tendencies)[]).forEach(k=>n[k]=clamp(n[k]+(mods[k]||0)));
  artifacts.forEach(name=>{
    const effect=eventArtifactEffects[name]||growthArtifactCatalog[name];
    if(effect)Object.entries(effect.aiMods).forEach(([k,v])=>{n[k as keyof Tendencies]=clamp(n[k as keyof Tendencies]+(v||0));});
  });
  return n;
};
const eventArtifactAiMods=(artifacts:string[])=>{
  const mods:Partial<Tendencies>={};
  artifacts.forEach(name=>Object.entries((eventArtifactEffects[name]||growthArtifactCatalog[name])?.aiMods||{}).forEach(([k,v])=>mods[k as keyof Tendencies]=(mods[k as keyof Tendencies]||0)+(v||0)));
  return mods;
};
const combinedAiModsWithArtifacts=(items:Item[],artifacts:string[])=>{
  const gear=combinedAiMods(items), artifact=eventArtifactAiMods(artifacts);
  const mods:Partial<Tendencies>={...gear};
  (Object.keys(tendencyKo) as (keyof Tendencies)[]).forEach(k=>mods[k]=(gear[k]||0)+(artifact[k]||0));
  return mods;
};
const equipmentNames=(hero:Hero)=>equipmentSlotsOf(hero).map(x=>x?.name||"장비 없음");
const combatStats=(hero:Hero)=>{
  const m=combinedCombatMods(equippedItemsOf(hero));
  const artifactMods:Record<string,number>={};
  (hero.artifacts||[]).forEach(name=>Object.entries((eventArtifactEffects[name]||growthArtifactCatalog[name])?.combatMods||{}).forEach(([k,v])=>artifactMods[k]=(artifactMods[k]||0)+(v||0)));
  const bonus=chronicleBonuses(hero);
  const hp=Math.round(hero.hp*(1+((m.hpPct||0)+(artifactMods.hpPct||0)+(bonus.hpPct||0))/100));
  return {hp,maxHp:hp,attack:hero.attack+(m.attack||0)+(artifactMods.attack||0)+(bonus.attack||0),defense:hero.defense+(m.defense||0)+(artifactMods.defense||0)+(bonus.defense||0),speed:hero.speed*(1+((m.speedPct||0)+(artifactMods.speedPct||0)+(bonus.speedPct||0))/100),range:hero.range+(m.range||0)+(artifactMods.range||0)};
};
function autoFormation(heroes:Hero[],mode:BattleMode):Hero[]{
  const rank=(h:Hero)=>{
    if(h.job==="Guardian")return 0;
    if(h.job==="Warrior")return h.tendencies.aggression>=h.tendencies.caution?1:2;
    if(h.job==="Archer"||h.job==="Mage")return 3;
    return 4;
  };
  return heroes.slice().sort((a,b)=>{
    const r=rank(a)-rank(b);
    if(r!==0)return r;
    return (b.tendencies.aggression+b.tendencies.bravery+b.tendencies.pursuit)-(a.tendencies.aggression+a.tendencies.bravery+a.tendencies.pursuit);
  });
}
function formationPosition(hero:Hero,index:number,total:number,mode:BattleMode){
  const crowd=Math.max(0,total-1)*.16;
  const aggressive=hero.tendencies.aggression*.45+hero.tendencies.bravery*.3+hero.tendencies.pursuit*.25;
  const defensive=hero.tendencies.caution*.45+hero.tendencies.survival*.55;
  let base=hero.job==="Guardian"?1.0:hero.job==="Warrior"?1.45:hero.job==="Cleric"?3.4:2.65;
  if(mode==="defense"&&(hero.job==="Guardian"||hero.job==="Warrior"))base-=.2;
  if(mode==="raid"&&(hero.job==="Cleric"||hero.job==="Mage"))base+=.18;
  base+=(defensive-aggressive)*.006;
  return Math.max(.55,Math.min(4.6,base+index*.28-crowd));
}
function formationLabel(heroes:Hero[],mode:BattleMode){
  const ordered=autoFormation(heroes,mode);
  const front=ordered.filter(h=>h.job==="Guardian"||h.job==="Warrior").length;
  const rear=ordered.filter(h=>h.job==="Archer"||h.job==="Mage"||h.job==="Cleric").length;
  if(!front)return "원거리 집중";
  if(!rear)return "전면 압박";
  return mode==="defense"?"자동 방어 진형":"자동 전열·후열 진형";
}
function battlePlanFor(heroes:Hero[],mode:BattleMode):BattlePlan{
  const avg=(k:keyof Tendencies)=>heroes.length?heroes.reduce((n,h)=>n+h.tendencies[k],0)/heroes.length:50;
  const pressure=avg("aggression")*.45+avg("bravery")*.25+avg("pursuit")*.3;
  const safety=avg("protect")*.4+avg("survival")*.32+avg("caution")*.28;
  const precision=avg("focus")*.5+avg("cooperation")*.2+avg("pursuit")*.3;
  if(mode==="defense" && safety>=pressure) return {key:"defensive",label:"수호 방침",detail:"목표 유지와 동료 생존을 우선하는 자동 전투 방침"};
  if(mode==="raid" && pressure>=68 && precision>=68) return {key:"focused",label:"집중 압박",detail:"보스의 약점을 좇아 공격 행동을 압축하는 자동 전투 방침"};
  if(pressure>=70 && avg("caution")<62) return {key:"aggressive",label:"전면 돌격",detail:"공격·추격을 앞세워 전투를 빠르게 끝내려는 자동 전투 방침"};
  if(safety>=70) return {key:"defensive",label:"수호 방침",detail:"위험 관리와 보호·회복을 우선하는 자동 전투 방침"};
  if(precision>=72) return {key:"focused",label:"정밀 압박",detail:"약점과 사거리 계산을 중심으로 행동을 집중하는 자동 전투 방침"};
  return {key:"balanced",label:"균형 방침",detail:"상황 변화에 따라 공격·지원·생존을 균형 있게 배분하는 자동 전투 방침"};
}
function battlePlanBonus(plan:BattlePlan|undefined,action:string,team:"player"|"enemy"){
  if(!plan||team!=="player")return 0;
  const attack=["일반 공격","추격","광폭 돌격","결투 집중","정밀 사격","사냥 본능","원소 폭발","저주 확산","비전 해방","심판"];
  if(plan.key==="aggressive") return attack.includes(action)?14:action==="후퇴"?-10:action==="아군 보호"?-3:action==="회복"?-4:4;
  if(plan.key==="defensive") return action==="아군 보호"?16:action==="회복"?15:action==="대회복"?18:action==="후퇴"?10:attack.includes(action)?-3:4;
  if(plan.key==="focused") return attack.includes(action)?10:action==="광역 마법"?8:action==="대기"?-4:3;
  return action==="아군 보호"||action==="회복"?5:action==="일반 공격"||action==="추격"?5:2;
}
function battleObjectiveBonus(a:BattleUnit, enemies:BattleUnit[], action:string, context:BattleContext|undefined){
  if(!context||a.team!=="player")return 0;
  const attack=["일반 공격","추격","광폭 돌격","결투 집중","정밀 사격","사냥 본능","원소 폭발","저주 확산","비전 해방","심판"];
  if(context.mode==="defense"){
    const pressure=enemies.filter(x=>x.pos<1.8).length;
    if(attack.includes(action)) return pressure*5;
    if(action==="아군 보호") return context.objectiveHp<70?10:0;
    if(action==="회복") return context.objectiveHp<55?12:0;
    if(action==="후퇴") return pressure>=2?-9:0;
  }
  if(context.mode==="raid"){
    const boss=enemies.find(x=>x.grade==="Boss"&&x.alive);
    if(boss){
      if(attack.includes(action)) return 14+(context.phase===3?8:0);
      if(action==="추격") return context.phase>=2?8:0;
      if(action==="회복"||action==="아군 보호") return context.phase===3?7:0;
    }
  }
  return 0;
}

function routeForecast(kind:RoomKind,floor:number,heroes:Hero[],routeMemory?:RouteMemory){
  const avg=(key:keyof Tendencies)=>heroes.length?heroes.reduce((n,h)=>n+h.tendencies[key],0)/heroes.length:50;
  const jobs=new Set(heroes.map(h=>h.job));
  let risk=30, reward=40, fit=60;
  if(kind==="battle"){risk=42+floor*2;reward=55+floor*6;}
  if(kind==="elite"){risk=68+floor*2;reward=105+floor*10;}
  if(kind==="treasure"){risk=8;reward=145+avg("greed")*.7;}
  if(kind==="rest"){risk=2;reward=30+avg("survival")*.25;}
  if(kind==="event"){risk=28;reward=75+avg("curiosity")*.55;}
  if(kind==="hidden"){risk=18;reward=125+avg("curiosity")*.8;}
  if(kind==="boss"){risk=86+floor*2;reward=260+floor*18;}
  if(kind==="evilCave"){risk=96;reward=520;}
  if(kind==="battle"||kind==="elite"||kind==="boss"||kind==="evilCave") risk-=avg("survival")*.12+avg("caution")*.08;
  if(kind==="event") risk-=avg("caution")*.12;
  if(kind==="hidden") risk-=avg("curiosity")*.18;
  if(kind==="treasure") fit+=avg("greed")*.18;
  const env=environmentFor(floor,kind,"dungeon");
  if(env==="dark")fit+=avg("caution")*.18-(jobs.has("Archer")?8:0);
  if(env==="narrow")fit+=avg("aggression")*.16+avg("pursuit")*.12;
  if(env==="toxic")fit+=avg("survival")*.2+avg("caution")*.1;
  if(env==="water")fit+=jobs.has("Warrior")||jobs.has("Guardian")?4:0;
  if(env==="unstable")fit+=avg("focus")*.16;
  const memory=routeMemory?.[kind];
  if(memory&&memory.attempts>0){
    const successRate=memory.clears/memory.attempts;
    risk+=memory.failures*4-memory.clears*.8;
    fit+=(successRate-.5)*12;
    if(memory.rewardSamples>=2){
      const observed=memory.rewardGold/memory.rewardSamples;
      reward=reward*.7+observed*.3;
    }
  }
  const experience=memory?.attempts||0;
  const successRate=memory&&memory.attempts?Math.round(memory.clears/memory.attempts*100):0;
  return {risk:Math.max(0,Math.min(100,Math.round(risk))),reward:Math.max(0,Math.round(reward)),fit:Math.max(0,Math.min(100,Math.round(fit))),environment:env,experience,successRate};
}

function actionForecast(hero:Hero,partyHeroes:Hero[],partyMemory?:PartyMemory):{action:string;score:number;detail:string}[]{
  const t=hero.tendencies;
  const items=equippedItemsOf(hero);
  const mods=combinedAiModsWithArtifacts(items,hero.artifacts||[]);
  const habit=(action:string)=>habitBias(hero,action)+(partyMemory?partyHabitBias(partyMemory,action):0);
  const result:{action:string;score:number;detail:string}[]=[];
  result.push({action:"일반 공격",score:50+t.aggression*.35+t.bravery*.2+t.focus*.1+(mods.aggression||0)*.7+habit("일반 공격"),detail:"공격성·용맹·집중력과 기존 공격 습관을 반영"});
  if(hero.job==="Warrior")result.push({action:"추격",score:25+t.pursuit*.5+t.aggression*.2+t.bravery*.15+(mods.pursuit||0)*.8+habit("추격"),detail:"약화된 적을 계속 압박하는 성향"});
  if(hero.job==="Guardian")result.push({action:"아군 보호",score:20+t.protect*.5+t.cooperation*.25+(mods.protect||0)*.8+habit("아군 보호"),detail:"보호 성향·협동성·동료 관계를 기반으로 판단"});
  if(hero.job==="Cleric")result.push({action:"회복",score:30+t.protect*.35+t.cooperation*.25+(mods.protect||0)*.7+habit("회복"),detail:"보호 성향과 회복 습관을 기반으로 판단"});
  if(hero.job==="Mage")result.push({action:"광역 마법",score:40+t.aggression*.2+t.focus*.2+(mods.focus||0)*.8+habit("광역 마법"),detail:"집중력·공격성과 반복된 마법 사용 기록 반영"});
  const pTop=partyHeroes.filter(x=>x.id!==hero.id).map(x=>{
    const r=relationshipFromMap(hero.relationships,x.id);
    return r.bond+r.trust*.35;
  });
  const social=pTop.length?Math.min(8,Math.max(...pTop)*.06):0;
  result.push({action:"후퇴",score:20+t.survival*.45+t.caution*.3-t.bravery*.25-t.aggression*.12+habit("후퇴"),detail:"생존본능·신중함과 과거 패배 경험을 반영"});
  return result.map(x=>({...x,score:x.score+(x.action==="아군 보호"||x.action==="회복"?social:0)})).sort((a,b)=>b.score-a.score).slice(0,4);
}

function equipmentPreview(hero:Hero,item:Item,slot:number){
  const before=combatStats(hero);
  const slots=equipmentSlotsOf(hero); slots[slot]=item;
  const after=combatStats({...hero,equipment:slots});
  const current=equipmentSlotsOf(hero)[slot];
  const currentAi=current?.aiMods||{};
  const aiDelta=(Object.keys(tendencyKo) as (keyof Tendencies)[]).map(k=>({key:k,value:(item.aiMods[k]||0)-(currentAi[k]||0)})).filter(x=>x.value!==0).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value)).slice(0,3);
  return {
    attack:after.attack-before.attack,
    defense:after.defense-before.defense,
    hp:after.maxHp-before.maxHp,
    speed:after.speed-before.speed,
    range:after.range-before.range,
    aiDelta
  };
}

function spawn(heroes:Hero[],party:string[],room:RoomKind,floor:number,lineages:MonsterLineage[]=[],mode:BattleMode="dungeon"): BattleUnit[] {
  const selected=heroes.filter(h=>party.includes(h.id));
  const ordered=autoFormation(selected,mode);
  const ps: BattleUnit[] = ordered.map((h,i)=>{
    const s=combatStats(h);
    return {id:h.id,name:h.name,job:h.job,level:h.level,team:"player" as const,hp:s.hp,maxHp:s.maxHp,attack:s.attack,defense:s.defense,
      speed:s.speed,range:s.range,pos:formationPosition(h,i,ordered.length,mode),alive:true,tendencies:aiT(h.tendencies,equippedItemsOf(h),h.artifacts||[]),equipment:equippedItemsOf(h),item:equippedItemsOf(h)[0],
      relationships:h.relationships,memories:h.memories,promotionPath:h.promotionPath,actionText:"대기",cooldown:0,guard:0,xp:0,behaviorCounts:{...(h.behaviorCounts||{})}};
  });
  const pool=floor<3?["Goblin","Kobold","Slime"]:floor<5?["Gnoll","Lizardman","Arachne"]:["Orc","Uruk","Ogre"];
  const count=room==="boss"||room==="evilCave"?3:room==="elite"?4:3;
  let es=Array.from({length:count},(_,i)=>createLinedMonster(pool[(i+floor)%pool.length],floor+2,room==="boss"?"Boss":room==="elite"?"Elite":"Normal",i,lineages));
  if(room==="boss"||room==="evilCave"){
    const bossSpecies=room==="evilCave"?"Demon":raidBossForFloor(floor);
    const base=createMonster(bossSpecies,Math.max(8,floor+5),"Boss",0);
    const bossName=room==="evilCave"?"악의 동굴 수문장":bossSpecies==="Uruk"?"우르크 전쟁대장":bossSpecies==="Arachne"?"둥지의 여왕":"지옥의 대공";
    es[0]={...base,name:bossName,pos:8.8};
  }
  return ps.concat(es.map(e=>({id:e.id,name:e.name,species:e.species,grade:e.grade,level:e.level,team:"enemy" as const,hp:e.hp,maxHp:e.maxHp,attack:e.attack,defense:e.defense,
    speed:e.speed,range:e.range,pos:e.pos,alive:true,tendencies:e.tendencies,mutation:e.mutation,evolutionStage:e.evolutionStage,evolutionPath:e.evolutionPath,actionText:"대기",cooldown:0,guard:0,xp:0})));
}

function asEnemy(e:ReturnType<typeof createMonster>,suffix=""):BattleUnit{
  return {id:e.id+suffix,name:e.name,species:e.species,grade:e.grade,level:e.level,team:"enemy" as const,hp:e.hp,maxHp:e.maxHp,attack:e.attack,defense:e.defense,speed:e.speed,range:e.range,pos:e.pos,alive:true,tendencies:e.tendencies,evolutionStage:e.evolutionStage,evolutionPath:e.evolutionPath,evolutionFocus:e.evolutionFocus,mutation:e.mutation,actionText:"대기",cooldown:0,guard:0,xp:0};
}

function decisions(a:BattleUnit,u:BattleUnit[],env?:EnvironmentKind,partyMemory?:PartyMemory,plan?:BattlePlan,context?:BattleContext):Decision[] {
  const allies=live(u,a.team), enemies=live(u,a.team==="player"?"enemy":"player");
  const nearest=enemies.slice().sort((x,y)=>dist(a,x)-dist(a,y))[0];
  const weak=enemies.slice().sort((x,y)=>pct(x)-pct(y))[0];
  const boss=enemies.find(x=>x.grade==="Boss"&&x.alive);
  const goalThreat=context?.mode==="defense"?enemies.slice().sort((x,y)=>x.pos-y.pos)[0]:undefined;
  const attackTarget=(context?.mode==="raid"&&boss)?boss:(context?.mode==="defense"&&goalThreat?goalThreat:weak);
  const ally=allies.slice().sort((x,y)=>pct(x)-pct(y))[0];
  const t=a.tendencies; const arr:Decision[]=[];
  const threat=nearest?Math.min(100,(1-pct(a))*100+60):0;
  const mod=combinedAiMods(equippedItemsOf(a));
  const lossBias=(a.memories||[]).filter(m=>m.text.includes("전사")).reduce((n,m)=>n+m.weight,0);
  const envBonus=env?environmentDecisionBonus(a,env):0;
  if(a.cooldown<=0) for(const p of promotionActions(a.promotionPath)){
    let score=p.bonus+(t.focus+t.bravery+t.protect+t.aggression)*.08+envBonus+habitBias(a,p.name)+(a.team==="player"?partyHabitBias(partyMemory,p.name):0)+battlePlanBonus(plan,p.name,a.team);
    if((p.name.includes("대회복")||p.name.includes("수호"))&&ally) score+=Math.max(0,(1-pct(ally))*55);
    if((p.name.includes("사격")||p.name.includes("사냥")||p.name.includes("심판"))&&attackTarget) score+=Math.max(0,(1-pct(attackTarget))*45);
    if(context?.mode==="raid"&&boss&&["사격","사냥","심판","폭발","저주","돌격","비전"].some(x=>p.name.includes(x))) score+=18;
    if((p.name.includes("폭발")||p.name.includes("저주"))&&enemies.length>=2) score+=enemies.length*10;
    arr.push({action:p.name,detail:p.detail,score});
  }
  if(a.team==="enemy"&&a.species&&a.cooldown<=0){
    for(const m of monsterActions(a.species,a.grade,a.mutation)){
      let score=m.bonus+t.focus*.08+envBonus+habitBias(a,m.name)+evolutionActionBonus({id:"runtime",species:a.species!,level:1,experience:0,focus:a.evolutionFocus?{[a.evolutionFocus]:1}:{},evolutionStage:a.evolutionStage||0,evolutionPath:a.evolutionPath||[]},m.name);
      if((m.name==="대지 강타"||m.name==="분열"||m.name==="영역 지배")&&enemies.length>=2)score+=18;
      if((m.name==="무리 사냥"||m.name==="약점 추적"||m.name==="역할 분석")&&weak)score+=Math.max(0,(1-pct(weak))*35);
      if(m.name==="회피 기동"&&pct(a)<.5)score+=35;
      arr.push({action:m.name,detail:m.detail,score});
    }
  }

  if(nearest){
    let s=68+t.aggression*.42+t.bravery*.24+t.focus*.12+(1-pct(weak))*46+envBonus+(a.team==="enemy"?24:0);
    if(pct(weak)<.2)s+=25; if(dist(a,nearest)<=a.range)s+=30; s+=(mod.aggression||0)*.7;
    arr.push({action:"일반 공격",target:(context?.mode==="raid"&&boss?boss.id:(a.job==="Archer"||a.job==="Mage"?weak.id:nearest.id)),detail:"위협·마무리 가능성·기존 공격 습관을 계산",score:s+habitBias(a,"일반 공격")+roleSynergy(a,allies,"일반 공격")+battlePlanBonus(plan,"일반 공격",a.team)+battleObjectiveBonus(a,enemies,"일반 공격",context)});
  }
  if(a.job==="Warrior") arr.push({action:"추격",target:weak?.id,detail:"약해진 적을 끝까지 압박",score:25+t.pursuit*.5+t.aggression*.2+t.bravery*.15-threat*.2+(mod.pursuit||0)*.8+habitBias(a,"추격")+roleSynergy(a,allies,"추격")+battlePlanBonus(plan,"추격",a.team)+battleObjectiveBonus(a,enemies,"추격",context)});
  if(a.job==="Guardian"&&ally&&pct(ally)<.82) arr.push({action:"아군 보호",target:ally.id,detail:"부상한 아군을 우선 보호하고 전선을 유지",score:26+t.protect*.5+t.cooperation*.25+(1-pct(ally))*58+habitBias(a,"아군 보호")+partyHabitBias(partyMemory,"아군 보호")+roleSynergy(a,allies,"아군 보호")+relationshipFromMap(a.relationships,ally.id).trust*.22+relationshipFromMap(a.relationships,ally.id).bond*.12+(mod.protect||0)*.8+Math.min(12,lossBias*.2)+battlePlanBonus(plan,"아군 보호",a.team)+battleObjectiveBonus(a,enemies,"아군 보호",context)});
  if(a.job==="Cleric"&&ally&&pct(ally)<.76) arr.push({action:"회복",target:ally.id,detail:"부상한 아군을 즉시 회복",score:32+t.protect*.35+t.cooperation*.25+(1-pct(ally))*82+habitBias(a,"회복")+partyHabitBias(partyMemory,"회복")+roleSynergy(a,allies,"회복")+relationshipFromMap(a.relationships,ally.id).trust*.16+relationshipFromMap(a.relationships,ally.id).bond*.1+(mod.protect||0)*.7+Math.min(8,lossBias*.15)+battlePlanBonus(plan,"회복",a.team)+battleObjectiveBonus(a,enemies,"회복",context)});
  if(a.job==="Mage") arr.push({action:"광역 마법",detail:"사거리에 들어온 적 수를 계산",score:40+t.aggression*.2+t.focus*.2+enemies.filter(x=>dist(a,x)<=5).length*14+(mod.focus||0)*.8+habitBias(a,"광역 마법")+roleSynergy(a,allies,"광역 마법")+battlePlanBonus(plan,"광역 마법",a.team)+battleObjectiveBonus(a,enemies,"광역 마법",context)});
  if(a.team==="enemy"&&a.species==="Goblin") arr.push({action:"기습 후퇴",target:nearest?.id,detail:"위험해지면 생존을 위해 물러남",score:20+t.greed*.2+t.caution*.35+(1-pct(a))*60});
  if(a.team==="enemy"&&a.grade==="Boss"){
    const phase=pct(a)>0.65?1:pct(a)>0.35?2:3;
    arr.push({action:"보스 패턴",detail:"페이즈 "+phase+" 패턴을 선택하고 전장을 압박",score:42+t.focus*.25+t.bravery*.25+(phase-1)*18});
  }
  arr.push({action:"후퇴",detail:"현재 HP와 적 위협을 기준으로 생존 판단",score:20+t.survival*.45+t.caution*.3+threat*.4-t.bravery*.25-t.aggression*.12+envBonus+habitBias(a,"후퇴")+partyHabitBias(partyMemory,"후퇴")+(pct(a)<.12?20:0)-(equippedItemsOf(a).some(x=>x.id==="berserker-heart")?35:0)-(a.team==="enemy"?10:0)+battlePlanBonus(plan,"후퇴",a.team)+battleObjectiveBonus(a,enemies,"후퇴",context)});
  arr.push({action:"대기",detail:"즉시 행동의 가치가 낮다고 판단",score:16+t.caution*.05+envBonus*.2});
  return arr;
}

function roleSynergy(a:BattleUnit,allies:BattleUnit[],action:string):number{
  if(a.team!=="player")return 0;
  const candidates=allies.filter(x=>x.id!==a.id);
  if(!candidates.length)return 0;
  const partner=candidates.slice().sort((x,y)=>{
    const ry=relationshipFromMap(a.relationships,y.id), rx=relationshipFromMap(a.relationships,x.id);
    return (ry.bond+ry.trust*.35)-(rx.bond+rx.trust*.35);
  })[0];
  const r=relationshipFromMap(a.relationships,partner.id);
  const link=Math.min(10,r.bond*.07+r.trust*.025);
  if((action==="아군 보호"||action==="수호 맹세"||action==="철벽 진형")&&partner.team==="player")return link;
  if((action==="회복"||action==="대회복")&&partner.team==="player")return link*.82;
  if(action==="추격"&&a.job==="Warrior"&&candidates.some(x=>x.job==="Archer"||x.job==="Mage"))return link*.55;
  if(action==="일반 공격"&&a.job==="Archer"&&candidates.some(x=>x.job==="Warrior"||x.job==="Guardian"))return link*.45;
  if(action==="광역 마법"&&a.job==="Mage"&&candidates.length>=2)return link*.35;
  return 0;
}

function weighted(ds:Decision[]):Decision {
  const list=ds.filter(d=>d.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
  const top=list.map((d,i)=>({...d,score:d.score*Math.pow(.88,i)}));
  const total=top.reduce((n,d)=>n+d.score,0); let r=Math.random()*total;
  for(const d of top){r-=d.score;if(r<=0)return d;} return top[0];
}

function hit(a:BattleUnit,b:BattleUnit,m=1){
  const critChance=Math.min(.4,(a.tendencies.focus>82?.16:0)+(combinedCombatMods(equippedItemsOf(a)).critPct||0)/100);
  const crit=Math.random()<critChance?1.55:1;
  const guardFactor=b.guard>0?.62:1;
  return Math.max(5,Math.round((a.attack*m-b.defense*.5)*crit*(.94+Math.random()*.12)*guardFactor));
}

function doAI(u:BattleUnit[],id:string,env?:EnvironmentKind,partyMemory?:PartyMemory,plan?:BattlePlan,context?:BattleContext):{units:BattleUnit[];decision:Decision;line:string}{
  const n=u.map(x=>({...x,behaviorCounts:{...(x.behaviorCounts||{})},fx:undefined,fxKind:undefined,battleStats:{...(x.battleStats||{damage:0,healing:0,actions:0})}})); const a=n.find(x=>x.id===id)!; const hpBefore=new globalThis.Map(n.map(x=>[x.id,x.hp])); const d=weighted(decisions(a,n,env,partyMemory,plan,context));
  const enemies=live(n,a.team==="player"?"enemy":"player"), allies=live(n,a.team);
  const nearest=enemies.slice().sort((x,y)=>dist(a,x)-dist(a,y))[0];
  const weak=enemies.slice().sort((x,y)=>pct(x)-pct(y))[0];
  a.behaviorCounts![d.action]=(a.behaviorCounts![d.action]||0)+1; a.battleStats!.actions+=1;
  const by=(x?:string)=>n.find(q=>q.id===x&&q.alive);
  const move=(target:BattleUnit)=>{
    const baseStep=(a.job==="Archer"||a.job==="Mage"||a.job==="Cleric") ? .8 : 1.05;
    const step=env==="narrow"?baseStep*.72:env==="water"&&a.species!=="Lizardman"?baseStep*.86:baseStep;
    a.pos+=(target.pos>a.pos?step:-step); a.pos=Math.max(.3,Math.min(9.7,a.pos));
  };
  let line="";
  const fx=(target:BattleUnit,kind:"damage"|"heal"|"critical"|"status",text:string)=>{target.fx=text;target.fxKind=kind;};
  if(d.action==="광폭 돌격"){
    const t=by(d.target)||nearest; if(t){if(dist(a,t)>a.range)move(t);else{const x=hit(a,t,1.35);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;fx(t,"damage","-"+x);a.pos=Math.min(9.7,a.pos+.25);a.actionText="광폭 돌격 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="수호 맹세"){
    const t=by(d.target)||allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){a.pos += t.pos>a.pos?.55:-.55;a.guard=3;t.guard=Math.max(t.guard,2);a.actionText="수호 맹세 → "+t.name;line=a.actionText;}
  } else if(d.action==="결투 집중"||d.action==="정밀 사격"||d.action==="사냥 본능"||d.action==="심판"){
    const t=by(d.target)||weak||nearest; if(t){if(dist(a,t)>a.range)move(t);else{const x=hit(a,t,d.action==="정밀 사격"?1.25:1.12);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;fx(t,"damage","-"+x);a.actionText=d.action+" → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="철벽 진형"){
    const t=allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){a.guard=4;t.guard=3;a.pos += t.pos>a.pos?.45:-.45;a.actionText="철벽 진형 → "+t.name;line=a.actionText;}
  } else if(d.action==="원소 폭발"||d.action==="저주 확산"){
    const ts=enemies.filter(x=>dist(a,x)<=5).slice(0,4); if(ts.length){const bits=ts.map(t=>{const x=hit(a,t,d.action==="원소 폭발"?0.9:0.7);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;fx(t,"damage","-"+x);return t.name+" -"+x});a.actionText=d.action+" → "+bits.join(", ");line=a.actionText;}
  } else if(d.action==="비전 해방"){
    const t=weak||nearest; if(t){if(dist(a,t)>a.range)move(t);else{const x=hit(a,t,1.45);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;fx(t,"critical","-"+x);a.actionText="비전 해방 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="대회복"){
    const t=allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){const x=Math.round(t.maxHp*((.30+a.tendencies.cooperation*.001)*(1+(combinedCombatMods(equippedItemsOf(a)).healPct||0)/100)));t.hp=Math.min(t.maxHp,t.hp+x);fx(t,"heal","+"+x);t.guard=Math.max(t.guard,1);a.actionText="대회복 → "+t.name+" (+"+x+")";line=a.actionText;}
  } else if(d.action==="분열"){
    if(pct(a)>.55 && n.filter(x=>x.team==="enemy").length<8){
      const child={...a,id:a.id+"-split-"+Math.random().toString(36).slice(2,5),name:a.name+" 분열체",hp:Math.round(a.maxHp*.28),maxHp:Math.round(a.maxHp*.28),attack:Math.max(3,Math.round(a.attack*.45)),defense:Math.max(1,Math.round(a.defense*.45)),pos:Math.max(.4,a.pos-.4),alive:true};
      n.push(child);a.hp=Math.round(a.hp*.72);a.actionText="분열 → "+child.name;line=a.actionText;
    } else {a.actionText="분열 대기";line=a.actionText;}
  } else if(d.action==="함정 투척"||d.action==="매복 함정"||d.action==="거미줄"){
    const t=by(d.target)||weak||nearest;
    if(t){t.speed=Math.max(.35,t.speed-.22);fx(t,"status","SLOW");a.actionText=d.action+" → "+t.name;line=a.actionText;}
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
    if(t){t.tendencies.focus=Math.max(0,t.tendencies.focus-(d.action==="매혹"?12:7));t.attack=Math.max(1,Math.round(t.attack*.92));fx(t,"status",d.action==="매혹"?"매혹":"약화");const x=hit(a,t,.9);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText=d.action+" → "+t.name+" (-"+x+")";line=a.actionText;}
  } else if(d.action==="대지 강타"){
    const ts=enemies.filter(x=>dist(a,x)<=2.4).slice(0,4);
    if(ts.length){const bits=ts.map(t=>{const x=hit(a,t,1.05);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;return t.name+" -"+x});a.actionText="대지 강타 → "+bits.join(", ");line=a.actionText;}
  } else if(d.action==="회피 기동"){
    a.pos=Math.max(.3,a.pos-.95);a.tendencies.survival=Math.min(100,a.tendencies.survival+7);a.actionText="회피 기동 · 거리 확보";line=a.actionText;
  } else if(d.action==="역할 분석"){
    const t=enemies.slice().sort((x,y)=>(x.job==="Cleric"?0:1)-(y.job==="Cleric"?0:1)||pct(x)-pct(y))[0]||weak||nearest;
    if(t){if(dist(a,t)>a.range)move(t);else{const x=hit(a,t,1.28);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;fx(t,"status","-"+x);a.actionText="역할 분석 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="전선 재편"){
    const phase=pct(a)>0.65?1:pct(a)>0.35?2:3;
    const minions=live(n,"enemy").filter(x=>x.id!==a.id);
    const target=enemies.slice().sort((x,y)=>pct(x)-pct(y))[0];
    minions.forEach(x=>{x.tendencies.focus=Math.min(100,x.tendencies.focus+7);x.tendencies.aggression=Math.min(100,x.tendencies.aggression+5);if(phase>=2)x.guard=Math.max(x.guard,2);});
    if(target&&phase>=2)target.tendencies.caution=Math.max(0,target.tendencies.caution-8);
    a.guard=phase>=3?3:1;a.actionText="전선 재편 · PHASE "+phase;line=a.actionText;
  } else if(d.action==="둥지 확장"){
    const phase=pct(a)>0.65?1:pct(a)>0.35?2:3;
    enemies.filter(x=>dist(a,x)<6).forEach(x=>x.speed=Math.max(.3,x.speed-(phase===3?.3:.16)));
    if(phase>=2)a.tendencies.survival=Math.min(100,a.tendencies.survival+5);
    a.guard=phase===3?2:0;a.actionText="둥지 확장 · 거미줄 지대 · PHASE "+phase;line=a.actionText;
  } else if(d.action==="공포의 심문"){
    const phase=pct(a)>0.65?1:pct(a)>0.35?2:3;
    const target=enemies.slice().sort((x,y)=>(pct(x)-pct(y))||((x.job==="Cleric"?0:1)-(y.job==="Cleric"?0:1)))[0];
    if(target){
      target.tendencies.bravery=Math.max(0,target.tendencies.bravery-(phase===3?15:8));
      target.tendencies.focus=Math.max(0,target.tendencies.focus-(phase===3?12:6));
      if(dist(a,target)<=a.range){const x=hit(a,target,phase===3?1.22:1.05);target.hp=Math.max(0,target.hp-x);target.alive=target.hp>0;}
      else move(target);
    }
    a.actionText="공포의 심문 → "+(target?.name||"취약 대상")+" · PHASE "+phase;line=a.actionText;
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
    const t=by(d.target)||enemies[0]; if(t){if(dist(a,t)>a.range) move(t),a.actionText="접근 → "+t.name; else {const x=hit(a,t);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;fx(t,"damage","-"+x);a.actionText="일반 공격 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="추격"){
    const t=by(d.target)||enemies[0]; if(t){if(dist(a,t)>a.range)move(t),a.actionText="추격 → "+t.name;else{const x=hit(a,t,1.18);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;fx(t,"damage","-"+x);a.actionText="추격 공격 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="아군 보호"){
    const t=by(d.target)||allies[0]; if(t){a.pos += t.pos > a.pos ? .5 : -.5;a.guard=2;t.guard=Math.max(t.guard,1);a.actionText="아군 보호 → "+t.name;line=a.actionText;}
  } else if(d.action==="회복"){
    const t=by(d.target)||allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){const x=Math.round(t.maxHp*((.18+a.tendencies.cooperation*.001)*(1+(combinedCombatMods(equippedItemsOf(a)).healPct||0)/100)));t.hp=Math.min(t.maxHp,t.hp+x);fx(t,"heal","+"+x);a.actionText="회복 → "+t.name+" (+"+x+")";line=a.actionText;}
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
  if(["광폭 돌격","수호 맹세","결투 집중","정밀 사격","사냥 본능","심판","철벽 진형","원소 폭발","저주 확산","비전 해방","대회복","분열","함정 투척","매복 함정","거미줄","무리 사냥","약점 추적","연계 공격","전투 함성","지휘 명령","측면 습격","급강하","굴 파기 기습","독성 압박","매혹","대지 강타","회피 기동","역할 분석","전선 재편","둥지 확장","공포의 심문","영역 지배","광폭화"].includes(d.action))a.cooldown=2;
  n.forEach(x=>{if(!x.alive)x.hp=0;if(x.guard>0&&x.id!==a.id)x.guard-=.2;if(x.id!==a.id&&x.cooldown>0)x.cooldown=Math.max(0,x.cooldown-.25);});
  n.forEach(x=>{const before=hpBefore.get(x.id)||x.hp;const delta=before-x.hp;if(x.id!==a.id&&delta>0)a.battleStats!.damage+=Math.round(delta);if(x.id!==a.id&&delta<0)a.battleStats!.healing+=Math.round(-delta);});
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

function applyGrowthRewardHeroes(heroes:Hero[],reward:GrowthReward,heroId:string,floor:number):Hero[]{
  return heroes.map(h=>{
    if(h.id!==heroId)return h;
    if(reward.kind==="trait"){
      if((h.traits||[]).length>=4 || (h.traits||[]).includes(reward.name)) return h;
      const effect=growthTraitCatalog[reward.name];
      const tendencies={...h.tendencies};
      Object.entries(effect?.aiMods||{}).forEach(([k,v])=>tendencies[k as keyof Tendencies]=clamp(tendencies[k as keyof Tendencies]+(v||0)));
      const record={kind:"trait" as const,name:reward.name,floor,detail:reward.detail,source:reward.source};
      return {...h,tendencies,traits:[...(h.traits||[]),reward.name].slice(0,4),eventRewards:[...(h.eventRewards||[]),record].slice(-8)};
    }
    if((h.artifacts||[]).length>=4 || (h.artifacts||[]).includes(reward.name)) return h;
    const record={kind:"artifact" as const,name:reward.name,floor,detail:reward.detail,source:reward.source};
    return {...h,artifacts:[...(h.artifacts||[]),reward.name].slice(0,4),eventRewards:[...(h.eventRewards||[]),record].slice(-8)};
  });
}

function applyGrowthRewardSave(s:Save,reward:GrowthReward,heroId:string):Save{
  return {...s,heroes:applyGrowthRewardHeroes(s.heroes,reward,heroId,s.floor)};
}

export default function App(){
  const [save,setSave]=useState<Save>(load);
  const [screen,setScreen]=useState<Screen>("home");
  const [mode,setMode]=useState<BattleMode>("dungeon");
  const [selectedHero,setSelectedHero]=useState(save.party[0]||save.heroes[0].id);
  const [statusHeroId,setStatusHeroId]=useState<string|undefined>();
  const [selectedEquipSlot,setSelectedEquipSlot]=useState(0);
  const [warehouseTab,setWarehouseTab]=useState<"all"|"weapon"|"armor"|"ring"|"accessory">("all");
  const [warehouseSort,setWarehouseSort]=useState<"recent"|"level"|"rarity">("recent");
  const [selectedWarehouseItem,setSelectedWarehouseItem]=useState<string|undefined>();
  const [lastLoot,setLastLoot]=useState<Item[]>([]);
  const [pendingEvent,setPendingEvent]=useState<DungeonChoiceEvent|undefined>();
  const [battle,setBattle]=useState<{units:BattleUnit[];log:string[];room:RoomKind;round:number;tick:number;ended:boolean;result?:string;next?:string;mode:BattleMode;wave:number;deadline?:number;objectiveHp:number;phase:number;objectiveKind?:DefenseObjective;environment?:EnvironmentKind;repeatScenarioFloor?:number;repeatCount?:number;rewardMultiplier?:number;elitePack?:boolean;phaseNotice?:string;partyMemory?:PartyMemory;plan?:BattlePlan}>({units:[],log:[],room:"battle",round:0,tick:0,ended:false,mode:"dungeon",wave:1,objectiveHp:100,phase:1,partyMemory:defaultPartyMemory});
  const [paused,setPaused]=useState(false);
  const [speed,setSpeed]=useState(1);
  const [decision,setDecision]=useState("상황 감지 → 행동 후보 생성 → 성향/장비 보정 → 확률 선택");
  const [toast,setToast]=useState("");
  const party=useMemo(()=>save.heroes.filter(h=>save.party.includes(h.id)),[save.heroes,save.party]);
  const partyPref=useMemo(()=>partyPreference(party),[party]);
  const hero=save.heroes.find(h=>h.id===selectedHero)||save.heroes[0];
  const heroCombatStats=useMemo(()=>combatStats(hero),[hero]);
  const chronicleBonus=useMemo(()=>chronicleBonuses(hero),[hero]);
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
        routeMemory:recordRouteMemory(s.routeMemory,"hidden",true,outcome.gold),
        stage:s.stage+1
      }));
      const recipient=save.heroes.filter(h=>save.party.includes(h.id)&&((h.traits||[]).length<4)).sort((a,b)=>b.tendencies.curiosity-a.tendencies.curiosity)[0];
      const growth=recipient&&hiddenRoomReward(recipient,save.floor);
      if(growth) setSave(s=>applyGrowthRewardSave(s,growth,recipient.id));
      notify(outcome.text+(growth?" · "+growth.name+" 획득":""));
      return;
    }
    if(kind==="event"){
      const env=environmentFor(save.floor,kind,"dungeon");
      setPendingEvent(dungeonChoiceEvent(save.floor,env));
      return;
    }
    if(kind==="treasure"){
      const uniqueBase=uniqueItems[Math.floor(Math.random()*uniqueItems.length)];
      const uniqueDrop=Math.random()<.12 ? {...uniqueBase,id:uniqueBase.id+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)} : undefined;
      const item=uniqueDrop||randomGeneralItem(save.floor+2,partyPref);
      setSave(s=>({...s,items:[...s.items,item],gold:s.gold+180,routeMemory:recordRouteMemory(s.routeMemory,"treasure",true,180),stage:s.stage+1}));
      const recipient=save.heroes.filter(h=>save.party.includes(h.id)&&((h.artifacts||[]).length<4)).sort((a,b)=>b.tendencies.greed-a.tendencies.greed)[0];
      const growth=recipient&&treasureArtifactReward(recipient,save.floor);
      if(growth) setSave(s=>applyGrowthRewardSave(s,growth,recipient.id));
      notify("보물: "+item.name+(uniqueDrop?" · 고유 장비 발견":"")+" 획득"+(growth?" · "+growth.name+" 발견":""));
      return;
    }
    if(kind==="rest"){
      setSave(s=>({...s,heroes:s.heroes.map(h=>save.party.includes(h.id)?{...grantExperience(h,4).hero,hp:Math.round(h.hp*1.15)}:h),routeMemory:recordRouteMemory(s.routeMemory,"rest",true,0),stage:s.stage+1}));
      notify("휴식: 경험 기록 +4 · HP 15% 회복");
      return;
    }
    const env=environmentFor(save.floor,kind,"dungeon");
    const units=spawn(save.heroes,save.party,kind,save.floor,save.monsterLineages,"dungeon");
    setMode("dungeon");
    const plan=battlePlanFor(party,"dungeon");
    setBattle({units,plan,log:[roomKo[kind]+" · "+formationLabel(party,"dungeon")+" · "+plan.label+" · "+environmentInfo[env].name+" · 전투 명령은 AI가 전부 결정합니다."],room:kind,round:1,tick:0,ended:false,next:units[0].id,mode:"dungeon",wave:1,objectiveHp:100,phase:1,environment:env,partyMemory:save.partyMemory||defaultPartyMemory});
    setPaused(false);setScreen("battle");setDecision("AI가 첫 행동을 분석 중...");
  };

  const startRepeat=(scenarioFloor:number)=>{
    if(save.worldSealed){notify("세계의 구멍이 이미 봉인되었습니다.");return;}
    const repeatCount=(save.scenarioClears[String(scenarioFloor)]||1);
    const elitePack=Math.random()<.25;
    const room:RoomKind=elitePack?"elite":"battle";
    const env=environmentFor(scenarioFloor,room,"dungeon");
    const units=spawn(save.heroes,save.party,room,scenarioFloor,save.monsterLineages,"dungeon");
    const rewardMultiplier=Math.max(.3,.6-.1*Math.max(0,repeatCount-1));
    const plan=battlePlanFor(party,"dungeon");
    setBattle({units,plan,log:[scenarioFloor+"F 완료 시나리오 재도전 · "+formationLabel(party,"dungeon")+" · "+plan.label+" · 반복 "+repeatCount+"회 · "+(elitePack?"정예 무리 출현":"일반 적 편성")+" · 보상 "+Math.round(rewardMultiplier*100)+"%"],room,round:1,tick:0,ended:false,next:units[0].id,mode:"dungeon",wave:1,objectiveHp:100,phase:1,environment:env,partyMemory:save.partyMemory||defaultPartyMemory,repeatScenarioFloor:scenarioFloor,repeatCount,rewardMultiplier,elitePack});
    setPaused(false);setScreen("battle");setDecision(elitePack?"재도전 중 정예 무리의 전투 성향을 분석 중...":"완료 시나리오의 적 행동을 다시 분석 중...");
  };

  const startMode=(nextMode:BattleMode)=>{
    setMode(nextMode);
    const room:RoomKind=nextMode==="raid"?"boss":"battle";
    const env=environmentFor(save.floor,room,nextMode);
    const units=spawn(save.heroes,save.party,room,save.floor,save.monsterLineages,nextMode);
    const objectiveKind=defenseObjectiveForFloor(save.floor);
    const label=nextMode==="defense"
      ? `방어전 시작 · ${defenseObjectiveKo[objectiveKind]} · ${formationLabel(party,nextMode)} · 30초 동안 웨이브가 계속됩니다.`
      : `보스 레이드 시작 · ${raidBossForFloor(save.floor)} 보스 · ${formationLabel(party,nextMode)} · 페이즈는 AI가 자동 전환됩니다.`;
    const plan=battlePlanFor(party,nextMode);
    setBattle({units,plan,log:[label+" · "+plan.label+" · "+environmentInfo[env].name],room,round:1,tick:0,ended:false,next:units[0].id,mode:nextMode,wave:1,deadline:nextMode==="defense"?Date.now()+30000:undefined,objectiveHp:100,phase:1,objectiveKind,environment:env,partyMemory:save.partyMemory||defaultPartyMemory});
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
        const actorPool=alive.slice().sort((a,b)=>b.speed-a.speed).slice(0,Math.min(8,alive.length));
        const actorTotalSpeed=actorPool.reduce((n,x)=>n+Math.max(.25,x.speed),0);
        let actorRoll=Math.random()*actorTotalSpeed;
        let actor=actorPool[actorPool.length-1];
        for(const candidate of actorPool){actorRoll-=Math.max(.25,candidate.speed);if(actorRoll<=0){actor=candidate;break;}}
        const out=doAI(prev.units,actor.id,prev.environment,prev.partyMemory,prev.plan,{mode:prev.mode,objectiveKind:prev.objectiveKind,objectiveHp:prev.objectiveHp,phase:prev.phase});
        let wave=prev.wave,objectiveHp=prev.objectiveHp,phase=prev.phase,ended=false,result:string|undefined;
        const now=Date.now();
        const environmentLog=prev.environment?environmentTick(out.units,prev.environment,prev.tick,phase):undefined;
        let p=live(out.units,"player"),e=live(out.units,"enemy");

        if(prev.mode==="defense"){
          e.forEach(x=>{if(x.pos>0.45)x.pos=Math.max(0.45,x.pos-(0.075+wave*.006));});
          const nearGoal=e.filter(x=>x.pos<0.8).length;
          const bossNear=e.filter(x=>x.grade==="Boss"&&x.pos<1.4).length;
          const basePressure=prev.objectiveKind==="gate"?nearGoal*3+bossNear*5:prev.objectiveKind==="relic"?nearGoal*2+bossNear*6:nearGoal*4;
          const gateShield=prev.objectiveKind==="gate"&&p.some(x=>x.job==="Guardian")?2:0;
          const relicShield=prev.objectiveKind==="relic"&&p.some(x=>x.job==="Mage")?Math.max(1,Math.floor(p.filter(x=>x.job==="Mage").length)):0;
          const pressure=Math.max(0,basePressure-gateShield-relicShield);
          if(prev.tick%4===0 && pressure>0) objectiveHp=Math.max(0,objectiveHp-pressure);
          if(prev.objectiveKind==="escort"&&prev.tick%5===0&&p.some(x=>x.job==="Guardian")) objectiveHp=Math.min(100,objectiveHp+3);
          if(prev.objectiveKind==="relic"&&prev.tick%6===0&&p.some(x=>x.job==="Cleric")) objectiveHp=Math.min(100,objectiveHp+2);
          if(p.length===0||objectiveHp<=0){ended=true;result="defeat";}
          else if(now>=(prev.deadline||now)){ended=true;result="victory";}
          else if(e.length===0){
            wave+=1;
            const pool=["Goblin","Kobold","Gnoll","Orc","Uruk","Arachne","Ogre"];
            const count=Math.min(7,2+wave);
            const nextEnemies=Array.from({length:count},(_,i)=>{
              const waveGrade=wave>=6?"Named":wave>=4?"Elite":"Normal";
              const m=createLinedMonster(pool[(i+wave+save.floor)%pool.length],Math.max(1,save.floor+wave-1),waveGrade,i,save.monsterLineages);
              return asEnemy({...m,pos:8.2+i*.55},"-w"+wave);
            });
            out.units=out.units.concat(nextEnemies);
          }
        }else if(prev.mode==="raid"){
          const boss=out.units.find(x=>x.grade==="Boss"&&x.alive);
          const nextPhase=boss?(pct(boss)>0.65?1:pct(boss)>0.35?2:3):phase;
          phase=nextPhase;
          ended=p.length===0||e.length===0;
          result=e.length===0?"victory":p.length===0?"defeat":undefined;
        }else{
          ended=p.length===0||e.length===0;
          result=e.length===0?"victory":p.length===0?"defeat":undefined;
        }

        if(out.decision) setDecision(out.decision.detail+" · 후보점수 "+Math.round(out.decision.score));
        const logLine=out.line+(out.decision.detail?" / "+out.decision.detail:"");
        const waveLine=prev.mode==="defense"&&wave>prev.wave?" / WAVE "+wave+" 증원":"";
        return {...prev,units:out.units,log:[(environmentLog?environmentLog+" / ":"")+logLine+waveLine].concat(prev.log).slice(0,12),round:prev.round+(actor.team==="enemy"?1:0),tick:prev.tick+1,ended,result,next:out.units.find(x=>x.id===actor.id&&x.alive)?.id,wave,objectiveHp,phase,phaseNotice:prev.mode==="raid"&&phase!==prev.phase?"PHASE "+phase+" · 보스 전투 패턴 강화":undefined};
      });
    },Math.max(110,520/speed));
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
    const buildHero=(h:Hero,unit:BattleUnit|undefined,won:boolean,stats:any,experienceGain:number)=>{
      if(!unit)return h;
      const base={...h,campaignStats:stats};
      const previousProfile=h.combatProfile||{actions:0,damage:0,healing:0,battles:0,topActions:{}};
      const actionCounts={...previousProfile.topActions};
      Object.entries(unit.behaviorCounts||{}).forEach(([name,count])=>{const before=h.behaviorCounts?.[name]||0;const gained=Math.max(0,count-before);if(gained)actionCounts[name]=(actionCounts[name]||0)+gained;});
      const combatProfile={actions:previousProfile.actions+(unit.battleStats?.actions||0),damage:previousProfile.damage+(unit.battleStats?.damage||0),healing:previousProfile.healing+(unit.battleStats?.healing||0),battles:previousProfile.battles+1,topActions:actionCounts};
      const withProfile={...base,combatProfile};
      const progressed=grantExperience(withProfile,experienceGain);
      const behaviorBase=applyBehaviorHistory(progressed.hero,unit.behaviorCounts||{});
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
      const enemyLineages=[...s.monsterLineages];
      const lineageMap=new globalThis.Map(enemyLineages.map(x=>[x.species,x]));
      battle.units.filter(u=>u.team==="enemy"&&u.species&&u.grade!=="Boss").forEach(u=>{
        let lineage=lineageMap.get(u.species!)||emptyLineage(u.species+"-lineage",u.species!);
        for(const [action,count] of Object.entries(u.behaviorCounts||{})){
          const rounds=Math.min(8,Math.max(1,Math.round(count)));
          for(let i=0;i<rounds;i++) lineage=recordLineage(lineage,action,!victory);
        }
        lineageMap.set(u.species!,lineage);
      });
      const nextLineages=[...lineageMap.values()];
      const previousPartyMemory=s.partyMemory||defaultPartyMemory;
      const partyDelta=s.party.filter(id=>battle.units.some(u=>u.id===id)).reduce((m,id)=>{
        const heroBefore=s.heroes.find(h=>h.id===id);
        const unit=battle.units.find(u=>u.id===id);
        if(!heroBefore||!unit)return m;
        Object.entries(unit.behaviorCounts||{}).forEach(([action,count])=>{
          const gained=Math.max(0,count-(heroBefore.behaviorCounts?.[action]||0));
          if(action==="아군 보호"||action==="수호 맹세"||action==="철벽 진형")m.protection+=gained;
          if(action==="회복"||action==="대회복")m.recovery+=gained;
        });
        return m;
      },{protection:0,recovery:0});
      const nextPartyMemory={battles:previousPartyMemory.battles+1,protection:previousPartyMemory.protection+partyDelta.protection,recovery:previousPartyMemory.recovery+partyDelta.recovery,losses:previousPartyMemory.losses+(victory?0:1)};
      if(victory&&battle.room==="boss")scenarioClears[String(s.floor)]=(scenarioClears[String(s.floor)]||0)+1;
      if(victory&&isRepeat)scenarioClears[String(battle.repeatScenarioFloor)]=(scenarioClears[String(battle.repeatScenarioFloor)]||1)+1;
      const rewardMultiplier=isRepeat?(battle.rewardMultiplier||.6):1;
      const baseGold=180+battle.units.filter(u=>u.team==="enemy").length*55+(isBoss?900:0)+(isFinal?1800:0);
      const baseMaterials=isFinal?100:isBoss?60:18;
      const exp=Math.max(8,Math.round((30+(isElite?20:0)+(isBoss?80:0)+(isFinal?120:0))*(isRepeat?.9:1)));
      const experienceGain=victory?exp:Math.max(8,Math.round(exp*.7));
      const loot=victory?rollBattleLoot(Math.max(1,s.floor+(isBoss?2:0)),battle.room,partyPreference(s.party.map(id=>s.heroes.find(h=>h.id===id)).filter((h):h is Hero=>!!h) as Hero[]),rewardMultiplier):[];
      const routeLearning=battle.mode==="dungeon"&&!isRepeat&&(battle.room==="battle"||battle.room==="elite"||battle.room==="boss"||battle.room==="evilCave");
      if(victory) setLastLoot(loot);
      if(victory&&loot.length) window.setTimeout(()=>notify("전리품 획득 · "+loot.map(x=>x.name).join(" · ")),0);
      let nextHeroes=s.heroes.map(h=>{
        if(!s.party.includes(h.id))return h;
        return buildHero(bonded.find(x=>x.id===h.id)||h,battle.units.find(u=>u.id===h.id),victory,statsById[h.id],experienceGain);
      });
      let growthReward:GrowthReward|undefined;
      if(victory){
        growthReward = isBoss ? bossClearReward(battle.units,s.heroes) :
          isElite&&!isRepeat ? eliteClearReward(battle.units,s.heroes) :
          isRepeat ? repeatClearReward(battle.units,s.heroes,battle.repeatCount||0) : undefined;
        if(!growthReward){
          for(const unit of battle.units.filter(u=>u.team==="player"&&u.alive)){
            const h=s.heroes.find(x=>x.id===unit.id);
            if(h){
              const candidate=milestoneReward(h,unit.behaviorCounts||{});
              if(candidate){growthReward=candidate;break;}
            }
          }
        }
        if(growthReward&&growthReward.heroId){
          nextHeroes=applyGrowthRewardHeroes(nextHeroes,growthReward,growthReward.heroId,s.floor);
          window.setTimeout(()=>notify(growthReward!.name+" 획득 · "+growthReward!.source),0);
        }
      }
      return {...s,
        gold:s.gold+(victory?Math.round(baseGold*rewardMultiplier):0),
        materials:s.materials+(victory?Math.max(5,Math.round(baseMaterials*rewardMultiplier)):0),
        items:victory?[...s.items,...loot]:s.items,
        scenarioClears,
        monsterLineages:nextLineages,
        floor:victory&&isBoss?s.floor+1:s.floor,
        stage:victory?(isBoss?0:(isFinal?s.stage:s.stage+1)):s.stage,
        routeMemory:routeLearning?recordRouteMemory(s.routeMemory,battle.room,victory,victory?Math.round(baseGold*rewardMultiplier):0):s.routeMemory,
        heroes:nextHeroes
      };
    });
  },[battle.ended,battle.result]);

  const toggleParty=(id:string)=>{
    if(save.party.includes(id)){if(save.party.length===1)return;setSave(s=>({...s,party:s.party.filter(x=>x!==id)}));}
    else if(save.party.length<4)setSave(s=>({...s,party:s.party.concat(id)}));
    else notify("데모 파티 최대 4명");
  };
  const equip=(item:Item,slot=selectedEquipSlot)=>{
    setSave(s=>{
      let replaced:Item|undefined;
      const heroes=s.heroes.map(h=>{
        if(h.id!==selectedHero)return h;
        const slots=equipmentSlotsOf(h);
        replaced=slots[slot];
        slots[slot]=item;
        return {...h,equipment:slots,item:slots[0]};
      });
      const warehouse=s.items.filter(x=>x.id!==item.id);
      if(replaced) warehouse.push(replaced);
      return {...s,heroes,items:warehouse};
    });
    setSelectedWarehouseItem(undefined);
    notify(hero.name+" · "+item.name+" 장착 (슬롯 "+(slot+1)+")");
  };
  const unequip=(slot:number)=>{
    const current=equipmentSlotsOf(hero)[slot];
    if(!current){notify("선택한 슬롯이 비어 있습니다.");return;}
    setSave(s=>({...s,heroes:s.heroes.map(h=>{
      if(h.id!==selectedHero)return h;
      const slots=equipmentSlotsOf(h); slots[slot]=undefined;
      return {...h,equipment:slots,item:slots[0]};
    }),items:[...s.items,current]}));
    setSelectedWarehouseItem(current.id);
    notify(hero.name+" · "+current.name+" 장비 해제 · 창고로 반환");
  };
  const sellItem=(item:Item)=>{
    if(equippedItemsOf(hero).some(x=>x.id===item.id)){notify("장착 중인 장비는 먼저 해제해야 합니다.");return;}
    const price=Math.max(10,Math.round((item.level*10)+(item.rarity==="전설"?90:item.rarity==="영웅"?55:item.rarity==="희귀"?30:18)+(item.unique?120:0)));
    setSave(s=>({...s,gold:s.gold+price,items:s.items.filter(x=>x.id!==item.id)}));
    notify(item.name+" 판매 · +"+price+"G");
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
  const chooseDungeonEvent=(choiceId:string)=>{
    if(!pendingEvent)return;
    const env=environmentFor(save.floor,"event","dungeon");
    const choice=pendingEvent.choices.find(x=>x.id===choiceId);
    if(!choice)return;
    const outcome=resolveDungeonChoice(save.heroes,save.party,save.floor,env,choice);
    setSave(s=>{
      const earnedTrait=outcome.rewardKind==="trait"&&outcome.rewardHeroId&&outcome.rewardName;
      const earnedArtifact=outcome.rewardKind==="artifact"&&outcome.rewardHeroId&&outcome.rewardName;
      const traitEffect=earnedTrait?eventTraitEffects[outcome.rewardName!]:undefined;
      const artifactEffect=earnedArtifact?eventArtifactEffects[outcome.rewardName!]:undefined;
      const nextHeroes=s.heroes.map(h=>{
        const update=outcome.heroUpdates[h.id];
        const baseT={...h.tendencies,...Object.fromEntries(Object.entries(update?.tendencies||{}).map(([k,v])=>[k,clamp(v as number)]))};
        if(earnedTrait&&h.id===outcome.rewardHeroId&&traitEffect){
          Object.entries(traitEffect.aiMods).forEach(([k,v])=>{baseT[k as keyof Tendencies]=clamp(baseT[k as keyof Tendencies]+(v||0));});
          return {...h,hp:Math.max(1,h.hp+(update?.hpDelta||0)),tendencies:baseT,traits:Array.from(new Set([...(h.traits||[]),outcome.rewardName!])).slice(0,4)};
        }
        if(earnedArtifact&&h.id===outcome.rewardHeroId&&artifactEffect){
          return {...h,hp:Math.max(1,h.hp+(update?.hpDelta||0)),tendencies:baseT,artifacts:Array.from(new Set([...(h.artifacts||[]),outcome.rewardName!])).slice(0,4)};
        }
        if(!update)return h;
        return {...h,hp:Math.max(1,h.hp+(update.hpDelta||0)),tendencies:baseT};
      });
      return {...s,
        routeMemory:recordRouteMemory(s.routeMemory,"event",true,outcome.gold),
        heroes:nextHeroes.map(h=>{
          if(h.id!==outcome.rewardHeroId||!outcome.rewardKind||!outcome.rewardName)return h;
          const detail=outcome.rewardKind==="trait"?(traitEffect?.detail||"던전 이벤트에서 획득한 특성입니다."):outcome.rewardKind==="artifact"?(artifactEffect?.detail||"던전 이벤트에서 획득한 기재입니다."):(outcome.rewardItem?.description||"던전 이벤트에서 획득한 장비입니다.");
          const records=[...(h.eventRewards||[]),{kind:outcome.rewardKind,name:outcome.rewardName,floor:s.floor,detail}].slice(-8);
          return {...h,eventRewards:records};
        }),
        items:outcome.rewardKind==="equipment"&&outcome.rewardItem?[...s.items,outcome.rewardItem]:s.items,
        gold:s.gold+outcome.gold,materials:s.materials+outcome.materials,stage:s.stage+1
      };
    });
    setPendingEvent(undefined);
    const rewardText=outcome.rewardKind==="trait"&&outcome.rewardName?" · "+outcome.rewardName+" 특성 획득":outcome.rewardKind==="artifact"&&outcome.rewardName?" · "+outcome.rewardName+" 기재 획득":outcome.rewardKind==="equipment"&&outcome.rewardItem?" · "+outcome.rewardItem.name+" 장비 획득":"";
    notify(outcome.text+rewardText+" · +"+outcome.gold+"G");
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
    {pendingEvent&&<div className="event-overlay"><div className="event-dialog"><span className="eyebrow">DUNGEON EVENT</span><h2>{pendingEvent.title}</h2><p>{pendingEvent.text}</p><div className="event-choice-list">{pendingEvent.choices.map(ch=>{const preview=eventRewardPreview(save.heroes,save.party,save.floor,environmentFor(save.floor,"event","dungeon"),ch);let recipientText=" · 이벤트 보상";if(ch.rewardKind==="trait"&&preview.trait)recipientText=" · 「"+preview.trait+"」";else if(ch.rewardKind==="artifact"&&preview.artifact)recipientText=" · 「"+preview.artifact+"」";else if(ch.rewardKind==="equipment"&&preview.equipment)recipientText=" · "+preview.equipment.name+" · "+preview.equipment.stats.slice(0,2).join(" · ");return <button key={ch.id} className="event-choice" onClick={()=>chooseDungeonEvent(ch.id)}><div><b>{ch.label}</b><small>{ch.detail}</small>{ch.rewardKind&&<small className="event-recipient">획득 대상 · {preview.recipient?.name||"파티"}{recipientText}</small>}</div><span>{ch.risk>0?"위험 "+ch.risk:"안전"} · 예상 {ch.reward}G{ch.rewardKind&&<em className="event-reward-label">{ch.rewardKind==="trait"?"특성 획득":ch.rewardKind==="artifact"?"기재 획득":"장비 획득"}</em>}</span></button>})}</div><small className="event-note">선택한 방식이 파티의 해당 성향과 이후 행동 기록에 누적되며, 일부 선택은 성향이 가장 높은 캐릭터에게 특성 또는 기재가 영구 귀속됩니다.</small></div></div>}

    {screen==="home"&&<section className="page"><div className="hero-panel"><div><span className="eyebrow">AUTONOMOUS DUNGEON</span>
      <h1>플레이어가 캐릭터를 조종하는 것이 아니라,<br/>캐릭터가 살아온 방식이 미래를 결정한다.</h1>
      <p>플레이어는 <b>파티와 장비, 다음 경로</b>를 결정한다. 전투에서는 직접 이동하거나 공격 대상을 지정하지 않는다.</p>
      <div className="hero-actions"><button className="primary-btn" onClick={()=>setScreen("dungeon")}><MapIcon size={18}/> 던전 데모 시작 <ChevronRight size={17}/></button><button className="ghost-btn" onClick={()=>setScreen("party")}><UserRound size={17}/> 파티 준비</button></div>
    </div><div className="hero-orb"><Swords size={108}/></div></div>
    <div className="feature-grid"><Feature icon={<Brain/>} title="자율 AI 전투" text="상황 + 성향 10종 + 직업 + 장비 + 경험으로 행동을 결정합니다."/><Feature icon={<Package/>} title="AI 빌드" text="장비의 수치뿐 아니라 추격·후퇴·보호 우선순위도 바뀝니다."/><Feature icon={<MapIcon/>} title="경로 선택" text="직접 이동 명령 대신 다음 방의 위험과 보상을 선택합니다."/><Feature icon={<Sparkles/>} title="행동 기록" text="반복된 행동이 성향에 조금씩 누적되어 캐릭터의 미래가 달라집니다."/></div>
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
        return <article className="evolution-card" key={species}><b>{species}</b><small>{activeLine}</small>{lineage&&<em>단계 {lineage.evolutionStage} · {lineage.evolutionPath.join(" → ")||"원형 유지"}</em>}<div>{branches.slice(0,3).map((b,i)=><span key={i}>{b.forms.join(" → ")}</span>)}</div></article>;
      })}</div>
    </div>
    <div className="demo-note"><div><b>이번 데모</b><span>던전 / 자동 실시간 전투 / AI 빌드 / 장비 / 성장 기록</span></div><div><b>제외</b><span>멸종 / 번식 / 직접 공격 명령 / 직접 이동 명령 / 수동 스킬 대상 지정</span></div></div></section>}

    {screen==="party"&&<section className="page"><div className="section-head"><div><span className="eyebrow">CHARACTERS</span><h2>원정대 구성</h2><p className="muted">전투 전에만 편성과 장비를 변경할 수 있습니다.</p></div><span className="counter">{save.party.length}/4</span></div>
      <div className="party-grid">{save.heroes.map(h=><HeroCard key={h.id} hero={h} active={save.party.includes(h.id)} onClick={()=>{setSelectedHero(h.id);toggleParty(h.id)}} onStatus={()=>{setSelectedHero(h.id);setStatusHeroId(h.id)}}/>)}</div>
      <div className="subpanel"><div><b>현재 편성</b><span>{party.map(h=>jobIcon[h.job]+" "+h.name).join(" · ")}</span></div><div className="social-summary"><span>관계는 전투를 함께할수록 강화되고, 동료를 잃으면 기억이 남습니다.</span></div><button className="primary-btn compact" onClick={()=>setScreen("dungeon")}><Swords size={16}/> 던전으로</button></div><div className="party-memory-panel"><div><span className="eyebrow">PARTY MEMORY</span><b>파티 집단 기억</b><p>개별 캐릭터의 습관과 별개로, 함께 싸운 경험이 보호·회복·생존 판단에 남습니다.</p></div><div className="party-memory-metrics"><span><strong>{save.partyMemory?.battles||0}</strong>협동 전투</span><span><strong>{save.partyMemory?.protection||0}</strong>보호 행동</span><span><strong>{save.partyMemory?.recovery||0}</strong>회복 행동</span><span><strong>{save.partyMemory?.losses||0}</strong>패배 경험</span></div><small>{partyMemorySummary(save.partyMemory)}</small></div>
      <div className="synergy-panel"><div className="synergy-head"><div><span className="eyebrow">TACTICAL LINKS</span><b>현재 파티 전술 연계</b><small>관계와 직업 조합을 기준으로 실제 전투에서 연결될 가능성이 높은 동료 조합입니다.</small></div><span>{partyTacticalLinks(party).length}개 링크</span></div><div className="synergy-list">{partyTacticalLinks(party).length===0?<span className="quick-empty">파티에 등록된 동료가 부족합니다.</span>:partyTacticalLinks(party).map((link,i)=><div className="synergy-card" key={link.a.id+"-"+link.b.id}><div className="synergy-pair"><strong>{jobIcon[link.a.job]} {link.a.name}</strong><b>↔</b><strong>{jobIcon[link.b.job]} {link.b.name}</strong></div><div className="synergy-meter"><span style={{width:link.strength+"%"}}/></div><div className="synergy-meta"><span>연계 강도 {link.strength}</span><em>{link.detail}</em></div></div>)}</div></div>
      <div className="forecast-panel"><div className="forecast-head"><div><span className="eyebrow">AI FORECAST</span><b>{hero.name}의 다음 행동 예상</b><small>현재 성향·장비·장기 습관·파티 기억을 기준으로 계산한 참고용 예상입니다. 실제 전투에서는 상황에 따라 달라집니다.</small></div><span>상위 4개</span></div><div className="forecast-list">{actionForecast(hero,party,save.partyMemory).map((x,i)=><div className="forecast-row" key={x.action}><div className="forecast-rank">{i+1}</div><div className="forecast-main"><div><b>{x.action}</b><span>{Math.round(x.score)}점</span></div><small>{x.detail}</small><div className="forecast-track"><span style={{width:Math.min(100,Math.round(x.score))+"%"}}/></div></div></div>)}</div></div>
      <div className="character-equipment-panel">
        <div className="character-equipment-head">
          <div><span className="eyebrow">CHARACTER EQUIPMENT</span><b>캐릭터별 장비창</b><small>캐릭터를 선택하고 5개 슬롯을 관리합니다. 아래 인벤토리는 현재 선택한 캐릭터와 바로 연결됩니다.</small></div>
          <button className="ghost-btn" onClick={()=>setScreen("inventory")}><Package size={15}/> 인벤토리 열기</button>
        </div>
        <div className="character-selector">{save.heroes.map(h=><button key={h.id} className={"character-selector-card "+(selectedHero===h.id?"active":"")} onClick={()=>{setSelectedHero(h.id);setSelectedEquipSlot(0);setSelectedWarehouseItem(undefined)}}>
          <span className="hero-avatar mini" style={{background:h.color}}>{jobIcon[h.job]}</span>
          <span><b>{h.name}</b><small>{jobKo[h.job]} · Lv.{h.level}</small></span>
          <em>{equippedItemsOf(h).length}/5</em>
        </button>)}</div>
        <div className="character-equipment-layout">
          <div className="character-equipment-sheet">
            <div className="character-equipment-identity"><div className="hero-avatar large" style={{background:hero.color}}>{jobIcon[hero.job]}</div><div><b>{hero.name}</b><span>{jobKo[hero.job]} · {promotionLabel(hero)}</span><small>AI 빌드 · {buildProfile(hero).name}</small></div></div>
            <div className="character-equipment-stats"><span><small>공격</small><b>{Math.round(heroCombatStats.attack)}</b></span><span><small>방어</small><b>{Math.round(heroCombatStats.defense)}</b></span><span><small>HP</small><b>{Math.round(heroCombatStats.maxHp)}</b></span><span><small>속도</small><b>{Math.round(heroCombatStats.speed*100)/100}</b></span></div>
            <div className="character-equipment-slots">{[0,1,2,3,4].map(slot=>{const item=equipmentSlotsOf(hero)[slot];return <div key={slot} className={"character-equipment-slot "+(selectedEquipSlot===slot?"active":"")}><button onClick={()=>setSelectedEquipSlot(slot)}><span>SLOT {slot+1}</span><strong>{item?.name||"장비 없음"}</strong><small>{item?item.rarity+" · Lv."+item.level:"인벤토리에서 장착"}</small></button>{item&&<button className="ghost-btn" onClick={()=>unequip(slot)}>해제</button>}</div>})}</div>
          </div>
          <div className="character-equipment-inventory">
            <div className="character-inventory-head"><div><b>{hero.name} 인벤토리</b><span>선택 슬롯 · {selectedEquipSlot+1} · 아이콘 클릭으로 장착</span></div><span>{save.items.length}/60</span></div>
            {save.items.length===0?<div className="quick-empty">인벤토리가 비어 있습니다. 전투 전리품과 보물방에서 장비를 획득하세요.</div>:<div className="character-inventory-grid">{save.items.map((item,idx)=><InventoryIcon item={item} key={item.id+"-"+idx} onEquip={()=>equip(item,selectedEquipSlot)}/>)}</div>}
          </div>        </div>
      </div>
      <div className="tendency-panel"><div className="tendency-head"><div><span className="eyebrow">AI PERSONALITY</span><b>{hero.name}의 현재 AI 성향</b><small>기본 성향과 장착 장비의 AI 보정을 합산한 실제 전투 판단 기준입니다.</small></div><span className="tendency-build">{buildProfile(hero).name}</span></div><div className="tendency-grid">{(Object.keys(tendencyKo) as (keyof Tendencies)[]).map(k=>{const mod=combinedAiMods(equippedItemsOf(hero))[k]||0;const value=clamp(hero.tendencies[k]+mod);const modText=mod===0?"기본 성향":"기본 "+Math.round(hero.tendencies[k])+" · 장비 "+(mod>0?"+":"")+Math.round(mod*10)/10;return <div className="tendency-row" key={k}><div className="tendency-label"><span>{tendencyKo[k]}</span><strong>{Math.round(value)}</strong></div><div className="tendency-track"><span style={{width:value+"%"}}/></div><small>{modText}</small></div>})}</div></div>
      <div className="memory-panel"><div><b>{hero.name}의 최근 기억</b><span>최근 전투에서 강하게 남은 경험이 다음 판단에 영향을 줍니다.</span></div><div className="memory-list">{(hero.memories||[]).slice(0,4).map((m,i)=><em key={i}>{m.text} · 영향 {Math.round(m.weight*10)/10}</em>)}</div></div><div className="costume-panel"><div><b>직업별 코스튬</b><span>{costumeLabel(hero.job,hero.costumeId)}</span></div><div className="costume-grid">{costumesForJob(hero.job).map(c=><button key={c.id} className={"costume-card "+c.tier+(hero.costumeId===c.id?" equipped":"")} onClick={()=>equipCostume(c.id)}><small>{c.tier}</small><b>{c.name.split(" · ")[1]}</b><span>{c.description}</span></button>)}</div></div></section>}

    {screen==="recruit"&&<section className="page"><div className="section-head"><div><span className="eyebrow">RECRUITMENT</span><h2>용사 모집란</h2><p className="muted">기초직업 5종의 신규 용사를 지속적으로 모집할 수 있습니다. 모집비 350 골드.</p></div><span className="counter">{save.heroes.length}명</span></div><div className="recruit-panel"><div><b>기초직업 모집</b><span>모집된 용사는 Lv.1에서 시작하며 기본 직업과 서로 다른 초기 성향을 가집니다.</span></div><div className="recruit-grid">{(Object.keys(jobKo) as Job[]).map(j=><article className="recruit-card" key={j}><div className="room-icon">{jobIcon[j]}</div><b>{jobKo[j]}</b><p>기초 직업 · 장기 성향이 성장하며 자동 전직합니다.</p><button className="primary-btn compact" disabled={save.gold<350} onClick={()=>recruit(j)}><UserPlus size={15}/> 모집 350G</button></article>)}</div></div><div className="subpanel"><div><b>모집 원칙</b><span>신규 용사의 미래는 실제 행동과 경험이 결정합니다.</span></div><button className="primary-btn compact" onClick={()=>setScreen("party")}><UserRound size={16}/> 캐릭터 보기</button></div></section>}

    {screen==="dungeon"&&<section className="page"><div className="section-head"><div><span className="eyebrow">DUNGEON</span><h2>{save.floor}F · 다음 방 선택</h2><p className="muted">경로만 선택할 수 있습니다. 전투가 시작되면 AI가 전부 결정합니다.</p></div><button className="ghost-btn" onClick={()=>setScreen("party")}><UserRound size={16}/> 파티 수정</button></div>
      <div className="progress-strip">{Array.from({length:6},(_,i)=><div key={i} className={"progress-node "+(i<save.stage?"done":i===save.stage?"current":"")}><span>{i<save.stage?"✓":i+1}</span><small>{i===5?"BOSS":"ROOM "+(i+1)}</small></div>)}</div>
      {Object.keys(save.scenarioClears).length>0&&<div className="repeat-panel"><div><b>완료 시나리오 재도전</b><span>성장을 위해 완료한 시나리오를 반복할 수 있습니다. 반복할수록 보상이 감소하고 25% 확률로 정예 몬스터 무리가 등장합니다.</span></div><div className="repeat-list">{Object.keys(save.scenarioClears).sort((a,b)=>Number(b)-Number(a)).map(k=>{const n=save.scenarioClears[k];const mult=Math.max(.3,.6-.1*Math.max(0,n-1));return <button key={k} className="repeat-card" onClick={()=>startRepeat(Number(k))}><b>{k}F 시나리오</b><span>클리어 {n}회 · 다음 보상 {Math.round(mult*100)}%</span><ChevronRight size={16}/></button>})}</div></div>}
      <div className="route-grid">{route(save.stage,save.floor,party.length?party.reduce((n,h)=>n+h.tendencies.curiosity,0)/party.length:0).map((r,i)=>{const f=routeForecast(r.kind,save.floor,party,save.routeMemory);return <button key={i} className={"route-card room-"+r.kind} onClick={()=>start(r.kind)}><div className="room-icon">{roomIcon[r.kind]}</div><div><small>{roomKo[r.kind]}</small><h3>{r.title}</h3><p>{r.summary}</p><div className="route-intel"><span>위험 {f.risk}</span><span>예상 보상 {f.reward}G</span><span>적합도 {f.fit}</span><span>{environmentInfo[f.environment].name}</span><span>경험 {f.experience}회{f.experience>0?" · 성공 "+f.successRate+"%":""}</span></div></div><ChevronRight size={20}/></button>})}</div>
      {Object.entries(save.routeMemory||{}).filter(([,m])=>m.attempts>0).length>0&&<div className="route-memory-panel"><div><span className="eyebrow">DUNGEON MEMORY</span><b>던전 경로 기억</b><small>같은 종류의 방을 실제로 경험한 결과가 다음 예측에 조금씩 반영됩니다.</small></div><div className="route-memory-list">{Object.entries(save.routeMemory||{}).filter(([,m])=>m.attempts>0).sort((a,b)=>b[1].attempts-a[1].attempts).slice(0,6).map(([kind,m])=><div className="route-memory-row" key={kind}><strong>{roomKo[kind as RoomKind]}</strong><span>경험 {m.attempts}회</span><span>성공 {Math.round(m.clears/m.attempts*100)}%</span>{m.rewardSamples>=2&&<span>실측 보상 {Math.round(m.rewardGold/m.rewardSamples)}G</span>}</div>)}</div></div>}
      <div className="dungeon-meta"><div><b>현재 파티</b>{party.map(h=><span key={h.id}>{jobIcon[h.job]} {h.name}</span>)}</div><div><b>대서사의 목표</b><span>{save.worldSealed?"세계의 구멍 봉인 완료":"동굴을 돌파해 악의 동굴을 찾고 세계의 구멍을 봉인하세요."}</span></div></div></section>}

    {screen==="battle"&&<section className="page"><div className="battle-header"><div><span className="eyebrow">{roomKo[battle.room]}</span><h2>{battle.room==="evilCave"?"악의 동굴 · 세계의 구멍":battle.room==="boss"?"심층 관문":battle.repeatScenarioFloor!==undefined?"시나리오 재도전":"자동 전투 진행 중"}</h2><p className="muted">전투 명령 없음 · 일시정지와 재생 속도만 조절할 수 있습니다.</p></div>
      <div className="battle-tools"><button className="ghost-btn" onClick={()=>setPaused(x=>!x)}>{paused?<CirclePlay size={17}/>:<CirclePause size={17}/>} {paused?"재생":"일시정지"}</button>{[.5,1,2,4].map(x=><button key={x} className={speed===x?"speed-on":"speed-btn"} onClick={()=>setSpeed(x)}>{x}x</button>)}</div></div>
      <div className="battle-summary-strip">
        <span>MODE · {battle.repeatScenarioFloor!==undefined?"SCENARIO REPLAY":battle.mode==="defense"?"DEFENSE":battle.mode==="raid"?"BOSS RAID":"DUNGEON"}</span><span>진형 · {formationLabel(party,battle.mode)}</span>{battle.plan&&<span>방침 · {battle.plan.label}</span>}{battle.repeatScenarioFloor!==undefined&&<><span>재도전 · {battle.repeatScenarioFloor}F</span><span>반복 {battle.repeatCount}회</span><span>보상 {Math.round((battle.rewardMultiplier||1)*100)}%</span>{battle.elitePack&&<span>정예 무리 출현</span>}</>}
        {battle.mode==="defense"&&<><span>목표 · {defenseObjectiveKo[battle.objectiveKind||"gate"]}</span><span>{defenseObjectiveDetail[battle.objectiveKind||"gate"]}</span><span>WAVE {battle.wave}</span><span>목표 내구도 {battle.objectiveHp}%</span><span>남은 시간 {Math.max(0,Math.ceil(((battle.deadline||Date.now())-Date.now())/1000))}초</span></>}
        {battle.mode==="raid"&&<><span>보스 · {battle.units.find(u=>u.team==="enemy"&&u.grade==="Boss")?.name||"—"}</span><span>PHASE {battle.phase}</span><span>종족 전용 패턴 · {battle.units.find(u=>u.team==="enemy"&&u.grade==="Boss")?.species||"—"}</span></>}
        {battle.environment&&<span>환경 · {environmentInfo[battle.environment].name}</span>}
      </div>
      {battle.phaseNotice&&<div className="phase-banner">{battle.phaseNotice}</div>}
      {battle.environment&&<div className="environment-note"><b>{environmentInfo[battle.environment].name}</b><span>{environmentInfo[battle.environment].detail}</span></div>}
      <div className="battle-layout"><div className="cave-panel"><div className="cave-label"><span>입구</span><span>심층</span></div><div className="cave-lane"><div className="cave-floor"/>
        {battle.units.map(u=><div key={u.id} className={"battle-unit "+u.team+" "+(u.alive?"":"dead")+" "+(active?.id===u.id?"active-unit":"")+" "+(u.fxKind?"fx-"+u.fxKind:"")} style={{left:(u.pos*9.3)+"%"}}>
          <div className="unit-token">{u.team==="player"?jobIcon[u.job!]:u.grade==="Boss"?"♛":"👹"}{u.team==="enemy"&&<span className={"monster-level-badge grade-"+String(u.grade||"Normal").toLowerCase()}>Lv.{u.level||1}</span>}</div><b>{u.name}</b>{u.team==="enemy"&&<small className="monster-meta">{u.species} · {u.grade||"Normal"}</small>}{u.mutation&&<small className="mutation-label">{u.mutation}</small>}{u.fx&&<span className="combat-fx">{u.fx}</span>}<div className="hp-bar"><span style={{width:(100*pct(u))+"%"}}/></div><small>{Math.max(0,Math.round(u.hp))}/{u.maxHp}</small></div>)}
      </div><div className="battle-status">{battle.ended?<><Trophy size={17}/> {battle.result==="victory"?"승리 · 성장 기록 반영":"패배 · 원정 종료"}</>:<><Zap size={16}/> ROUND {battle.round} · {active?.name||"AI 계산"}</>}</div></div>
      <aside className="ai-panel"><div className="panel-title"><Brain size={18}/> AI 판단 실시간</div><div className="ai-focus"><small>현재 판단 주체</small><b>{active?.name||"—"}</b><span>{active?.job?jobKo[active.job]:active?.species||"—"}</span></div><div className="decision-box">{battle.plan&&<><b>{battle.plan.label}</b><span> · {battle.plan.detail}</span><br/></>}{decision}</div><h4>전투 로그</h4><div className="combat-log">{battle.log.map((x,i)=><div key={i}>{x}</div>)}</div><div className="inspect-box"><small>선택 캐릭터</small><b>{hero.name}</b><span>{jobKo[hero.job]} · Lv.{hero.level} · {promotionLabel(hero)} · 장비 {equippedItemsOf(hero).length}/5</span><small>기억 {hero.memories?.length||0} · 관계 {Object.keys(hero.relationships||{}).length}</small><small>{behaviorSummary(hero)}</small><small>장기 전투 습관 · {profileInsight(hero)}</small><div className="tag-row">{tags(hero).map(t=><em key={t}>{t}</em>)}</div></div></aside></div>
      {battle.ended&&<div className="result-panel"><div className={"result-icon "+(battle.result==="victory"?"win":"lose")}>{battle.result==="victory"?"✓":"×"}</div><div><small>{battle.result==="victory"?"원정대 생존":"전멸"}</small><h3>{battle.result==="victory"?"다음 방으로":"원정 종료"}</h3><p>{battle.result==="victory"?"전투에서 쌓인 행동 기록과 경험이 캐릭터에 반영됩니다.":"다시 던전에 들어가 같은 파티를 시험할 수 있습니다."}</p><div className="battle-report"><b>AI 전투 리포트</b><div className="battle-report-grid">{battle.units.filter(u=>u.team==="player").map(u=><div className="report-card" key={u.id}><strong>{u.name}</strong><span>행동 {u.battleStats?.actions||0}회</span><span>피해 {u.battleStats?.damage||0}</span><span>회복 {u.battleStats?.healing||0}</span><small>{Object.entries(u.behaviorCounts||{}).sort((x,y)=>y[1]-x[1]).slice(0,2).map(x=>x[0]).join(" · ")||"기록 없음"}</small></div>)}</div></div>{battle.result==="victory"&&lastLoot.length>0&&<div className="loot-summary"><b>획득 전리품</b><span>{lastLoot.map(x=>x.name).join(" · ")}</span></div>}</div><button className="primary-btn" onClick={()=>{if(battle.result==="victory"&&battle.room==="evilCave"){sealWorld();return;}setScreen("dungeon");setBattle(b=>({...b,ended:false,result:undefined}));}}>{battle.result==="victory"&&battle.room==="evilCave"?"세계의 구멍 봉인":battle.result==="victory"?"경로 선택":"다시 시작"} <ChevronRight size={17}/></button></div>}</section>}

    {screen==="inventory"&&(()=>{const filtered=save.items.filter(i=>warehouseTab==="all"||i.slot===warehouseTab);const rarityRank:Record<string,number>={신화:5,전설:4,영웅:3,희귀:2,일반:1};const sorted=filtered.slice().sort((a,b)=>warehouseSort==="level"?b.level-a.level:warehouseSort==="rarity"?(rarityRank[b.rarity]||0)-(rarityRank[a.rarity]||0):0);return <section className="page"><div className="section-head"><div><span className="eyebrow">GUILD WAREHOUSE · INVENTORY</span><h2>용사단 인벤토리</h2><p className="muted">아이콘 중심으로 간소화했습니다. 커서를 올리면 이름·희귀도·스탯·AI 보정·설명이 표시되고, 클릭하면 현재 선택 슬롯에 장착됩니다.</p></div><span className="counter">{save.items.length} / 60</span></div>
      <div className="warehouse-toolbar"><div className="warehouse-tabs">{([["all","전체"],["weapon","무기"],["armor","방어구"],["ring","반지"],["accessory","장신구"]] as const).map(([key,label])=><button key={key} className={warehouseTab===key?"warehouse-tab active":"warehouse-tab"} onClick={()=>setWarehouseTab(key)}>{label}<small>{key==="all"?save.items.length:save.items.filter(i=>i.slot===key).length}</small></button>)}</div><div className="warehouse-sort"><span>정렬</span>{([["recent","최근"],["level","레벨"],["rarity","희귀도"]] as const).map(([key,label])=><button key={key} className={warehouseSort===key?"sort-btn active":"sort-btn"} onClick={()=>setWarehouseSort(key)}>{label}</button>)}</div></div>
      <div className="warehouse-target-panel"><div><b>장착 대상 캐릭터</b><span>캐릭터를 선택한 뒤 장비 아이콘을 클릭</span></div><div className="warehouse-targets">{save.heroes.map(h=><button key={h.id} className={"warehouse-target "+(selectedHero===h.id?"active":"")} onClick={()=>{setSelectedHero(h.id);setSelectedEquipSlot(0)}}><span className="warehouse-target-avatar" style={{background:h.color}}>{jobIcon[h.job]}</span><span><b>{h.name}</b><small>{jobKo[h.job]} · {equippedItemsOf(h).length}/5</small></span></button>)}</div></div>
      <div className="warehouse-equipment-strip"><div className="warehouse-strip-head"><div><b>{hero.name} 장비창</b><span>5칸 · 선택 슬롯 {selectedEquipSlot+1}</span></div><button className="ghost-btn" onClick={()=>setSelectedEquipSlot((selectedEquipSlot+1)%5)}>다음 슬롯</button></div><div className="equipment-slots compact-five">{[0,1,2,3,4].map(slot=>{const item=equipmentSlotsOf(hero)[slot];return <div key={slot} className={"equipment-slot "+(selectedEquipSlot===slot?"selected":"")}><button onClick={()=>setSelectedEquipSlot(slot)} className="slot-main"><small>SLOT {slot+1}</small><b>{item?.name||"장비 없음"}</b><span>{item?item.rarity+" · Lv."+item.level:"아이콘을 선택해 장착"}</span></button>{item&&<button className="ghost-btn slot-action" onClick={()=>unequip(slot)}>해제</button>}</div>})}</div></div>
      <div className="warehouse-icon-grid">{sorted.length===0?<div className="subpanel empty-warehouse"><b>해당 카테고리에 장비가 없습니다.</b><span>전투 전리품과 보물방에서 장비를 획득하세요.</span></div>:sorted.map((item,idx)=><InventoryIcon item={item} key={item.id+"-"+idx} warehouse onEquip={()=>equip(item,selectedEquipSlot)} onSell={()=>sellItem(item)}/>)}</div>
    </section>})()}
    {statusHeroId&&save.heroes.find(h=>h.id===statusHeroId)&&<CharacterStatusModal heroes={save.heroes} hero={save.heroes.find(h=>h.id===statusHeroId)!} onClose={()=>setStatusHeroId(undefined)} onNavigate={id=>setStatusHeroId(id)}/>}
    <footer><span>Prototype · autonomous dungeon AI</span><button onClick={reset}><RotateCcw size={14}/> 초기화</button></footer>
  </main>;
}

function CharacterStatusModal({hero,heroes,onClose,onNavigate}:{hero:Hero;heroes:Hero[];onClose:()=>void;onNavigate:(id:string)=>void}){
  const stats=combatStats(hero);
  const bonus=chronicleBonuses(hero);
  const growth=promotionForecast(hero);
  const items=equippedItemsOf(hero);
  const aiMods=combinedAiModsWithArtifacts(items,hero.artifacts||[]);
  const index=Math.max(0,heroes.findIndex(h=>h.id===hero.id));
  const prev=heroes[index-1];
  const next=heroes[index+1];
  return <div className="status-modal-backdrop" onClick={onClose}>
    <section className="status-modal" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}>
      <div className="status-modal-head"><div className="status-modal-title-row"><button className="status-nav-btn" disabled={!prev} onClick={()=>prev&&onNavigate(prev.id)} aria-label="이전 캐릭터">‹</button><div><span className="eyebrow">CHARACTER STATUS</span><h2>{hero.name}</h2><p>{jobKo[hero.job]} · {promotionLabel(hero)} · Lv.{hero.level} · {buildProfile(hero).name}</p></div><button className="status-nav-btn" disabled={!next} onClick={()=>next&&onNavigate(next.id)} aria-label="다음 캐릭터">›</button></div><div className="status-modal-actions"><span>{index+1} / {heroes.length}</span><button className="ghost-btn" onClick={onClose}>닫기</button></div></div>
      <div className="status-modal-grid">
        <div className="status-modal-card"><div className="modal-card-title"><b>기본 스탯</b><span>기본값 → 적용값</span></div><div className="modal-stat-grid">{([["HP",Math.round(hero.hp),Math.round(stats.maxHp)],["공격",Math.round(hero.attack),Math.round(stats.attack)],["방어",Math.round(hero.defense),Math.round(stats.defense)],["속도",Math.round(hero.speed*100)/100,Math.round(stats.speed*100)/100],["사거리",Math.round(hero.range*100)/100,Math.round(stats.range*100)/100],["경험",hero.experience+"/100",hero.experience+"/100"]] as [string,string|number,string|number][]).map(x=><div key={x[0]}><small>{x[0]}</small><b>{x[1]}</b>{String(x[1])!==String(x[2])&&<span>→ {x[2]}</span>}</div>)}</div><div className="modal-note">연대기 가산 · 공격 +{bonus.attack||0} · 방어 +{bonus.defense||0} · HP +{bonus.hpPct||0}% · 속도 +{bonus.speedPct||0}%</div></div>
        <div className="status-modal-card"><div className="modal-card-title"><b>AI 성향</b><span>{buildProfile(hero).name}</span></div><div className="modal-tendency-grid">{(Object.keys(tendencyKo) as (keyof Tendencies)[]).map(k=>{const value=clamp(hero.tendencies[k]+(aiMods[k]||0));return <div key={k}><span>{tendencyKo[k]}</span><b>{Math.round(value)}</b><i><em style={{width:value+"%"}}/></i></div>})}</div></div>
        <div className="status-modal-card"><div className="modal-card-title"><b>성장 전망</b><span>{growth.next}</span></div><div className="growth-level"><div><b>Lv.{hero.level}</b><span>/ {growth.level}</span></div><i><em style={{width:growth.progress+"%"}}/></i></div><p className="growth-reason">{growth.reason}</p><div className="growth-now"><span><b>현재 전직</b>{promotionLabel(hero)}</span><span><b>주요 성향</b>{(Object.entries(hero.tendencies) as [keyof Tendencies,number][]).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>tendencyKo[x[0]]+" "+Math.round(x[1])).join(" · ")}</span></div></div>
        <div className="status-modal-card"><div className="modal-card-title"><b>캐릭터 특성</b><span>{(hero.traits||[]).length}/4</span></div><div className="modal-traits">{(hero.traits||[]).map(name=><div key={name}><b>{name}</b><span>{eventTraitEffects[name]?.detail||growthTraitCatalog[name]?.detail||"던전에서 얻은 고유 특성입니다."}</span></div>)}</div></div>
        <div className="status-modal-card"><div className="modal-card-title"><b>던전 획득 기록</b><span>최근 8회</span></div><div className="modal-event-rewards">{(hero.eventRewards||[]).slice().reverse().map((r,i)=><div key={r.name+"-"+r.floor+"-"+i}><span>{r.kind==="trait"?"특성":r.kind==="artifact"?"기재":"장비"} · {r.floor}F{r.source?" · "+r.source:""}</span><b>{r.name}</b><small>{r.detail}</small></div>)}{(!hero.eventRewards||hero.eventRewards.length===0)&&<small>던전 이벤트에서 획득한 특성·기재·장비 기록이 여기에 남습니다.</small>}</div></div>
        <div className="status-modal-card"><div className="modal-card-title"><b>장비 · 특성 · 기재</b><span>{items.length}/5 장착</span></div><div className="modal-equipment">{[0,1,2,3,4].map(slot=><div key={slot}><small>SLOT {slot+1}</small><b>{items[slot]?.name||"장비 없음"}</b><span>{items[slot]?(items[slot].rarity+" · Lv."+items[slot].level):"비어 있음"}</span></div>)}</div><div className="modal-collection"><div><small>특성</small><b>{(hero.traits||[]).join(" · ")||"없음"}</b></div><div><small>기재</small>{(hero.artifacts||[]).length===0?<b>없음</b>:<div className="modal-artifact-list">{(hero.artifacts||[]).map(name=>{const effect=eventArtifactEffects[name]||growthArtifactCatalog[name];const ai=Object.entries(effect?.aiMods||{}).map(([k,v])=>tendencyKo[k as keyof Tendencies]+" +"+v).join(" · ");const combat=Object.entries(effect?.combatMods||{}).map(([k,v])=>(k==="attack"?"공격 +"+v:k==="defense"?"방어 +"+v:k==="hpPct"?"HP +"+v+"%":k==="speedPct"?"속도 +"+v+"%":k==="range"?"사거리 +"+v:k==="healPct"?"치유 +"+v+"%":k==="critPct"?"치명타 +"+v+"%":k+" +"+v)).join(" · ");return <div key={name}><b>{name}</b><small>{effect?.detail||"던전 이벤트에서 얻은 고유 기재입니다."}</small>{ai&&<em>AI · {ai}</em>}{combat&&<em>전투 · {combat}</em>}</div>})}</div>}</div></div><div className="modal-state-grid"><span><b>기분</b>{systemMood(hero)}</span><span><b>상태</b>{systemStatus(hero)}</span><span><b>평가</b>{systemEvaluation(hero)}</span></div></div>
      </div>
      <div className="status-modal-bottom"><div className="modal-bottom-card"><b>장기 전투 기록</b><span>{hero.combatProfile?.battles||0}전투 · {hero.combatProfile?.actions||0}행동 · {hero.combatProfile?.damage||0}피해 · {hero.combatProfile?.healing||0}회복</span><small>{Object.entries(hero.combatProfile?.topActions||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]+" · "+x[1]+"회").join("  /  ")||"기록 없음"}</small></div><div className="modal-bottom-card"><b>최근 기억</b><span>{(hero.memories||[]).slice(0,2).map(m=>m.text+" · 영향 "+Math.round(m.weight*10)/10).join("  /  ")||"강하게 남은 기억 없음"}</span><small>칭호 · {chronicleLabel(hero)}</small></div></div>
    </section>
  </div>;
}
function InventoryIcon({item,onEquip,onSell,warehouse=false}:{item:Item;onEquip:()=>void;onSell?:()=>void;warehouse?:boolean}){
  const icon=item.slot==="weapon"?"⚔":item.slot==="armor"?"🛡":item.slot==="ring"?"◈":"✦";
  const ai=Object.entries(item.aiMods);
  const combat=Object.entries(item.combatMods||{});
  const combatLabel=combat.map(([k,v])=>k==="attack"?"공격 +"+v:k==="defense"?"방어 +"+v:k==="hpPct"?"HP +"+v+"%":k==="speedPct"?"속도 +"+v+"%":k==="range"?"사거리 +"+v:k==="healPct"?"치유 +"+v+"%":k==="critPct"?"치명타 +"+v+"%":k+" +"+v).join(" · ");
  return <div className="inventory-icon-wrap">
    <button className={"inventory-icon "+(warehouse?"warehouse-icon ":"")+(item.unique?"unique":"")} onClick={onEquip} aria-label={item.name+" 장착"}>
      <span>{icon}</span><small>Lv.{item.level}</small>{item.unique&&<b>U</b>}
      <span className="item-tooltip-card" role="tooltip">
        <span className="item-tooltip-head"><b>{item.name}</b>{item.unique&&<em>UNIQUE</em>}</span>
        <span className="item-tooltip-sub">{item.rarity} · {item.slot} · Lv.{item.level}</span>
        <span className="item-tooltip-stats">{item.stats.map(stat=><i key={stat}>{stat}</i>)}</span>
        {combatLabel&&<span className="item-tooltip-combat">{combatLabel}</span>}
        {ai.length>0&&<span className="item-tooltip-ai">AI · {ai.map(([k,v])=>tendencyKo[k as keyof Tendencies]+" "+((v||0)>0?"+":"")+(v||0)).join(" · ")}</span>}
        <span className="item-tooltip-desc">{item.description}</span>
        <span className="item-tooltip-tip">클릭 · 현재 선택 슬롯에 장착</span>
      </span>
    </button>
    {warehouse&&onSell&&<button className="inventory-sell" onClick={onSell} aria-label={item.name+" 판매"}>×</button>}
  </div>;
}
function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <article className="feature-card"><div className="feature-icon">{icon}</div><b>{title}</b><p>{text}</p></article>;}
function HeroCard({hero,active,onClick,onStatus}:{hero:Hero;active:boolean;onClick:()=>void;onStatus:()=>void}){
  const bond=strongestBond(hero);
  const bondName=heroesSeed.find(h=>h.id===bond?.id)?.name||"동료";
  return <article className={"hero-card "+(active?"hero-selected":"")} onClick={onClick}>
    <div className="hero-avatar" style={{background:hero.color}}>{jobIcon[hero.job]}</div>
    <div className="hero-card-main">
      <div className="name-row"><b>{hero.name}</b><span>Lv.{hero.level}</span></div>
      <p>{jobKo[hero.job]} · {promotionLabel(hero)} · 경험 {hero.experience}/100</p>
      <div className="tag-row">{tags(hero).map(t=><em key={t}>{t}</em>)}</div>
      <small>장비 · {equippedItemsOf(hero).map(x=>x.name).join(" · ")||"없음"} ({equippedItemsOf(hero).length}/5)</small><small>특성 · {(hero.traits||[]).join(" · ")||"없음"}</small><small>기재 · {(hero.artifacts||[]).join(" · ")||"없음"}</small><small>코스튬 · {costumeLabel(hero.job,hero.costumeId)}</small>
      <small>{behaviorSummary(hero)}</small><small>AI 빌드 · {buildProfile(hero).name} · {buildProfile(hero).detail}</small>
      <div className="social-meta">{bond&&<span>유대 · {bondName} {Math.round(bond.relation.bond)}</span>}<span>{bond?"전술 링크 · "+(bond.relation.bond>=25?"활성":"형성 중"):"전술 링크 · 미형성"}</span><span>기억 {hero.memories?.length||0}</span></div>
      <button className="ghost-btn hero-status-btn" onClick={e=>{e.stopPropagation();onStatus();}}>상태 보기</button>
    </div>
    <ChevronRight size={17}/>
  </article>;
}
function tags(h:Hero){const mod=combinedAiModsWithArtifacts(equippedItemsOf(h),h.artifacts||[]);const ks=(Object.keys(tendencyKo) as (keyof Tendencies)[]).sort((a,b)=>(h.tendencies[b]+(mod[b]||0))-(h.tendencies[a]+(mod[a]||0)));return ks.slice(0,3).map(k=>tendencyKo[k]+" "+((h.tendencies[k]+(mod[k]||0))>=80?"높음":(h.tendencies[k]+(mod[k]||0))>=60?"중상":"보통"));}
function ItemCard({item,equipped,onEquip,onSell}:{item:Item;equipped?:boolean;onEquip?:()=>void;onSell?:()=>void}){return <article className={"item-card "+(item.unique?"unique-item":"")}><div className="item-top"><span>{item.rarity}</span>{item.unique&&<b>UNIQUE</b>}</div><h3>{item.name}</h3><small>{item.slot} · Lv.{item.level}</small><div className="stat-list">{item.stats.map(s=><span key={s}>{s}</span>)}</div><div className="ai-mod"><Brain size={14}/>{Object.entries(item.aiMods).map(([k,v])=><span key={k}>{tendencyKo[k as keyof Tendencies]} {(v||0)>0?"+":""}{v}</span>)}</div><p>{item.description}</p><div className="item-actions">{onEquip&&<button className="ghost-btn" onClick={onEquip}>{equipped?"장착 중":"장착"}</button>}{onSell&&<button className="ghost-btn danger-btn" onClick={onSell}>판매</button>}</div></article>;}


function ModeCard({title,subtitle,text,icon,onClick}:{title:string;subtitle:string;text:string;icon:string;onClick:()=>void}){
  return <button className="mode-card" onClick={onClick}><div className="mode-glyph">{icon}</div><div><small>{title}</small><b>{subtitle}</b><span>{text}</span></div><ChevronRight size={18}/></button>;
}
