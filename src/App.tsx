
import { useEffect, useMemo, useState } from "react";
import { Brain, ChevronRight, CirclePause, CirclePlay, Coins, Heart, Map as MapIcon, Package, RotateCcw, Shield, Sparkles, Swords, Trophy, UserPlus, UserRound, Zap } from "lucide-react";
import { cloneTendencies, createMonster, defaultTendencies, heroesSeed, randomGeneralItem, uniqueLootCopy, createRecruitHero, rollBattleLoot, type BattleUnit, type Hero, type Item, type Job, type RoomKind, type Tendencies, type StatusEffect, type StatusEffectKind, uniqueItems } from "./dungeonData";
import { choosePromotion, grantExperience, promotionActions, promotionForecast, promotionLabel, promotionOptions, promotionPassive, xpRequiredForLevel } from "./promotion";
import { bondAfterBattle, decayMemories, relationshipFromMap, strongestBond } from "./relationships";
import { applyLineage, applyMonsterPromotion, emptyLineage, evolutionActionBonus, evolutionHint, monsterEvolutionTrees, recordLineage } from "./monsterEvolution";
import type { MonsterLineage } from "./dungeonData";
import { monsterActions } from "./monsterAbilities";
import { dungeonChoiceEvent, resolveDungeonChoice, resolveDungeonEvent, resolveHiddenRoom, eventTraitEffects, eventArtifactEffects, eventRewardPreview, type DungeonChoiceEvent } from "./dungeonEvents";
import { applyBehaviorHistory, behaviorSummary, buildProfile, habitBias, partyHabitBias, partyMemorySummary, partyPreference, partyTacticalLinks, profileInsight, type PartyMemory } from "./progression";
import { awardChronicle, chronicleBonuses, chronicleLabel, systemEvaluation, systemMood, systemStatus } from "./chronicle";
import { costumesForJob, ownedCostumeCombatBonus, ownedCostumePassive, costumePassive, skinCost, skinLabel, skinUnlockText, skinVisual, skinTheme, costumeStatLabels } from "./costumes";
import { environmentDecisionBonus, environmentFor, environmentInfo, environmentTick, type EnvironmentKind } from "./dungeonEnvironment";
import { bossClearReward, eliteClearReward, hiddenRoomReward, milestoneReward, repeatClearReward, treasureArtifactReward, growthArtifactCatalog, growthTraitCatalog, type GrowthReward } from "./growthRewards";
import { buildPersonality, personalityActionBonus, personalityBattleLine, personalityEventReaction } from "./personality";
import ThreeKingdoms from "./ThreeKingdoms";
import MonsterArt from "./MonsterArt";
import { normalizePassiveData, passiveAiBonus, passiveCombatBonus, passiveMilestones, passiveSetFor, upgradePassive } from "./passiveSkills";

type Screen = "home" | "party" | "dungeon" | "battle" | "inventory" | "recruit" | "strategy";
type BattleMode = "dungeon" | "defense" | "raid";
type DefenseObjective = "gate" | "relic" | "escort";
type RouteMemoryEntry = { attempts:number; clears:number; failures:number; rewardSamples:number; rewardGold:number };
type RouteMemory = Partial<Record<RoomKind,RouteMemoryEntry>>;
type Save = { heroes: Hero[]; party: string[]; gold: number; floor: number; stage: number; items: Item[]; monsterLineages: MonsterLineage[]; scenarioClears:Record<string,number>; partyMemory?:PartyMemory; routeMemory?:RouteMemory; worldSealed?:boolean; sealCount?:number };
type Decision = { action: string; target?: string; detail: string; score: number };
type BattlePlan = { key:"aggressive"|"defensive"|"focused"|"balanced"; label:string; detail:string };
type BattleContext = { mode:BattleMode; objectiveKind?:DefenseObjective; objectiveHp:number; phase:number };

const KEY = "autonomous-dungeon-demo-v1";
const jobKo: Record<Job,string> = {Warrior:"전사",Guardian:"수호자",Archer:"궁수",Mage:"마법사",Cleric:"성직자"};
const jobIcon: Record<Job,string> = {Warrior:"⚔️",Guardian:"🛡️",Archer:"🏹",Mage:"🔮",Cleric:"✚"};
const roomIcon: Record<RoomKind,string> = {battle:"⚔",elite:"☠",treasure:"◆",rest:"🔥",event:"?",hidden:"◇",boss:"👑",evilCave:"🕳"};
const roomKo: Record<RoomKind,string> = {battle:"일반 전투",elite:"정예 전투",treasure:"보물방",rest:"휴식처",event:"던전 이벤트",hidden:"숨은 방",boss:"심층 보스",evilCave:"악의 동굴"};
const monsterVisual=(species?:string)=>{
  const key=String(species||"").toLowerCase();
  if(/arachne|spider|거미/.test(key)) return {icon:"☷",className:"spider"};
  if(/demon|devil|악마|마족/.test(key)) return {icon:"♨",className:"demon"};
  if(/uruk|orc|오크|우르크/.test(key)) return {icon:"♜",className:"orc"};
  if(/goblin|고블린/.test(key)) return {icon:"♞",className:"goblin"};
  if(/dragon|drake|용|드래곤/.test(key)) return {icon:"♢",className:"dragon"};
  if(/wolf|늑대/.test(key)) return {icon:"◒",className:"beast"};
  if(/skeleton|undead|해골|언데드/.test(key)) return {icon:"☠",className:"undead"};
  return {icon:"◇",className:"generic"};
};
const defenseObjectiveKo: Record<DefenseObjective,string> = {gate:"성문",relic:"성유물",escort:"호위 대상"};
const bossPatternLabel=(species:string|undefined,phase:number)=>{
  if(species==="Uruk") return phase===1?"전쟁 지휘 · 전열 강화":phase===2?"전선 재편 · 집중 압박":"종언의 군령 · 폭주 지휘";
  if(species==="Arachne") return phase===1?"둥지 확장 · 거미줄 준비":phase===2?"거미줄 지대 · 이동 봉쇄":"심연의 둥지 · 전장 봉쇄";
  if(species==="Demon") return phase===1?"공포의 심문 · 취약점 탐색":phase===2?"지배의 파동 · 공포 확산":"종언의 심문 · 집중 처형";
  return phase===1?"보스 패턴 · 전장 분석":phase===2?"보스 패턴 · 전장 압박":"보스 패턴 · 종언";
};
const costumeVisualKey=(id?:string)=>{
  if(!id)return "base";
  const key=id.split("-").slice(1).join("-");
  return ["beach","summer","fur-winter","barbarian","bodysuit","monster-disguise","light-hero","fallen-hero"].includes(key)?key:"base";
};
const monsterCombatStyle=(species:string|undefined)=>{
  const key=String(species||"").toLowerCase();
  if(/goblin|고블린/.test(key)) return "함정 · 기습";
  if(/kobold|코볼트/.test(key)) return "매복 · 함정";
  if(/slime|슬라임/.test(key)) return "분열 · 증식";
  if(/gnoll|놀/.test(key)) return "무리 · 집중 사냥";
  if(/lizardman|리자드/.test(key)) return "측면 · 후방 습격";
  if(/orc|오크|우르크|uruk/.test(key)) return "전열 · 전투 함성";
  if(/naga|나가/.test(key)) return "독성 · 약화";
  if(/harpy|하피/.test(key)) return "급강하 · 추격";
  if(/ogre|오우거/.test(key)) return "광역 · 대지 강타";
  if(/arachne|spider|거미/.test(key)) return "거미줄 · 이동 봉쇄";
  if(/siren|세이렌/.test(key)) return "매혹 · 판단 교란";
  if(/darkworm|다크웜/.test(key)) return "굴 파기 · 기습";
  if(/dragon|drake|용|드래곤/.test(key)) return "화염 · 범위 압박";
  if(/wolf|늑대/.test(key)) return "돌진 · 연속 추격";
  if(/skeleton|undead|해골|언데드/.test(key)) return "불사 · 지속 압박";
  if(/demon|devil|악마|마족/.test(key)) return "공포 · 역할 집중";
  return "전투 · 위협 압박";
};

const tendencyKo: Record<keyof Tendencies,string> = {aggression:"공격성",bravery:"용맹",caution:"신중함",survival:"생존본능",protect:"아군보호",pursuit:"추적성",focus:"집중력",greed:"탐욕",curiosity:"호기심",cooperation:"협동성"};
const defenseObjectiveForFloor=(floor:number):DefenseObjective=>floor%3===1?"gate":floor%3===2?"relic":"escort";
const defenseObjectiveDetail:Record<DefenseObjective,string>={
  gate:"성문 · Guardian이 근처를 지키면 받는 압박이 감소합니다.",
  relic:"성유물 · Mage가 보호하고 Cleric이 회복할 수 있습니다.",
  escort:"호위 대상 · Guardian 생존 시 내구도가 주기적으로 회복됩니다."
};
const raidBossForFloor=(floor:number)=>floor%3===1?"Uruk":floor%3===2?"Arachne":"Demon";
const sealEnemyMultiplier=(sealCount=0)=>1+Math.max(0,sealCount)*0.12;
const sealEnemyEnhancement=(sealCount=0)=>Math.round(Math.max(0,sealCount)*12);
const scaleMonsterForSeals=(monster:ReturnType<typeof createMonster>,sealCount=0)=>{
  const mult=sealEnemyMultiplier(sealCount);
  return {...monster,hp:Math.max(1,Math.round(monster.hp*mult)),maxHp:Math.max(1,Math.round(monster.maxHp*mult)),attack:Math.max(1,Math.round(monster.attack*mult)),defense:Math.max(1,Math.round(monster.defense*mult)),speed:Math.max(.2,Math.round(monster.speed*(1+Math.max(0,sealCount)*.025)*100)/100)};
};
const worldRoundFromSealCount=(sealCount=0)=>Math.max(1,Math.floor(Number(sealCount)||0)+1);
const dungeonLevelRange=(floor:number,sealCount=0)=>{
  const normalizedFloor=Math.max(1,Math.min(6,Math.floor(Number(floor)||1)));
  const worldRound=worldRoundFromSealCount(sealCount);
  const floorMin=(worldRound-1)*30+(normalizedFloor-1)*5+1;
  return {min:floorMin,max:floorMin+4,worldRound,floor:normalizedFloor};
};

const scaleBossMonster=(monster:ReturnType<typeof createMonster>,floor:number,sealCount=0)=>{
  const sealed=scaleMonsterForSeals(monster,sealCount);
  const mult=1.48+Math.min(.34,Math.max(0,floor)*.018)+Math.max(0,sealCount)*.04;
  return {...sealed,hp:Math.max(1,Math.round(sealed.hp*mult)),maxHp:Math.max(1,Math.round(sealed.maxHp*mult)),
    attack:Math.max(1,Math.round(sealed.attack*mult)),
    defense:Math.max(1,Math.round(sealed.defense*(1+Math.min(.28,Math.max(0,floor)*.014)))),
    speed:Math.max(.2,Math.round(sealed.speed*(1+Math.min(.18,Math.max(0,floor)*.006)+Math.max(0,sealCount)*.012)*100)/100),
    tendencies:{...sealed.tendencies,aggression:Math.min(100,sealed.tendencies.aggression+8),focus:Math.min(100,sealed.tendencies.focus+8),bravery:Math.min(100,sealed.tendencies.bravery+6)}
  };
};
const bossIntroFor=(floor:number,room:RoomKind,name:string,species:string)=>{
  const final=room==="evilCave";
  const quotes:Record<string,string>={
    Uruk:"우르크 군단의 전열은 내가 지배한다. 한 발짝도 더 들어오지 마라.",
    Arachne:"내 둥지에 발을 들인 순간부터, 너희의 움직임은 모두 내 거미줄 안에 있다.",
    Demon:"인간의 의지는 공포 앞에서 얼마나 오래 버티는지 보여주거라."
  };
  return {name,species,subtitle:final?"세계의 구멍을 지키는 최종 수문장":"심층을 지배하는 보스 · 강화된 3페이즈 전투",
    quote:final?"봉인을 원한다면 먼저 이 세계의 가장 깊은 공포를 넘어야 한다.":(quotes[species]||"이곳이 너희의 끝이다. 전장은 내가 지배한다.")};
};

const NPC_IMAGE = "/npc/seraphina.webp";
const npcLineFor = (floor:number, mode:BattleMode, dialogueIndex=0) => {
  const common = [
    "동굴은 넓은 길보다 좁은 틈에서 더 많은 것을 숨깁니다. 방 하나를 고를 때도 파티의 성향이 드러나요.",
    "장비는 힘만 올리는 물건이 아니에요. 어떤 행동을 반복하게 만드는지도 함께 살펴보세요.",
    "전투에서 누구에게 무엇을 명령할지는 제가 정하지 않아요. 당신이 준비한 파티가 스스로 답을 찾게 됩니다.",
    "같은 방을 다시 지나도 결과는 같지 않을 거예요. 경험이 쌓일수록 영웅과 몬스터 모두 다른 모습을 보여주니까요.",
    "깊은 곳으로 갈수록 한 사람의 실수보다 파티의 연계가 중요해집니다.",
    "보물은 반짝이는 것만 가치가 있는 게 아니에요. 오래 함께할 장비는 전투 습관까지 바꿀 수 있죠."
  ];
  const dungeon = [
    `심도 ${floor}F군요. 다음 방의 위험과 보상을 비교해서 길을 정하세요. 전투가 시작되면 파티의 판단을 지켜보세요.`,
    "정찰은 끝났습니다. 이제 중요한 건 누가 먼저 움직이느냐가 아니라, 누가 어떤 상황에 반응하느냐예요.",
    "앞의 길이 안전해 보여도 전열이 무너지면 금세 위험해집니다. 생존 성향이 높은 영웅을 눈여겨보세요.",
    "이 동굴에서는 호기심이 새로운 길을 만들고, 신중함이 살아 돌아올 이유를 만듭니다."
  ];
  const defense = [
    `이번 ${floor}F 방어전은 목표를 지키는 싸움입니다. 적을 많이 쓰러뜨리는 것만큼 위치를 유지하는 것도 중요해요.`,
    "성문이든 성유물이든 호위 대상이든, 목표의 체력이 흔들리면 파티의 행동 우선순위도 달라집니다.",
    "방어전에서 좋은 장비는 단순한 공격력보다 보호와 회복 판단을 오래 유지하게 해주는 장비일 수 있어요.",
    "웨이브가 길어질수록 한 번의 돌격보다 꾸준한 생존이 중요해집니다."
  ];
  const raid = [
    `보스 레이드군요. ${floor}F의 보스는 체력에 따라 전투 양상이 달라집니다. 마지막까지 관찰하세요.`,
    "보스의 패턴은 예측해도 완전히 고정되지는 않아요. 파티의 성향과 장비가 대응 방식을 바꿉니다.",
    "레이드에서는 집중력이 높은 영웅과 꾸준히 버티는 영웅이 서로 다른 방식으로 가치를 보여줄 수 있어요.",
    "보스의 마지막 페이즈가 가장 위험합니다. 그때 누가 남아 있느냐가 중요해요."
  ];
  const highDepth = [
    "이쪽 공기는 달라졌죠? 악의 동굴에 가까워질수록 평범한 전투 감각만으로는 부족해질 거예요.",
    "여기서부터는 오래 살아남은 영웅들의 습관이 진짜 힘이 됩니다.",
    "동굴이 좁아졌습니다. 추격과 후퇴를 동시에 이해하는 파티가 특히 빛날 수 있어요."
  ];
  let pool = mode==="raid" ? raid : mode==="defense" ? defense : dungeon;
  if(floor>=8) pool = pool.concat(highDepth);
  pool = pool.concat(common);
  return {
    mood: mode==="raid" ? "보스 레이드 감시" : mode==="defense" ? "방어선 확인" : floor>=8 ? "심층 경고" : "탐색 안내",
    line: pool[((floor-1)*3+dialogueIndex)%pool.length]
  };
};

const lineageFor=(lineages:MonsterLineage[],species:string)=>lineages.find(x=>x.species===species);
const createLinedMonster=(species:string,level:number,grade:ReturnType<typeof createMonster>["grade"],index:number,lineages:MonsterLineage[])=>{
  const base=createMonster(species,level,grade,index);
  if(grade==="Boss") return base;
  const lineage=lineageFor(lineages,species);
  return applyMonsterPromotion(applyLineage(base,lineage),lineage);
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
const normalizeLoadedHero=(h:Hero):Hero=>{
  const rawEquipment=Array.isArray(h.equipment)?h.equipment:(h.item?[h.item]:[]);
  const experience=Number(h.experience);
  const normalized={...h,
    star:Math.max(1,Math.min(6,Math.floor(Number(h.star)||1))),
    level:Math.max(1,Math.floor(Number(h.level)||1)),
    experience:Number.isFinite(experience)?Math.max(0,experience):0,
    tendencies:{...defaultTendencies[h.job],...(h.tendencies||{})},
    personality:h.personality||buildPersonality(h),
    skinIds:Array.from(new Set([costumesForJob(h.job)[0]?.id,...(h.skinIds||[]),h.costumeId].filter((x):x is string=>!!x))),
    equippedSkinId:h.equippedSkinId||h.costumeId||costumesForJob(h.job)[0]?.id,
    equipment:rawEquipment.slice(0,3).map(i=>i?{...i,enhancement:Math.max(0,Math.min(MAX_ENHANCEMENT,Number(i.enhancement)||0))}:undefined) as [Item?,Item?,Item?],
    item:rawEquipment[0]
  };
  return normalizePassiveData(grantExperience(normalized,0).hero);
};

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Save;
      const legacySealed=typeof s.sealCount!=="number"&&!!s.worldSealed;
      return {...s,
        partyMemory:s.partyMemory||defaultPartyMemory,
        routeMemory:s.routeMemory||{},
        sealCount:Math.max(legacySealed?1:0,Math.floor(Number(s.sealCount)||0)),
        heroes:(Array.isArray(s.heroes)?s.heroes:heroesSeed).map(normalizeLoadedHero),
        items:Array.isArray(s.items)?s.items.slice(0,MAX_WAREHOUSE_ITEMS):[],
        monsterLineages:(s.monsterLineages||[]).filter(x=>!x.id.endsWith("-boss")),
        scenarioClears:s.scenarioClears||{},
        worldSealed:legacySealed?false:!!s.worldSealed
      };
    }
  } catch {}
  return {heroes:heroesSeed.map(({item,...h})=>({...h,tendencies:cloneTendencies(h.tendencies),equipment:[],personality:buildPersonality(h),skinIds:[h.job.toLowerCase()+"-base"],equippedSkinId:h.job.toLowerCase()+"-base"})),party:heroesSeed.slice(0,4).map(h=>h.id),gold:2500,floor:1,stage:0,items:[],monsterLineages:[],scenarioClears:{},partyMemory:defaultPartyMemory,routeMemory:{},worldSealed:false,sealCount:0};
}
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const pct=(u:{hp:number;maxHp:number})=>u.maxHp?u.hp/u.maxHp:0;
const statusEffectKo:Record<StatusEffectKind,string>={poison:"독",slow:"둔화",stun:"기절",fear:"공포"};
const statusEffectIcon:Record<StatusEffectKind,string>={poison:"☠",slow:"〽",stun:"✦",fear:"!"};
const statusOf=(u:BattleUnit,kind:StatusEffectKind)=>u.statusEffects?.find(x=>x.kind===kind);
const addStatus=(u:BattleUnit,kind:StatusEffectKind,turns:number,power=0)=>{
  const next=Math.max(1,Math.round(turns));
  const current=statusOf(u,kind);
  if(current){current.turns=Math.max(current.turns,next);current.power=Math.max(current.power||0,power);}
  else (u.statusEffects||(u.statusEffects=[])).push({kind,turns:next,power});
};
const tickStatus=(u:BattleUnit)=>{
  const active=u.statusEffects||[];
  const stunned=!!statusOf(u,"stun");
  const poisoned=statusOf(u,"poison");
  let line="";
  if(poisoned&&poisoned.turns>0){
    const damage=Math.max(2,Math.round(u.maxHp*(poisoned.power||.045)));
    u.hp=Math.max(0,u.hp-damage);
    u.alive=u.hp>0;
    line="독 피해 -"+damage;
  }
  u.statusEffects=active.map(s=>({...s,turns:s.turns-1})).filter(s=>s.turns>0);
  return {stunned,line};
};
const turnSpeed=(u:BattleUnit)=>u.speed*(statusOf(u,"slow")?.turns?0.64:1);
const dist=(a:BattleUnit,b:BattleUnit)=>Math.abs(a.pos-b.pos);
const live=(u:BattleUnit[],team:"player"|"enemy")=>u.filter(x=>x.team===team&&x.alive);
const equipmentSlotsOf=(hero:Hero|BattleUnit):[Item?,Item?,Item?]=>{
  const raw=hero.equipment ?? (hero.item?[hero.item]:[]);
  return [raw[0],raw[1],raw[2]];
};
const equippedItemsOf=(hero:Hero|BattleUnit)=>equipmentSlotsOf(hero).filter((x):x is Item=>!!x);
const combinedAiMods=(items:Item[])=>{
  const mods:Partial<Tendencies>={};
  for(const item of items) for(const [k,v] of Object.entries(item.aiMods)) mods[k as keyof Tendencies]=(mods[k as keyof Tendencies]||0)+(v||0);
  return mods;
};
const MAX_ENHANCEMENT=15;
const MAX_WAREHOUSE_ITEMS=60;
const addWarehouseItems=(items:Item[],additions:Item[])=>items.concat(additions).slice(0,MAX_WAREHOUSE_ITEMS);
const enhancementLevel=(item:Item)=>Math.max(0,Math.min(MAX_ENHANCEMENT,item.enhancement||0));
const enhancementCost=(item:Item)=>{
  const lv=enhancementLevel(item);
  return Math.round((80+item.level*22)*(lv+1));
};
const enhancementCombatMods=(item:Item)=>{
  const n=enhancementLevel(item);
  if(!n)return {};
  if(item.slot==="weapon")return {attack:n*2};
  if(item.slot==="armor")return {defense:n*2,hpPct:n};
  if(item.slot==="ring")return {attack:n,critPct:n*.5};
  return {defense:n,speedPct:n*.5};
};
const enhancementCombatLabels=(item:Item)=>{
  return Object.entries(enhancementCombatMods(item)).map(([k,v])=>{
    if(k==="attack")return "강화 공격 +"+v;
    if(k==="defense")return "강화 방어 +"+v;
    if(k==="hpPct")return "강화 HP +"+v+"%";
    if(k==="speedPct")return "강화 속도 +"+v+"%";
    if(k==="critPct")return "강화 치명타 +"+v+"%";
    return "강화 "+k+" +"+v;
  });
};
const combinedCombatMods=(items:Item[])=>{
  const mods:Record<string,number>={};
  for(const item of items){
    for(const [k,v] of Object.entries(item.combatMods||{})) mods[k]=(mods[k]||0)+(v||0);
    for(const [k,v] of Object.entries(enhancementCombatMods(item))) mods[k]=(mods[k]||0)+(v||0);
  }
  return mods;
};
const heroStar=(hero:Hero)=>Math.max(1,Math.min(6,Math.floor(Number(hero.star)||1)));
const traitStrengthMultiplier=(hero:Hero)=>1+(heroStar(hero)-1)*.2;
const traitAiBoostAtStar=(hero:Hero):Partial<Tendencies>=>{
  const extra:Partial<Tendencies>={};
  const extraMultiplier=Math.max(0,traitStrengthMultiplier(hero)-1);
  if(extraMultiplier===0)return extra;
  (hero.traits||[]).forEach(name=>{
    const effect=eventTraitEffects[name]||growthTraitCatalog[name];
    Object.entries(effect?.aiMods||{}).forEach(([k,v])=>{
      const key=k as keyof Tendencies;
      extra[key]=(extra[key]||0)+(v||0)*extraMultiplier;
    });
  });
  return extra;
};
const starCombatMultiplier=(hero:Hero)=>1+(heroStar(hero)-1)*.03;
const aiT=(t:Tendencies,items:Item[]=[],artifacts:string[]=[],hero?:Hero):Tendencies=>{
  const n={...t}; const mods=combinedAiMods(items);
  (Object.keys(mods) as (keyof Tendencies)[]).forEach(k=>n[k]=clamp(n[k]+(mods[k]||0)));
  artifacts.forEach(name=>{
    const effect=eventArtifactEffects[name]||growthArtifactCatalog[name];
    if(effect)Object.entries(effect.aiMods).forEach(([k,v])=>{n[k as keyof Tendencies]=clamp(n[k as keyof Tendencies]+(v||0));});
  });
  if(hero){
    const passiveBoost=passiveAiBonus(hero);
    (Object.keys(passiveBoost) as (keyof Tendencies)[]).forEach(k=>n[k]=clamp(n[k]+(passiveBoost[k]||0)));
    const traitBoost=traitAiBoostAtStar(hero);
    (Object.keys(traitBoost) as (keyof Tendencies)[]).forEach(k=>n[k]=clamp(n[k]+(traitBoost[k]||0)));
  }
  return n;
};
const transcendenceRequirements=[undefined,{level:20,gold:1200},{level:40,gold:2400},{level:60,gold:4000},{level:80,gold:6000},{level:100,gold:9000}] as const;
const transcendenceRequirement=(hero:Hero)=>{
  const star=heroStar(hero);
  return star>=6?undefined:transcendenceRequirements[star];
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
  const passive=passiveCombatBonus(hero);
  const promotion=promotionPassive(hero)||{attack:0,defense:0,hpPct:0,speedPct:0,range:0,healPct:0};
  const starMult=starCombatMultiplier(hero);
  const artifactMods:Record<string,number>={};
  (hero.artifacts||[]).forEach(name=>Object.entries((eventArtifactEffects[name]||growthArtifactCatalog[name])?.combatMods||{}).forEach(([k,v])=>artifactMods[k]=(artifactMods[k]||0)+(v||0)));
  const bonus=chronicleBonuses(hero);
  const costumeIds=hero.skinIds||[hero.equippedSkinId||hero.costumeId||hero.job.toLowerCase()+"-base"];
  const costumeBonus=ownedCostumeCombatBonus(costumeIds);
  const costumePassive=ownedCostumePassive(costumeIds);
  const hp=Math.round(hero.hp*starMult*(1+((m.hpPct||0)+(artifactMods.hpPct||0)+(bonus.hpPct||0)+passive.hpPct+promotion.hpPct+costumeBonus.hpPct+costumePassive.hpPct)/100));
  return {hp,maxHp:hp,attack:Math.round(hero.attack*starMult)+(m.attack||0)+(artifactMods.attack||0)+(bonus.attack||0)+passive.attack+promotion.attack+costumeBonus.attack+costumePassive.attack,defense:Math.round(hero.defense*starMult)+(m.defense||0)+(artifactMods.defense||0)+(bonus.defense||0)+passive.defense+promotion.defense+costumeBonus.defense+costumePassive.defense,speed:hero.speed*(1+((m.speedPct||0)+(artifactMods.speedPct||0)+(bonus.speedPct||0)+passive.speedPct+promotion.speedPct+costumeBonus.speedPct+costumePassive.speedPct)/100),range:hero.range+(m.range||0)+(artifactMods.range||0)+passive.range+promotion.range+costumeBonus.range+costumePassive.range};
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
  // 최초 자동 진형은 전사/수호자를 전열, 마법사/성직자를 확실한 후열에 배치한다.
  // 성향 보정은 유지하되 후열 직업의 기본 위치가 전열로 밀리지 않도록 한다.
  let base=hero.job==="Guardian"?1.0:hero.job==="Warrior"?1.45:(hero.job==="Mage"||hero.job==="Cleric"?3.55:2.65);
  if(mode==="defense"&&(hero.job==="Guardian"||hero.job==="Warrior"))base-=.2;
  if(mode==="raid"&&(hero.job==="Cleric"||hero.job==="Mage"))base+=.18;
  base+=(defensive-aggressive)*.006;
  if(hero.job==="Mage"||hero.job==="Cleric")base=Math.max(3.35,base);
  return Math.max(.55,Math.min(4.6,base+index*.28-crowd));
}
function formationLabel(heroes:Hero[],mode:BattleMode){
  const ordered=autoFormation(heroes,mode);
  const front=ordered.filter(h=>h.job==="Guardian"||h.job==="Warrior").length;
  const rear=ordered.filter(h=>h.job==="Archer"||h.job==="Mage"||h.job==="Cleric").length;
  if(!front)return rear?"후방 지원 진형":"원거리 집중";
  if(!rear)return "전면 압박";
  return mode==="defense"?"자동 방어 진형 · 마법사/힐러 후열":"자동 전열·후열 진형 · 마법사/힐러 후열";
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
  if(plan.key==="defensive") return action==="아군 보호"?16:action==="회복"?15:action==="대회복"?18:action==="후퇴"?10:action==="방어 태세"?18:attack.includes(action)?-3:4;
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

const itemCombatLabels=(item:Item)=>{
  return Object.entries(item.combatMods||{}).map(([k,v])=>{
    if(k==="attack")return "공격 +"+v;
    if(k==="defense")return "방어 +"+v;
    if(k==="hpPct")return "HP +"+v+"%";
    if(k==="speedPct")return "속도 +"+v+"%";
    if(k==="range")return "사거리 +"+v;
    if(k==="healPct")return "치유 +"+v+"%";
    if(k==="critPct")return "치명타 +"+v+"%";
    return k+" +"+v;
  });
};
function equipmentPreview(hero:Hero,item:Item,slot:number){
  const before=combatStats(hero);
  const slots=equipmentSlotsOf(hero); slots[slot]=item;
  const after=combatStats({...hero,equipment:slots});
  return {
    attack:after.attack-before.attack,
    defense:after.defense-before.defense,
    hp:after.maxHp-before.maxHp,
    speed:after.speed-before.speed,
    range:after.range-before.range,
  };
}

function spawn(heroes:Hero[],party:string[],room:RoomKind,floor:number,lineages:MonsterLineage[]=[],mode:BattleMode="dungeon",sealCount=0): BattleUnit[] {
  const selected=heroes.filter(h=>party.includes(h.id));  const ordered=autoFormation(selected,mode);
  const ps: BattleUnit[] = ordered.map((h,i)=>{
    const s=combatStats(h);
    return {id:h.id,name:h.name,job:h.job,level:h.level,team:"player" as const,hp:s.hp,maxHp:s.maxHp,attack:s.attack,defense:s.defense,
      speed:s.speed,range:s.range,pos:formationPosition(h,i,ordered.length,mode),alive:true,passiveHealPct:passiveCombatBonus(h).healPct+(promotionPassive(h)?.healPct||0),tendencies:aiT(h.tendencies,equippedItemsOf(h),h.artifacts||[],h),equipment:equippedItemsOf(h),item:equippedItemsOf(h)[0],skinId:h.equippedSkinId||h.costumeId,
      personality:h.personality,relationships:h.relationships,memories:h.memories,promotionPath:h.promotionPath,actionText:"대기",cooldown:0,guard:0,xp:0,behaviorCounts:{}};
  });
  const pool=floor<=2?["Goblin","Kobold","Slime"]:floor<=4?["Gnoll","Lizardman","Arachne"]:["Orc","Uruk","Ogre"];
  // 세계 회차마다 30레벨씩 상승하며, 6개 층은 각각 5레벨 구간을 공유한다.
  // 1회차: 1F=Lv.1~5 ... 6F=Lv.26~30 / 2회차: 1F=Lv.31~35 ... 6F=Lv.56~60.
  const levelRange=dungeonLevelRange(floor,sealCount);
  const floorMin=levelRange.min;
  const floorMax=levelRange.max;
  const monsterLevelFor=(index:number)=>floorMin+((Math.max(0,index)+Math.max(0,floor-1))%5);
  const count=room==="boss"||room==="evilCave"?3:room==="elite"?4:3;
  let es=Array.from({length:count},(_,i)=>{
    const grade=room==="boss"||room==="evilCave"?(i===0?"Named":"Elite"):room==="elite"?"Elite":"Normal";
    return createLinedMonster(pool[(i+floor)%pool.length],monsterLevelFor(i),grade,i,lineages);
  });
  if(room==="boss"||room==="evilCave"){
    const bossSpecies=room==="evilCave"?"Demon":raidBossForFloor(floor);
    const base=createMonster(bossSpecies,floorMax,"Boss",0);
    const bossName=room==="evilCave"?"악의 동굴 수문장":bossSpecies==="Uruk"?"우르크 전쟁대장":bossSpecies==="Arachne"?"둥지의 여왕":"지옥의 대공";
    es[0]={...base,name:bossName,pos:8.8};
  }
  es=es.map(e=>e.grade==="Boss"?scaleBossMonster(e,floor,sealCount):scaleMonsterForSeals(e,sealCount));
  return ps.concat(es.map(e=>({id:e.id,name:e.name,species:e.species,grade:e.grade,level:e.level,team:"enemy" as const,hp:e.hp,maxHp:e.maxHp,attack:e.attack,defense:e.defense,
    speed:e.speed,range:e.range,pos:e.pos,alive:true,tendencies:e.tendencies,mutation:e.mutation,evolutionStage:e.evolutionStage,evolutionPath:e.evolutionPath,evolutionFocus:e.evolutionFocus,promotionTier:e.promotionTier,promotionPath:e.promotionPath,actionText:"대기",cooldown:0,guard:0,xp:0})));
}

function asEnemy(e:ReturnType<typeof createMonster>,suffix=""):BattleUnit{
  return {id:e.id+suffix,name:e.name,species:e.species,grade:e.grade,level:e.level,team:"enemy" as const,hp:e.hp,maxHp:e.maxHp,attack:e.attack,defense:e.defense,speed:e.speed,range:e.range,pos:e.pos,alive:true,tendencies:e.tendencies,evolutionStage:e.evolutionStage,evolutionPath:e.evolutionPath,evolutionFocus:e.evolutionFocus,promotionTier:e.promotionTier,promotionPath:e.promotionPath,mutation:e.mutation,actionText:"대기",cooldown:0,guard:0,xp:0};
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
    let s=68+t.aggression*.42+t.bravery*.24+t.focus*.12+(1-pct(weak))*46+envBonus+(a.team==="enemy"?38:0);
    if(pct(weak)<.2)s+=25; if(dist(a,nearest)<=a.range)s+=30; s+=(mod.aggression||0)*.7;
    arr.push({action:"일반 공격",target:(context?.mode==="raid"&&boss?boss.id:(a.job==="Archer"||a.job==="Mage"?weak.id:nearest.id)),detail:"위협·마무리 가능성·기존 공격 습관을 계산",score:s+habitBias(a,"일반 공격")+roleSynergy(a,allies,"일반 공격")+battlePlanBonus(plan,"일반 공격",a.team)+battleObjectiveBonus(a,enemies,"일반 공격",context)});
  }
  if(a.job==="Warrior") arr.push({action:"추격",target:weak?.id,detail:"약해진 적을 끝까지 압박",score:25+t.pursuit*.5+t.aggression*.2+t.bravery*.15-threat*.2+(mod.pursuit||0)*.8+habitBias(a,"추격")+roleSynergy(a,allies,"추격")+battlePlanBonus(plan,"추격",a.team)+battleObjectiveBonus(a,enemies,"추격",context)});
  if(a.job==="Guardian"&&ally&&pct(ally)<.82) arr.push({action:"아군 보호",target:ally.id,detail:"부상한 아군을 우선 보호하고 전선을 유지",score:26+t.protect*.5+t.cooperation*.25+(1-pct(ally))*58+habitBias(a,"아군 보호")+partyHabitBias(partyMemory,"아군 보호")+roleSynergy(a,allies,"아군 보호")+relationshipFromMap(a.relationships,ally.id).trust*.22+relationshipFromMap(a.relationships,ally.id).bond*.12+(mod.protect||0)*.8+Math.min(12,lossBias*.2)+battlePlanBonus(plan,"아군 보호",a.team)+battleObjectiveBonus(a,enemies,"아군 보호",context)});
  if(a.job==="Cleric"&&ally&&pct(ally)<.76) arr.push({action:"회복",target:ally.id,detail:"부상한 아군을 즉시 회복",score:32+t.protect*.35+t.cooperation*.25+(1-pct(ally))*82+habitBias(a,"회복")+partyHabitBias(partyMemory,"회복")+roleSynergy(a,allies,"회복")+relationshipFromMap(a.relationships,ally.id).trust*.16+relationshipFromMap(a.relationships,ally.id).bond*.1+(mod.protect||0)*.7+Math.min(8,lossBias*.15)+battlePlanBonus(plan,"회복",a.team)+battleObjectiveBonus(a,enemies,"회복",context)});
  if(a.job==="Mage") arr.push({action:"광역 마법",detail:"사거리에 들어온 적 수를 계산",score:40+t.aggression*.2+t.focus*.2+enemies.filter(x=>dist(a,x)<=5).length*14+(mod.focus||0)*.8+habitBias(a,"광역 마법")+roleSynergy(a,allies,"광역 마법")+battlePlanBonus(plan,"광역 마법",a.team)+battleObjectiveBonus(a,enemies,"광역 마법",context)});
  const defenseNeed=(1-pct(a))*58+t.caution*.34+t.survival*.34+t.protect*.22+(plan?.key==="defensive"&&a.team==="player"?18:0);
  if(defenseNeed>=68 || (pct(a)<.24 && t.survival>=52)) arr.push({action:"방어 태세",detail:"피해를 줄이고 다음 교환을 버티는 방어 행동",score:22+defenseNeed*.7+habitBias(a,"방어 태세")+battlePlanBonus(plan,"방어 태세",a.team)});
  if(a.team==="enemy"&&a.species==="Goblin") arr.push({action:"기습 후퇴",target:nearest?.id,detail:"위험해지면 생존을 위해 물러남",score:20+t.greed*.2+t.caution*.35+(1-pct(a))*60});
  if(a.team==="enemy"&&a.grade==="Boss"){
    const phase=pct(a)>0.65?1:pct(a)>0.35?2:3;
    arr.push({action:"보스 패턴",detail:"페이즈 "+phase+" 패턴을 선택하고 전장을 압박",score:42+t.focus*.25+t.bravery*.25+(phase-1)*18});
  }
  arr.push({action:"후퇴",detail:"현재 HP와 적 위협을 기준으로 생존 판단",score:20+t.survival*.45+t.caution*.3+threat*.4-t.bravery*.25-t.aggression*.12+envBonus+habitBias(a,"후퇴")+partyHabitBias(partyMemory,"후퇴")+(pct(a)<.12?20:0)-(equippedItemsOf(a).some(x=>x.id==="berserker-heart")?35:0)-(a.team==="enemy"?22:0)+battlePlanBonus(plan,"후퇴",a.team)+battleObjectiveBonus(a,enemies,"후퇴",context)});
  arr.push({action:"대기",detail:"즉시 행동의 가치가 낮다고 판단",score:16+t.caution*.05+envBonus*.2});
  return a.team==="player" ? arr.map(d=>({...d,score:d.score+personalityActionBonus(a as any,d.action)})) : arr;
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
  const fearFactor=statusOf(a,"fear")?.turns?0.78:1;
  const bossPhase=pct(b)>0.65?1:pct(b)>0.35?2:3;
  const bossDamageTaken=b.grade==="Boss"?(bossPhase===1?.88:bossPhase===2?.82:.74):1;
  const bossAttackBoost=a.grade==="Boss"?(pct(a)>0.65?1.08:pct(a)>0.35?1.16:1.28):1;
  return Math.max(5,Math.round(((a.attack*m*bossAttackBoost)-b.defense*.5)*crit*fearFactor*(.94+Math.random()*.12)*guardFactor*bossDamageTaken));
}

function doAI(u:BattleUnit[],id:string,env?:EnvironmentKind,partyMemory?:PartyMemory,plan?:BattlePlan,context?:BattleContext):{units:BattleUnit[];decision:Decision;line:string}{
  const n=u.map(x=>({...x,behaviorCounts:{...(x.behaviorCounts||{})},statusEffects:(x.statusEffects||[]).map(s=>({...s})),fx:undefined,fxKind:undefined,battleStats:{...(x.battleStats||{damage:0,healing:0,actions:0,critical:0,costumeFx:0,taken:0,kills:0})}})); const a=n.find(x=>x.id===id)!; const hpBefore=new globalThis.Map(n.map(x=>[x.id,x.hp])); const statusTurn=tickStatus(a); if(statusTurn.stunned){ a.behaviorCounts!["기절"]=(a.behaviorCounts!["기절"]||0)+1; a.battleStats!.actions+=1; a.actionText="기절 · 행동 취소"; return {units:n,decision:{action:"기절",detail:"상태이상으로 이번 행동이 취소됨",score:999},line:(statusTurn.line?statusTurn.line+" / ":"")+a.actionText}; } const d=weighted(decisions(a,n,env,partyMemory,plan,context));
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
  const fx=(target:BattleUnit,kind:"damage"|"heal"|"critical"|"status",text:string)=>{target.fx=text;target.fxKind=kind;if(a.team==="player"&&target.id!==a.id&&(kind==="damage"||kind==="heal"||kind==="critical")){a.fx="COSTUME";a.fxKind=kind;a.battleStats!.costumeFx=(a.battleStats!.costumeFx||0)+1;if(kind==="critical")a.battleStats!.critical=(a.battleStats!.critical||0)+1;}};
  if(d.action==="폭딜"||d.action==="탱커"||d.action==="단일전투"||d.action==="수호"||d.action==="정밀사격"||d.action==="추격"||d.action==="기동"||d.action==="광역마법"||d.action==="약화지원"||d.action==="집중마법"||d.action==="회복"||d.action==="성전수호"||d.action==="심판"){
    const t=by(d.target)||nearest||weak;
    if(d.action==="회복"&&allies.length){
      const h=allies.slice().sort((x,y)=>pct(x)-pct(y))[0],x=Math.max(4,Math.round(h.maxHp*.16));
      h.hp=Math.min(h.maxHp,h.hp+x);fx(h,"heal","+"+x);a.actionText=d.action+" → "+h.name+" (+"+x+")";line=a.actionText;
    } else if(t){
      if(dist(a,t)>a.range)move(t);
      const mult=d.action==="광역마법"?0.72:d.action==="정밀사격"?1.18:d.action==="탱커"?0.92:d.action==="성전수호"?1.05:1.08;
      const x=hit(a,t,mult);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;
      if(d.action==="수호"||d.action==="탱커"||d.action==="성전수호"){a.guard=Math.max(a.guard,2);t.guard=Math.max(t.guard,1);}
      if(d.action==="약화지원")addStatus(t,"slow",2);
      fx(t,d.action==="정밀사격"||d.action==="집중마법"?"critical":"damage","-"+x);
      a.actionText=d.action+" → "+t.name+" (-"+x+")";line=a.actionText;
    }
  } else if(d.action==="광폭 돌격"){
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
    const t=allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){const x=Math.round(t.maxHp*((.30+a.tendencies.cooperation*.001)*(1+((combinedCombatMods(equippedItemsOf(a)).healPct||0)+(a.passiveHealPct||0))/100)));t.hp=Math.min(t.maxHp,t.hp+x);fx(t,"heal","+"+x);t.guard=Math.max(t.guard,1);a.actionText="대회복 → "+t.name+" (+"+x+")";line=a.actionText;}
  } else if(d.action==="분열"){
    if(pct(a)>.55 && n.filter(x=>x.team==="enemy").length<8){
      const child={...a,id:a.id+"-split-"+Math.random().toString(36).slice(2,5),name:a.name+" 분열체",hp:Math.round(a.maxHp*.28),maxHp:Math.round(a.maxHp*.28),attack:Math.max(3,Math.round(a.attack*.45)),defense:Math.max(1,Math.round(a.defense*.45)),pos:Math.max(.4,a.pos-.4),alive:true,behaviorCounts:{},battleStats:{damage:0,healing:0,actions:0}};
      n.push(child);a.hp=Math.round(a.hp*.72);a.actionText="분열 → "+child.name;line=a.actionText;
    } else {a.actionText="분열 대기";line=a.actionText;}
  } else if(d.action==="함정 투척"||d.action==="매복 함정"||d.action==="거미줄"){
    const t=by(d.target)||weak||nearest;
    if(t){addStatus(t,"slow",3);fx(t,"status","SLOW 3T");a.actionText=d.action+" → "+t.name+" · 둔화 3T";line=a.actionText;}
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
    if(t){if(d.action==="독성 압박"){addStatus(t,"poison",4,.055);t.tendencies.focus=Math.max(0,t.tendencies.focus-7);t.attack=Math.max(1,Math.round(t.attack*.92));fx(t,"status","독 4T");}else{addStatus(t,"stun",1);t.tendencies.focus=Math.max(0,t.tendencies.focus-12);t.attack=Math.max(1,Math.round(t.attack*.92));fx(t,"status","기절 1T");}const x=hit(a,t,.9);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText=d.action+" → "+t.name+" (-"+x+")";line=a.actionText;}
  } else if(d.action==="대지 강타"){
    const ts=enemies.filter(x=>dist(a,x)<=2.4).slice(0,4);
    if(ts.length){const bits=ts.map(t=>{const x=hit(a,t,1.05);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;if(Math.random()<.34)addStatus(t,"stun",1);return t.name+" -"+x+(statusOf(t,"stun")?" · 기절":"")});a.actionText="대지 강타 → "+bits.join(", ");line=a.actionText;}
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
      addStatus(target,"fear",phase===3?4:3);
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
    const t=by(d.target)||allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){const x=Math.round(t.maxHp*((.18+a.tendencies.cooperation*.001)*(1+((combinedCombatMods(equippedItemsOf(a)).healPct||0)+(a.passiveHealPct||0))/100)));t.hp=Math.min(t.maxHp,t.hp+x);fx(t,"heal","+"+x);a.actionText="회복 → "+t.name+" (+"+x+")";line=a.actionText;}
  } else if(d.action==="광역 마법"){
    const ts=enemies.filter(x=>dist(a,x)<=5).slice(0,3); if(ts.length){const bits=ts.map(t=>{const x=hit(a,t,.72);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;return t.name+" -"+x});a.actionText="광역 마법 → "+bits.join(", ");line=a.actionText;} else if(enemies[0])move(enemies[0]),a.actionText="광역 사거리 확보";
  } else if(d.action==="기습 후퇴"||d.action==="후퇴"){a.pos=Math.max(.3,a.pos-.95);a.actionText=d.action+" · 생존 우선";line=a.actionText;
  } else if(d.action==="방어 태세"){
    a.guard=Math.max(a.guard,3);
    a.pos=Math.max(.45,a.pos-.28);
    a.tendencies.caution=Math.min(100,a.tendencies.caution+2.5);
    a.actionText="방어 태세 · 교환 준비";
    line=a.actionText;
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
  const counterCandidates=n.filter(x=>x.id!==a.id&&x.team!==a.team&&x.alive&&(hpBefore.get(x.id)??x.hp)>x.hp&&dist(x,a)<=Math.max(1.35,x.range)&&x.cooldown<=0);
  if(counterCandidates.length&&Math.random()<.32){
    const counter=counterCandidates.slice().sort((x,y)=>dist(x,a)-dist(y,a))[0];
    const counterDamage=hit(counter,a,.58);
    a.hp=Math.max(0,a.hp-counterDamage);
    a.alive=a.hp>0;
    counter.cooldown=Math.max(counter.cooldown,1.1);
    counter.behaviorCounts!["반격"]=(counter.behaviorCounts!["반격"]||0)+1;
    counter.battleStats!.damage+=counterDamage;
    fx(a,"critical","반격 -"+counterDamage);
  }
  if(["광폭 돌격","수호 맹세","결투 집중","정밀 사격","사냥 본능","심판","철벽 진형","원소 폭발","저주 확산","비전 해방","대회복","분열","함정 투척","매복 함정","거미줄","무리 사냥","약점 추적","연계 공격","전투 함성","지휘 명령","측면 습격","급강하","굴 파기 기습","독성 압박","매혹","대지 강타","회피 기동","역할 분석","전선 재편","둥지 확장","공포의 심문","영역 지배","광폭화"].includes(d.action))a.cooldown=1.2;
  n.forEach(x=>{if(!x.alive)x.hp=0;if(x.guard>0&&x.id!==a.id)x.guard-=.2;if(x.id!==a.id&&x.cooldown>0)x.cooldown=Math.max(0,x.cooldown-.25);});
  n.forEach(x=>{const before=hpBefore.get(x.id)||x.hp;const delta=before-x.hp;if(x.id!==a.id&&delta>0){a.battleStats!.damage+=Math.round(delta);if(x.team!==a.team&&x.hp<=0&&before>0)a.battleStats!.kills=(a.battleStats!.kills||0)+1;}if(x.id!==a.id&&delta<0)a.battleStats!.healing+=Math.round(-delta);if(x.id!==a.id&&x.team!==a.team&&delta>0)x.battleStats!.taken=(x.battleStats!.taken||0)+Math.round(delta);});
  const personalityLine=a.team==="player"&&((a.personality?.favoriteAction===d.action)||Math.random()<.26)?personalityBattleLine(a as any,d.action):"";
  const finalLine=personalityLine?(line||a.actionText)+" · "+personalityLine:(line||a.actionText);
  return {units:n,decision:d,line:finalLine};
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

const growthOptionsFor=(hero:Hero,primary:GrowthReward):GrowthReward[]=>{
  const traitByJob:Record<Job,string[]>={
    Warrior:["정예 토벌자","재도전 숙련자","전장 분석가"],
    Guardian:["수호 전술가","전장 분석가","재도전 숙련자"],
    Archer:["전장 분석가","정예 토벌자","재도전 숙련자"],
    Mage:["전장 분석가","정예 토벌자","재도전 숙련자"],
    Cleric:["연전 회복관","수호 전술가","재도전 숙련자"]
  };
  const artifactNames=["보스의 핵편","심층 탐사 기록","생환자의 표식","연전의 깃발","보물 탐사의 인장","정예 토벌의 훈장"];
  const names=primary.kind==="trait"?traitByJob[hero.job]:artifactNames;
  const candidates=names
    .filter(name=>name!==primary.name)
    .map(name=>primary.kind==="trait"
      ? ({kind:"trait" as const,name,detail:growthTraitCatalog[name]?.detail||"전투 경험으로 형성된 특성입니다.",source:"전투 성장 후보",heroId:hero.id})
      : ({kind:"artifact" as const,name,detail:growthArtifactCatalog[name]?.detail||"전투 경험으로 얻은 기재입니다.",source:"전투 성장 후보",heroId:hero.id}))
    .filter(x=>x.kind==="trait"?!(hero.traits||[]).includes(x.name):!(hero.artifacts||[]).includes(x.name));
  return [primary,...candidates].slice(0,2);
};

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

const rarityRankForItem:Record<string,number>={일반:1,희귀:2,영웅:3,전설:4,신화:5};
const itemRecommendationScore=(hero:Hero,item:Item)=>{
  const combat=item.combatMods||{};
  const ai=item.aiMods||{};
  const t=hero.tendencies;
  let score=item.level*4+(rarityRankForItem[item.rarity]||0)*18+(item.unique?32:0);
  score+=(combat.attack||0)*(8+t.aggression/20);
  score+=(combat.defense||0)*(7+t.protect/20+t.survival/25);
  score+=(combat.hpPct||0)*(3+t.survival/30);
  score+=(combat.speedPct||0)*(4+t.pursuit/35);
  score+=(combat.range||0)*(5+t.focus/25);
  score+=(combat.healPct||0)*(4+t.protect/25);
  score+=(combat.critPct||0)*(4+t.focus/25+t.aggression/35);
  (Object.keys(tendencyKo) as (keyof Tendencies)[]).forEach(k=>{
    const relevance=(t[k]/100);
    score+=(ai[k]||0)*(9+relevance*14);
  });
  return score;
};
const recommendedLoadout=(hero:Hero,items:Item[])=>{
  const slots=equipmentSlotsOf(hero);
  const pool=items.slice().sort((a,b)=>itemRecommendationScore(hero,b)-itemRecommendationScore(hero,a));
  const used=new Set<string>();
  const picks:{slot:number;item:Item;score:number;current?:Item;gain:number}[]=[];
  for(const slot of [0,1,2]){
    const current=slots[slot];
    const candidates=pool.filter(x=>!used.has(x.id) && x.id!==current?.id);
    const best=candidates[0];
    if(!best) continue;
    const currentScore=current?itemRecommendationScore(hero,current):0;
    const bestScore=itemRecommendationScore(hero,best);
    if(!current || bestScore>currentScore+10){
      picks.push({slot,item:best,score:bestScore,current,gain:Math.round(bestScore-currentScore)});
      used.add(best.id);
    }
  }
  return picks;
};

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
  const [challengeMode,setChallengeMode]=useState<"defense"|"raid"|undefined>();
  const [challengeLevel,setChallengeLevel]=useState(10);
  const [npcOpen,setNpcOpen]=useState(false);
  const [npcTalkIndex,setNpcTalkIndex]=useState(0);
  const [lastLoot,setLastLoot]=useState<Item[]>([]);
  const [pendingEvent,setPendingEvent]=useState<DungeonChoiceEvent|undefined>();
  const [pendingGrowth,setPendingGrowth]=useState<{heroId:string;options:GrowthReward[];source:string}|undefined>();
  const [battle,setBattle]=useState<{units:BattleUnit[];log:string[];room:RoomKind;round:number;tick:number;ended:boolean;result?:string;next?:string;mode:BattleMode;wave:number;deadline?:number;objectiveHp:number;phase:number;objectiveKind?:DefenseObjective;environment?:EnvironmentKind;repeatScenarioFloor?:number;repeatCount?:number;rewardMultiplier?:number;elitePack?:boolean;phaseNotice?:string;partyMemory?:PartyMemory;plan?:BattlePlan;bossIntro?:{name:string;species:string;subtitle:string;quote:string}}>({units:[],log:[],room:"battle",round:0,tick:0,ended:false,mode:"dungeon",wave:1,objectiveHp:100,phase:1,bossIntro:undefined,partyMemory:defaultPartyMemory});
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
  const openNpc=()=>{setNpcTalkIndex(x=>x+1);setNpcOpen(true);};

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
        gold:s.gold+outcome.gold+outcome.materials*10,
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
      const treasureRange=dungeonLevelRange(save.floor,save.sealCount||0);
      const treasureLevel=treasureRange.max;
      const uniqueBase=uniqueItems[Math.floor(Math.random()*uniqueItems.length)];
      const uniqueDrop=Math.random()<.12 ? uniqueLootCopy(uniqueBase,treasureLevel) : undefined;
      const item=uniqueDrop||randomGeneralItem(treasureLevel,partyPref);
      const canStoreTreasure=save.items.length<MAX_WAREHOUSE_ITEMS;
      setSave(s=>({...s,items:canStoreTreasure?addWarehouseItems(s.items,[item]):s.items,gold:s.gold+180,routeMemory:recordRouteMemory(s.routeMemory,"treasure",true,180),stage:s.stage+1}));
      const recipient=save.heroes.filter(h=>save.party.includes(h.id)&&((h.artifacts||[]).length<4)).sort((a,b)=>b.tendencies.greed-a.tendencies.greed)[0];
      const growth=recipient&&treasureArtifactReward(recipient,save.floor);
      if(growth) setSave(s=>applyGrowthRewardSave(s,growth,recipient.id));
      notify("보물: "+item.name+(uniqueDrop?" · 고유 장비 발견":"")+(canStoreTreasure?" 획득":" · 창고가 가득 차 장비는 보관하지 못함")+(growth?" · "+growth.name+" 발견":""));
      return;
    }
    if(kind==="rest"){
      setSave(s=>({...s,heroes:s.heroes.map(h=>save.party.includes(h.id)?{...grantExperience(h,4).hero,hp:Math.round(h.hp*1.15)}:h),routeMemory:recordRouteMemory(s.routeMemory,"rest",true,0),stage:s.stage+1}));
      notify("휴식: 경험 기록 +4 · HP 15% 회복");
      return;
    }
    const env=environmentFor(save.floor,kind,"dungeon");
    const units=spawn(save.heroes,save.party,kind,save.floor,save.monsterLineages,"dungeon",save.sealCount||0);
    setMode("dungeon");
    const plan=battlePlanFor(party,"dungeon");
    const boss=units.find(u=>u.team==="enemy"&&u.grade==="Boss");
    const bossIntro=boss&&(kind==="boss"||kind==="evilCave")?bossIntroFor(save.floor,kind,boss.name,boss.species||"Demon"):undefined;
    setBattle({units,plan,log:[roomKo[kind]+" · "+formationLabel(party,"dungeon")+" · "+plan.label+" · "+environmentInfo[env].name+" · 전투 명령은 AI가 전부 결정합니다."+(bossIntro?" · "+bossIntro.name+" 등장":"")],room:kind,round:1,tick:0,ended:false,next:units[0].id,mode:"dungeon",wave:1,objectiveHp:100,phase:1,environment:env,bossIntro,partyMemory:save.partyMemory||defaultPartyMemory});
    setPaused(!!bossIntro);setScreen("battle");setDecision(bossIntro?"보스 등장 연출 · 전장의 압박을 분석 중...":"AI가 첫 행동을 분석 중...");
    if(bossIntro)window.setTimeout(()=>{setBattle(b=>({...b,bossIntro:undefined}));setPaused(false);},2800);
  };

  const startRepeat=(scenarioFloor:number)=>{
    if(save.worldSealed){notify("세계의 구멍이 이미 봉인되었습니다.");return;}
    const repeatCount=(save.scenarioClears[String(scenarioFloor)]||1);
    const elitePack=Math.random()<.25;
    const room:RoomKind=elitePack?"elite":"battle";
    const env=environmentFor(scenarioFloor,room,"dungeon");
    const units=spawn(save.heroes,save.party,room,scenarioFloor,save.monsterLineages,"dungeon",save.sealCount||0);
    const rewardMultiplier=Math.max(.3,.6-.1*Math.max(0,repeatCount-1));
    const plan=battlePlanFor(party,"dungeon");    setBattle({units,plan,log:[scenarioFloor+"F 완료 시나리오 재도전 · "+formationLabel(party,"dungeon")+" · "+plan.label+" · 반복 "+repeatCount+"회 · "+(elitePack?"정예 무리 출현":"일반 적 편성")+" · 보상 "+Math.round(rewardMultiplier*100)+"%"],room,round:1,tick:0,ended:false,next:units[0].id,mode:"dungeon",wave:1,objectiveHp:100,phase:1,environment:env,partyMemory:save.partyMemory||defaultPartyMemory,repeatScenarioFloor:scenarioFloor,repeatCount,rewardMultiplier,elitePack});
    setPaused(false);setScreen("battle");setDecision(elitePack?"재도전 중 정예 무리의 전투 성향을 분석 중...":"완료 시나리오의 적 행동을 다시 분석 중...");
  };

  const challengeLevels=()=>{
    const maxHeroLevel=Math.max(10,...save.heroes.map(h=>h.level));
    const maxLevel=Math.max(10,Math.floor(maxHeroLevel/10)*10);
    return Array.from({length:maxLevel/10},(_,i)=>(i+1)*10);
  };
  const startMode=(nextMode:BattleMode,challenge=save.floor*5)=>{
    setMode(nextMode);
    const room:RoomKind=nextMode==="raid"?"boss":"battle";
    const challengeFloor=Math.max(1,Math.ceil(challenge/5));
    const env=environmentFor(challengeFloor,room,nextMode);
    const units=spawn(save.heroes,save.party,room,challenge,save.monsterLineages,nextMode,save.sealCount||0);
    const objectiveKind=defenseObjectiveForFloor(challengeFloor);
    const label=nextMode==="defense"
      ? `방어전 Lv.${challenge} · ${defenseObjectiveKo[objectiveKind]} · ${formationLabel(party,nextMode)} · 30초 동안 웨이브가 계속됩니다.`
      : `보스 레이드 Lv.${challenge} · ${raidBossForFloor(challengeFloor)} 보스 · ${formationLabel(party,nextMode)} · 페이즈는 AI가 자동 전환됩니다.`;
    const plan=battlePlanFor(party,nextMode);
    const boss=units.find(u=>u.team==="enemy"&&u.grade==="Boss");
    const bossIntro=nextMode==="raid"&&boss?bossIntroFor(challengeFloor,"boss",boss.name,boss.species||raidBossForFloor(challengeFloor)):undefined;
    setBattle({units,plan,log:[label+" · "+plan.label+" · "+environmentInfo[env].name+(bossIntro?" · "+bossIntro.name+" 등장":"")],room,round:1,tick:0,ended:false,next:units[0].id,mode:nextMode,wave:1,deadline:nextMode==="defense"?Date.now()+30000:undefined,objectiveHp:100,phase:1,objectiveKind,environment:env,bossIntro,partyMemory:save.partyMemory||defaultPartyMemory});
    setPaused(!!bossIntro);setScreen("battle");setChallengeMode(undefined);
    setDecision(bossIntro?"보스 등장 연출 · 고유 패턴을 분석 중...":nextMode==="defense"?"방어 목표와 생존 경로를 계산 중...":"보스 패턴과 페이즈 전환을 분석 중...");
    if(bossIntro)window.setTimeout(()=>{setBattle(b=>({...b,bossIntro:undefined}));setPaused(false);},2800);
  };
  const openChallenge=(nextMode:"defense"|"raid")=>{
    const levels=challengeLevels();
    setChallengeMode(nextMode);
    setChallengeLevel(levels[0]);
  };

  useEffect(()=>{
    if(screen!=="battle"||paused||battle.ended)return;
    const timer=window.setTimeout(()=>{
      setBattle(prev=>{
        if(prev.ended||!prev.units.length)return prev;
        const alive=prev.units.filter(x=>x.alive);
        if(!alive.length)return {...prev,ended:true,result:"defeat"};
        const actorPool=alive.slice().sort((a,b)=>turnSpeed(b)-turnSpeed(a)).slice(0,Math.min(10,alive.length));
        const actorTotalSpeed=actorPool.reduce((n,x)=>n+Math.max(.25,turnSpeed(x)),0);
        let actorRoll=Math.random()*actorTotalSpeed;
        let actor=actorPool[actorPool.length-1];
        for(const candidate of actorPool){actorRoll-=Math.max(.25,turnSpeed(candidate));if(actorRoll<=0){actor=candidate;break;}}
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
              const levelRange=dungeonLevelRange(save.floor,save.sealCount||0);
              const defenseLevel=levelRange.min+((i+wave+Math.max(0,save.floor-1))%5);
              const m=scaleMonsterForSeals(createLinedMonster(pool[(i+wave+save.floor)%pool.length],defenseLevel,waveGrade,i,save.monsterLineages),save.sealCount||0);
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
    },Math.max(85,360/speed));
    return ()=>window.clearTimeout(timer);
  },[screen,paused,battle.ended,speed,battle.tick,battle.mode,save.floor]);

  useEffect(()=>{
    if(screen!=="battle"||!battle.ended)return;
    const progressionNotices:string[]=[];
    const victory=battle.result==="victory";
    const deadIds=battle.units.filter(u=>u.team==="player"&&!u.alive).map(u=>u.id);
    const isRepeat=battle.repeatScenarioFloor!==undefined;
    const isElite=battle.room==="elite"||!!battle.elitePack;
    const isBoss=battle.room==="boss"||battle.room==="evilCave";
    const isFinal=battle.room==="evilCave";
    const baseStats={wins:0,losses:0,eliteWins:0,bossWins:0,repeatWins:0,finalWins:0};
    const buildHero=(h:Hero,unit:BattleUnit|undefined,won:boolean,stats:any,experienceGain:number)=>{
      if(!unit)return h;
      const base={...h,campaignStats:stats};
      const previousProfile=h.combatProfile||{actions:0,damage:0,healing:0,battles:0,topActions:{}};
      const actionCounts={...previousProfile.topActions};
      Object.entries(unit.behaviorCounts||{}).forEach(([name,count])=>{const gained=Math.max(0,count);if(gained)actionCounts[name]=(actionCounts[name]||0)+gained;});
      const combatProfile={actions:previousProfile.actions+(unit.battleStats?.actions||0),damage:previousProfile.damage+(unit.battleStats?.damage||0),healing:previousProfile.healing+(unit.battleStats?.healing||0),battles:previousProfile.battles+1,topActions:actionCounts};
      const withProfile={...base,combatProfile};
      const beforePromotion=promotionLabel(withProfile);
      const progressed=grantExperience(withProfile,experienceGain);
      if(progressed.leveled){
        progressionNotices.push(`${h.name} Lv.${progressed.hero.level} 달성`);
        if(promotionLabel(progressed.hero)!==beforePromotion) progressionNotices.push(`${h.name} 자동 전직 · ${promotionLabel(progressed.hero)}`);
      }
      const behaviorBase=applyBehaviorHistory(progressed.hero,unit.behaviorCounts||{});
      const behavioral={...behaviorBase,
        ...(isFinal&&won?{statusNote:"악의 동굴 수문장 격파 · 봉인 대기"}:{}),
        history:unit.actionText?[unit.actionText,...behaviorBase.history].slice(0,6):behaviorBase.history};
      const awarded=awardChronicle(behavioral);
      return {...awarded,mood:systemMood(awarded),statusNote:systemStatus(awarded),evaluation:systemEvaluation(awarded)};
    };
    let battleGrowthReward:GrowthReward|undefined;
    if(victory){
      battleGrowthReward = isBoss ? bossClearReward(battle.units,save.heroes) :
        isElite&&!isRepeat ? eliteClearReward(battle.units,save.heroes) :
        isRepeat ? repeatClearReward(battle.units,save.heroes,battle.repeatCount||0) : undefined;
      if(!battleGrowthReward){
        for(const unit of battle.units.filter(u=>u.team==="player"&&u.alive)){
          const h=save.heroes.find(x=>x.id===unit.id);
          if(h){
            const candidate=milestoneReward(h,unit.behaviorCounts||{});
            if(candidate){battleGrowthReward=candidate;break;}
          }
        }
      }
    }
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
          const gained=Math.max(0,count);
          if(action==="아군 보호"||action==="수호 맹세"||action==="철벽 진형")m.protection+=gained;
          if(action==="회복"||action==="대회복")m.recovery+=gained;
        });
        return m;
      },{protection:0,recovery:0});
      const nextPartyMemory={battles:previousPartyMemory.battles+1,protection:previousPartyMemory.protection+partyDelta.protection,recovery:previousPartyMemory.recovery+partyDelta.recovery,losses:previousPartyMemory.losses+(victory?0:1)};
      if(victory&&battle.room==="boss")scenarioClears[String(s.floor)]=(scenarioClears[String(s.floor)]||0)+1;
      if(victory&&isRepeat)scenarioClears[String(battle.repeatScenarioFloor)]=(scenarioClears[String(battle.repeatScenarioFloor)]||1)+1;
      const rewardMultiplier=isRepeat?(battle.rewardMultiplier||.6):1;
      // 세계 회차가 올라가도 전리품과 기본 보상이 이전 회차 기준으로 되돌아가지 않도록
      // 현재 던전 적 레벨 구간을 보상 기준으로 함께 사용한다.
      const rewardRange=dungeonLevelRange(s.floor,s.sealCount||0);
      const worldRewardMultiplier=1+Math.max(0,rewardRange.worldRound-1)*.35;
      const worldMaterialMultiplier=1+Math.max(0,rewardRange.worldRound-1)*.25;
      const floorRewardMultiplier=1+Math.max(0,rewardRange.floor-1)*.04;
      const enemyCount=battle.units.filter(u=>u.team==="enemy").length;
      const rewardProgressMultiplier=worldRewardMultiplier*floorRewardMultiplier;
      const challengeTier=battle.mode==="defense"||battle.mode==="raid"?Math.max(1,Math.floor(((battle.units.find(u=>u.team==="enemy")?.level||save.floor*5))/10)):0;
      const challengeRewardMultiplier=challengeTier?1+Math.max(0,challengeTier-1)*.12:1;
      const baseGold=Math.round((180+enemyCount*55+(isBoss?900:0)+(isFinal?1800:0))*rewardProgressMultiplier*challengeRewardMultiplier);
      const baseMaterials=Math.round((isFinal?100:isBoss?60:18)*worldMaterialMultiplier*floorRewardMultiplier*challengeRewardMultiplier);
      // 경험치도 현재 회차/층의 적 레벨을 기준으로 상승시켜, 2회차 이후에도 성장 속도가 자연스럽게 이어지도록 한다.
      // 기본 경험치는 레벨의 65%를 추가하고, 정예/보스 보너스는 기존 역할을 유지한다.
      const levelExpBonus=Math.round(rewardRange.max*.65);
      const expBase=30+levelExpBonus+(isElite?20:0)+(isBoss?80:0)+(isFinal?120:0);
      const exp=Math.max(8,Math.round(expBase*(isRepeat?.9:1)));
      const challengeExpBonus=battle.mode==="defense"||battle.mode==="raid"?Math.round(exp*Math.max(0,challengeTier-1)*.1):0;
      const experienceGain=victory?exp+challengeExpBonus:Math.max(8,Math.round((exp+challengeExpBonus)*.7));
      const rewardItemLevel=rewardRange.max+(isBoss?2:0);
      const loot=victory?rollBattleLoot(Math.max(1,rewardItemLevel),battle.room,partyPreference(s.party.map(id=>s.heroes.find(h=>h.id===id)).filter((h):h is Hero=>!!h) as Hero[]),rewardMultiplier):[];
      const storedLoot=victory?loot.slice(0,Math.max(0,MAX_WAREHOUSE_ITEMS-s.items.length)):[];
      const overflowLoot=victory?loot.slice(storedLoot.length):[];
      // 창고가 가득 찬 경우 전리품을 완전히 버리지 않고 희귀도에 따라 골드로 전환한다.
      // 기존 창고 한도와 드랍 수에는 영향을 주지 않아 경제 변동을 작게 유지한다.
      const overflowGold=overflowLoot.reduce((sum,item)=>sum+({일반:35,고급:75,희귀:120,영웅:200,전설:350,고대:425,신화:500}[item.rarity]||60),0);
      const routeLearning=battle.mode==="dungeon"&&!isRepeat&&(battle.room==="battle"||battle.room==="elite"||battle.room==="boss"||battle.room==="evilCave");
      if(victory) setLastLoot(storedLoot);
      if(victory&&storedLoot.length) window.setTimeout(()=>notify("전리품 획득 · "+storedLoot.map(x=>x.name).join(" · ")),0);
      if(victory&&overflowLoot.length) window.setTimeout(()=>notify("창고가 가득 차 "+overflowLoot.length+"개 전리품을 골드로 전환했습니다. +"+overflowGold+"G"),0);
      let nextHeroes=s.heroes.map(h=>{
        if(!s.party.includes(h.id))return h;
        return buildHero(bonded.find(x=>x.id===h.id)||h,battle.units.find(u=>u.id===h.id),victory,statsById[h.id],experienceGain);
      });
      if(victory&&battleGrowthReward?.heroId){
        progressionNotices.push("성장 후보 · "+battleGrowthReward.name);
      }
      return {...s,
        gold:s.gold+(victory?(Math.round(baseGold*rewardMultiplier)+overflowGold+Math.max(50,Math.round(baseMaterials*rewardMultiplier)*10)):0),
        items:victory?addWarehouseItems(s.items,storedLoot):s.items,
        scenarioClears,
        monsterLineages:nextLineages,
        floor:victory&&isBoss?s.floor+1:s.floor,
        stage:victory?(isBoss?0:(isFinal?s.stage:s.stage+1)):s.stage,
        routeMemory:routeLearning?recordRouteMemory(s.routeMemory,battle.room,victory,victory?Math.round(baseGold*rewardMultiplier):0):s.routeMemory,
        heroes:nextHeroes
      };
    });
    if(battleGrowthReward?.heroId){
      const targetHero=save.heroes.find(h=>h.id===battleGrowthReward!.heroId);
      const capacity=battleGrowthReward.kind==="trait" ? (targetHero?.traits||[]).length<4 : (targetHero?.artifacts||[]).length<4;
      if(targetHero&&capacity){
        const options=growthOptionsFor(targetHero,battleGrowthReward);
        if(options.length) setPendingGrowth({heroId:targetHero.id,options,source:battleGrowthReward.source});
      }
    }
    if(progressionNotices.length) window.setTimeout(()=>notify("성장 갱신 · "+progressionNotices.join(" · ")),0);
  },[battle.ended,battle.result]);

  const chooseGrowth=(reward:GrowthReward)=>{
    if(!pendingGrowth)return;
    setSave(s=>({...s,heroes:applyGrowthRewardHeroes(s.heroes,reward,pendingGrowth.heroId,s.floor)}));
    setPendingGrowth(undefined);
    notify(reward.name+" 습득 · "+reward.source);
  };

  const toggleParty=(id:string)=>{
    if(save.party.includes(id)){if(save.party.length===1)return;setSave(s=>({...s,party:s.party.filter(x=>x!==id)}));}
    else if(save.party.length<4)setSave(s=>({...s,party:s.party.concat(id)}));
    else notify("데모 파티 최대 4명");
  };
  const recommendEquip=()=>{
    const picks=recommendedLoadout(hero,save.items);
    if(picks.length===0){notify(hero.name+" · 현재 장비보다 뚜렷하게 좋은 추천 장비가 없습니다.");return;}
    setSave(s=>{
      let items=s.items.slice();
      let heroes=s.heroes.map(h=>{
        if(h.id!==selectedHero)return h;
        const slots=equipmentSlotsOf(h);
        for(const pick of picks){
          const removed=slots[pick.slot];
          if(removed) items.push(removed);
          slots[pick.slot]=pick.item;
          items=items.filter(x=>x.id!==pick.item.id);
        }
        return {...h,equipment:slots,item:slots[0]};
      });
      return {...s,heroes,items};
    });
    setSelectedWarehouseItem(undefined);
    notify(hero.name+" · 추천 장비 "+picks.length+"칸 자동 장착");
  };

  const enhanceItem=(itemId:string)=>{
    let target:Item|undefined;
    for(const x of save.items)if(x.id===itemId){target=x;break;}
    if(!target){
      for(const h of save.heroes)for(const x of equipmentSlotsOf(h))if(x?.id===itemId){target=x;break;}
    }
    if(!target){notify("강화할 장비를 찾을 수 없습니다.");return;}
    const current=enhancementLevel(target);
    if(current>=MAX_ENHANCEMENT){notify(target.name+" · 이미 +15 최대 강화입니다.");return;}
    const cost=enhancementCost(target);
    if(save.gold<cost){notify("골드가 부족합니다. 필요 골드 "+cost+"G");return;}
    const next=current+1;
    setSave(s=>({
      ...s,
      gold:s.gold-cost,
      items:s.items.map(x=>x.id===itemId?{...x,enhancement:next}:x),
      heroes:s.heroes.map(h=>({
        ...h,
        equipment:equipmentSlotsOf(h).map(x=>x?.id===itemId?{...x,enhancement:next}:x) as [Item?,Item?,Item?],
        item:equipmentSlotsOf(h)[0]?.id===itemId?{...equipmentSlotsOf(h)[0]!,enhancement:next}:h.item
      }))
    }));
    notify(target.name+" · 강화 +"+next+" 성공 · -"+cost+"G");
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
    if(save.items.length>=MAX_WAREHOUSE_ITEMS){notify("용사단 창고가 가득 차 장비를 해제할 수 없습니다.");return;}
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
  const chooseHeroPromotion=(heroId:string,name:string)=>{
    const target=save.heroes.find(h=>h.id===heroId);
    if(!target)return;
    const next=choosePromotion(target,name);
    if(!next){notify("선택할 수 없는 전직입니다.");return;}
    setSave(s=>({...s,heroes:s.heroes.map(h=>h.id===heroId?next:h)}));
    notify(target.name+" · "+name+" 전직 완료");
  };
  const upgradeHeroPassive=(heroId:string,skillId:string)=>{
    const target=save.heroes.find(h=>h.id===heroId);
    if(!target)return;
    const next=upgradePassive(target,skillId);
    if(!next){notify(target.skillPoints&&target.skillPoints>0?"이미 최대 레벨이거나 사용할 수 없는 패시브입니다.":"사용할 스킬 포인트가 없습니다.");return;}
    const skill=passiveSetFor(next).skills.find(s=>s.id===skillId);
    setSave(s=>({...s,heroes:s.heroes.map(h=>h.id===heroId?next:h)}));
    notify(target.name+" · "+(skill?.name||"패시브")+" Lv."+(next.passiveSkills?.[skillId]||0)+" 강화");
  };
  const transcendHero=(heroId:string)=>{
    const target=save.heroes.find(h=>h.id===heroId);
    if(!target)return;
    const star=heroStar(target);
    if(star>=6){notify(target.name+" · 6성 최대 초월");return;}
    const req=transcendenceRequirement(target)!;
    if(target.level<req.level){notify(target.name+" · Lv."+req.level+"부터 "+(star+1)+"성 초월 가능");return;}
    if(save.gold<req.gold){notify("초월 골드 부족 · 필요 골드 "+req.gold+"G");return;}
    const nextStar=star+1;
    setSave(s=>({...s,
      gold:s.gold-req.gold,
      heroes:s.heroes.map(h=>h.id!==heroId?h:{...h,star:nextStar,history:["초월 · "+nextStar+"성 도달",...(h.history||[])].slice(0,6),statusNote:nextStar+"성 초월 완료 · 특성 강화 ×"+traitStrengthMultiplier({...h,star:nextStar}).toFixed(1)})
    }));
    notify(target.name+" · "+nextStar+"성 초월 완료 · 특성 강화 ×"+traitStrengthMultiplier({...target,star:nextStar}).toFixed(1));
  };
  const equipSkin=(skinId:string)=>{
    const available=costumesForJob(hero.job).some(s=>s.id===skinId);
    if(!available){notify("이 캐릭터에게 사용할 수 없는 스킨입니다.");return;}
    if(!(hero.skinIds||[]).includes(skinId)){notify("먼저 스킨을 해금해야 합니다.");return;}
    setSave(s=>({...s,heroes:s.heroes.map(h=>h.id===selectedHero?{...h,equippedSkinId:skinId,costumeId:skinId,skinIds:Array.from(new Set([...(h.skinIds||[]),skinId]))}:h)}));
    notify(hero.name+" · "+skinLabel(hero.job,skinId)+" 장착");
  };
  const unlockSkin=(skinId:string)=>{
    const skin=costumesForJob(hero.job).find(s=>s.id===skinId);
    if(!skin)return;
    if((hero.skinIds||[]).includes(skinId)){equipSkin(skinId);return;}
    const cost=skinCost(skin);
    if(save.gold<cost.gold){notify("스킨 해금 골드가 부족합니다. "+skinUnlockText(skin)+" 필요");return;}
    setSave(s=>({...s,gold:s.gold-cost.gold,heroes:s.heroes.map(h=>h.id===selectedHero?{...h,skinIds:Array.from(new Set([...(h.skinIds||[]),skinId]))}:h)}));
    notify(hero.name+" · "+skinLabel(hero.job,skinId)+" 해금");
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
      const storedEventEquipment=outcome.rewardKind==="equipment"&&!!outcome.rewardItem&&s.items.length<MAX_WAREHOUSE_ITEMS;
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
          if(outcome.rewardKind==="equipment"&&!storedEventEquipment)return h;
          const detail=outcome.rewardKind==="trait"?(traitEffect?.detail||"던전 이벤트에서 획득한 특성입니다."):outcome.rewardKind==="artifact"?(artifactEffect?.detail||"던전 이벤트에서 획득한 기재입니다."):(outcome.rewardItem?.description||"던전 이벤트에서 획득한 장비입니다.");
          const records=[...(h.eventRewards||[]),{kind:outcome.rewardKind,name:outcome.rewardName,floor:s.floor,detail}].slice(-8);
          return {...h,eventRewards:records};
        }),
        items:storedEventEquipment&&outcome.rewardItem?addWarehouseItems(s.items,[outcome.rewardItem]):s.items,
        gold:s.gold+outcome.gold,stage:s.stage+1
      };
    });
    setPendingEvent(undefined);
    const rewardText=outcome.rewardKind==="trait"&&outcome.rewardName?" · "+outcome.rewardName+" 특성 획득":outcome.rewardKind==="artifact"&&outcome.rewardName?" · "+outcome.rewardName+" 기재 획득":outcome.rewardKind==="equipment"&&outcome.rewardItem?(save.items.length<MAX_WAREHOUSE_ITEMS?" · "+outcome.rewardItem.name+" 장비 획득":" · 장비 보상은 창고 가득 참으로 보류"):"";
    const reactionHero=save.heroes.filter(h=>save.party.includes(h.id)).slice().sort((x,y)=>(y.tendencies[choice.tendency]||0)-(x.tendencies[choice.tendency]||0))[0];
    const reaction=reactionHero?personalityEventReaction(reactionHero,choice.id):"";
    notify(outcome.text+rewardText+(reaction?" · "+reaction:"")+" · +"+outcome.gold+"G");
  };

  const sealWorld=()=>{
    setSave(s=>{
      const nextSeal=(s.sealCount||0)+1;
      const nextHeroes=s.heroes.map(h=>{
        const next={...h,statusNote:"세계의 구멍 봉인 완료 · "+nextSeal+"회차"};
        const awarded=awardChronicle(next);
        return {...awarded,mood:systemMood(awarded),statusNote:systemStatus(awarded),evaluation:systemEvaluation(awarded)};
      });
      return {...s,worldSealed:false,sealCount:nextSeal,floor:1,stage:0,scenarioClears:{},heroes:nextHeroes};
    });
    setMode("dungeon");
    setScreen("home");
    notify("세계의 구멍을 "+((save.sealCount||0)+1)+"회 봉인했습니다. 다음 세계의 적이 강화됩니다.");
  };
  const strategySpendGold=(n:number)=>setSave(s=>({...s,gold:Math.max(0,s.gold-n)}));
  const strategySpendMaterials=(n:number)=>setSave(s=>({...s,gold:Math.max(0,s.gold-n*10)}));
  const strategyRewardGold=(n:number)=>setSave(s=>({...s,gold:s.gold+n}));
  const strategyRewardMaterials=(n:number)=>setSave(s=>({...s,gold:s.gold+n*10}));
  const strategyDispatch=(cityId:string)=>{
    const cityBonus=cityId==="luoyang"?2:cityId==="xuchang"?3:cityId==="chengdu"?4:cityId==="jianye"?5:1;
    // 던전은 세계당 6개 층을 기준으로 레벨 구간을 정의하므로 전략 원정도 6F를 넘기지 않는다.\n    setSave(s=>({...s,floor:Math.max(1,Math.min(6,s.floor+cityBonus)),stage:0}));
    setMode("dungeon");setScreen("dungeon");
    notify("전략 원정 출격 · "+cityId+" 전선으로 연결");
  };
  const reset=()=>{localStorage.removeItem(KEY);localStorage.removeItem("three-kingdoms-campaign-v1");setSave(load());setScreen("home");notify("데모 초기화 완료");};

  return <main className="game-shell">
    <header className="topbar"><div className="brand" onClick={()=>setScreen("home")}><div className="brand-mark"><Brain size={21}/></div><div><b>무한 던전 : AI Chronicle</b><small>자율 AI 던전 RPG / RTS 프로토타입</small></div></div>
      <div className="resources"><span><Coins size={15}/> {save.gold}G</span><span>심도 {save.floor}F</span></div></header>
    <nav className="main-nav">{([["home","로비"],["party","캐릭터"],["dungeon","던전"]] as [Screen,string][]).map(x=><button key={x[0]} className={screen===x[0]?"nav-on":""} onClick={()=>setScreen(x[0])}>{x[1]}</button>)}</nav>
    {toast&&<div className="toast">{toast}</div>}
    {npcOpen&&<div className="npc-overlay" onClick={()=>setNpcOpen(false)}><div className="npc-dialog" onClick={e=>e.stopPropagation()}>
      <div className="npc-dialog-art"><img src={NPC_IMAGE} alt="세라피나"/></div>
      <div className="npc-dialog-body">
        <span className="eyebrow">NPC · WHITE GUIDE</span>
        <h2>세라피나</h2>
        <small>백색의 안내자 · 심도 {save.floor}F · {mode==="dungeon"?"던전":mode==="defense"?"방어전":"보스 레이드"}</small>
        <p>{npcLineFor(save.floor,mode,npcTalkIndex).line}</p>
        <div className="npc-dialog-facts">
          <span><b>역할</b>던전 안내 / 분위기 연출</span>
          <span><b>원칙</b>전투 명령은 플레이어가 직접 내리지 않음</span>
        </div>
        <button className="primary-btn" onClick={()=>setNpcOpen(false)}>대화 닫기</button>
      </div>
    </div></div>}

    {pendingGrowth&&<div className="event-overlay"><div className="event-dialog growth-dialog"><span className="eyebrow">BATTLE GROWTH</span><h2>전투 성장 선택</h2><p>이번 전투에서 형성된 성장 후보입니다. 하나를 선택하면 캐릭터에게 영구 적용됩니다.</p><div className="growth-choice-list">{pendingGrowth.options.map((reward,index)=><button key={reward.kind+"-"+reward.name} className="growth-choice" onClick={()=>chooseGrowth(reward)}><span className="growth-choice-index">{index===0?"★":"+"}</span><span><b>{reward.name}</b><small>{reward.detail}</small><em>{reward.kind==="trait"?"특성 · AI 성향에 영구 반영":"기재 · AI 성향과 전투 보정에 영구 반영"}</em></span><ChevronRight size={17}/></button>)}</div><small className="event-note">전투 명령은 여전히 AI가 결정합니다. 여기서는 전투 결과를 어떻게 장기 성장으로 남길지만 선택합니다.</small></div></div>}

    {pendingEvent&&<div className="event-overlay"><div className="event-dialog"><span className="eyebrow">DUNGEON EVENT</span><h2>{pendingEvent.title}</h2><p>{pendingEvent.text}</p><div className="event-choice-list">{pendingEvent.choices.map(ch=>{const preview=eventRewardPreview(save.heroes,save.party,save.floor,environmentFor(save.floor,"event","dungeon"),ch);let recipientText=" · 이벤트 보상";if(ch.rewardKind==="trait"&&preview.trait)recipientText=" · 「"+preview.trait+"」";else if(ch.rewardKind==="artifact"&&preview.artifact)recipientText=" · 「"+preview.artifact+"」";else if(ch.rewardKind==="equipment"&&preview.equipment)recipientText=" · "+preview.equipment.name+" · "+preview.equipment.stats.slice(0,2).join(" · ");return <button key={ch.id} className="event-choice" onClick={()=>chooseDungeonEvent(ch.id)}><div><b>{ch.label}</b><small>{ch.detail}</small>{ch.rewardKind&&<small className="event-recipient">획득 대상 · {preview.recipient?.name||"파티"}{recipientText}</small>}</div><span>{ch.risk>0?"위험 "+ch.risk:"안전"} · 예상 {ch.reward}G{ch.rewardKind&&<em className="event-reward-label">{ch.rewardKind==="trait"?"특성 획득":ch.rewardKind==="artifact"?"기재 획득":"장비 획득"}</em>}</span></button>})}</div><small className="event-note">선택한 방식이 파티의 해당 성향과 이후 행동 기록에 누적되며, 일부 선택은 성향이 가장 높은 캐릭터에게 특성 또는 기재가 영구 귀속됩니다.</small></div></div>}

    {screen==="strategy"&&<ThreeKingdoms
      gold={save.gold}
      onSpendGold={strategySpendGold}
      onRewardGold={strategyRewardGold}
      onDispatch={strategyDispatch}
      onToast={notify}
    />}

    {screen==="home"&&<section className="page fortress-lobby-page">
      <div className="fortress-header">
        <div>
          <span className="eyebrow">FRONTIER FORTRESS · COMMAND MAP</span>
          <h1>최전선 요새</h1>
          <p className="muted">세계의 구멍을 감시하며 원정대를 출격시키는 전초기지입니다. 플레이어는 요새의 시설과 출격 지점만 선택하고, 전투 행동은 AI가 전부 결정합니다.</p>
        </div>
        <div className="fortress-status">
          <div><span>세계</span><b>{(save.sealCount||0)+1}회차</b><small>적 전투력 +{sealEnemyEnhancement(save.sealCount||0)}%</small></div>
          <div><span>현재 전선</span><b>{save.floor}F</b><small>{save.stage+1}/6 구간</small></div>
          <div><span>봉인 기록</span><b>{save.sealCount||0}회</b><small>{save.worldSealed?"봉인 완료":"세계의 구멍 OPEN"}</small></div>
        </div>
      </div>

      <div className="fortress-map-shell">
        <div className="fortress-map-topbar">
          <div><span className="eyebrow">TACTICAL FRONTLINE MAP</span><b>철벽 전초기지 · 제1 방어선</b><small>시설을 눌러 준비하고, 성문을 통해 전장으로 이동합니다.</small></div>
          
        </div>
        <div className="fortress-map">
          <div className="map-skyline"/>          <div className="map-mountain mountain-a"/>
          <div className="map-mountain mountain-b"/>
          <div className="map-road road-main"/>
          <div className="map-road road-west"/>
          <div className="map-road road-east"/>
          <div className="map-wall wall-north"/><div className="map-wall wall-south"/><div className="map-wall wall-west"/><div className="map-wall wall-east"/>
          <div className="map-tower tower-nw"/><div className="map-tower tower-ne"/><div className="map-tower tower-sw"/><div className="map-tower tower-se"/>

          <button className="fortress-zone zone-barracks" onClick={()=>setScreen("party")}>
            <span className="zone-icon"><UserRound size={21}/></span>
            <span><small>BARRACKS</small><b>원정대 막사</b><em>{save.party.length}/4명 · 현재 전력 관리</em></span>
          </button>
          <button className="fortress-zone zone-forge" onClick={()=>setScreen("inventory")}>
            <span className="zone-icon"><Package size={21}/></span>
            <span><small>DIVINE FORGE</small><b>신성 대장간</b><em>장비 · 골드 강화 · 최대 +15</em></span>
          </button>
          <button className="fortress-zone zone-recruit" onClick={()=>setScreen("recruit")}>
            <span className="zone-icon"><UserPlus size={21}/></span>
            <span><small>RECRUITMENT</small><b>신병 훈련소</b><em>5종 기본 직업 모집</em></span>
          </button>
          <button className="fortress-zone zone-watch" onClick={openNpc}>
            <span className="zone-icon"><Brain size={21}/></span>
            <span><small>WATCHTOWER</small><b>감시탑</b><em>세라피나 · 몬스터 정보 통신</em></span>
          </button>

          <div className="fortress-keep">
            <div className="keep-emblem">⌁</div>
            <span>최전선 본영</span>
            <b>원정 지휘 핵심</b>
            <small>AI CHRONICLE OPERATIONS</small>
          </div>

          <div className="fortress-outer-label outer-north">심층 감시선 · {save.floor}F</div>
          <div className="fortress-outer-label outer-west">보급로</div>
          <div className="fortress-outer-label outer-east">정찰로</div>

          <button className="gate-launch gate-dungeon" onClick={()=>setScreen("dungeon")}>
            <span>⚔</span><b>던전 출격문</b><small>다음 방 선택</small>
          </button>
          <button className="gate-launch gate-defense" onClick={()=>openChallenge("defense")}>
            <span>🛡</span><b>방어선 출격</b><small>{defenseObjectiveKo[defenseObjectiveForFloor(save.floor)]} · 30초 방어</small>
          </button>
          <button className="gate-launch gate-raid" onClick={()=>openChallenge("raid")}>
            <span>♛</span><b>레이드 관문</b><small>{raidBossForFloor(save.floor)} · 3페이즈</small>
          </button>
        </div>
        {challengeMode&&<div className="challenge-modal-backdrop" role="dialog" aria-modal="true">
          <div className="challenge-modal">
            <div className="challenge-modal-head"><div><span className="eyebrow">{challengeMode==="defense"?"DEFENSE FRONT":"BOSS RAID"}</span><h3>{challengeMode==="defense"?"방어전 도전 레벨":"보스 레이드 도전 레벨"}</h3><p>10레벨 단위로 도전 레벨을 직접 선택합니다.</p></div><button className="ghost-btn compact" onClick={()=>setChallengeMode(undefined)}>닫기</button></div>
            <div className="challenge-level-grid">{challengeLevels().map(lv=><button key={lv} className={"challenge-level-btn "+(challengeLevel===lv?"selected":"")} onClick={()=>setChallengeLevel(lv)}><b>Lv.{lv}</b><small>{challengeMode==="defense"?"방어 웨이브":"보스 페이즈"} · 도전</small></button>)}</div>
            <div className="challenge-modal-foot"><span>선택: <b>Lv.{challengeLevel}</b></span><button className="primary-btn" onClick={()=>startMode(challengeMode,challengeLevel)}>Lv.{challengeLevel} 도전 시작</button></div>
          </div>
        </div>}
        <div className="fortress-map-legend">
          <span><i className="legend-ready"/>준비 시설</span>
          <span><i className="legend-road"/>출격 경로</span>
          <span><i className="legend-danger"/>전투 전선</span>
          <span><i className="legend-relic"/>세계의 구멍 감시</span>
        </div>
      </div>

      <div className="fortress-brief-grid">
        <section className="fortress-panel">
          <div className="fortress-panel-head"><div><span className="eyebrow">GARRISON</span><b>주둔 원정대</b><small>출격 전 현재 전력만 확인합니다.</small></div><button className="ghost-btn compact" onClick={()=>setScreen("party")}>막사 열기</button></div>
          <div className="fortress-party-list">{party.length?party.map(h=>{const hp=Math.max(1,Math.min(100,Math.round((h.hp/Math.max(1,combatStats(h).maxHp))*100)));return <div key={h.id}><span className="fortress-party-icon">{jobIcon[h.job]}</span><b>{h.name}</b><small>Lv.{h.level} · {jobKo[h.job]}</small><i><em style={{width:hp+"%"}}/></i><strong>{hp}%</strong></div>}):<small className="muted">편성된 원정대가 없습니다.</small>}</div>
        </section>
        <section className="fortress-panel">
          <div className="fortress-panel-head"><div><span className="eyebrow">SUPPLY</span><b>보급 현황</b><small>출격에 필요한 자원과 창고 상태입니다.</small></div></div>
          <div className="fortress-supply-grid"><div><span>골드</span><b>{save.gold}</b><small>G</small></div><div><span>창고</span><b>{save.items.length}/60</b><small>장비</small></div><div><span>세계</span><b>{(save.sealCount||0)+1}</b><small>현재 회차</small></div></div>
        </section>
      </div>
      <div className="fortress-doctrine"><span className="eyebrow">FORTRESS DOCTRINE</span><b>준비는 요새에서, 판단은 전장에서.</b><small>파티와 장비를 준비한 뒤 출격하면 전투 행동은 AI가 수행합니다.</small></div>
    </section>}

    {screen==="party"&&<section className="page management-page party-page"><div className="section-head"><div><span className="eyebrow">CHARACTERS</span><h2>원정대 구성</h2><p className="muted">전투 전에만 편성과 장비를 변경할 수 있습니다.</p></div><span className="counter">{save.party.length}/4</span></div>
      <div className="party-grid">{save.heroes.map(h=><HeroCard key={h.id} hero={h} active={save.party.includes(h.id)} onClick={()=>{setSelectedHero(h.id);toggleParty(h.id)}} onStatus={()=>{setSelectedHero(h.id);setStatusHeroId(h.id)}}/>)}</div>
      <div className="subpanel party-command-strip"><div><b>현재 편성</b><span>{party.map(h=>jobIcon[h.job]+" "+h.name).join(" · ")||"편성된 파티 없음"}</span><small>출격 후 전투 행동은 AI가 자동으로 결정됩니다.</small></div><div className="party-command-actions"><button className="ghost-btn compact" onClick={()=>setScreen("inventory")}><Package size={15}/> 장비실</button><button className="primary-btn compact" onClick={()=>setScreen("dungeon")}><Swords size={16}/> 출격 준비</button></div></div><div className="character-equipment-panel">
        <div className="character-equipment-head">
          <div><span className="eyebrow">CHARACTER EQUIPMENT</span><b>캐릭터별 장비창</b><small>캐릭터를 선택하고 3개 슬롯을 관리합니다. 아래 인벤토리는 현재 선택한 캐릭터와 바로 연결됩니다.</small></div>
          <div className="equipment-head-actions"><button className="ghost-btn" onClick={recommendEquip}>✦ 추천 장착</button><button className="ghost-btn" onClick={()=>setScreen("inventory")}><Package size={15}/> 인벤토리 열기</button></div>
        </div>
        <div className="character-selector">{save.heroes.map(h=><button key={h.id} className={"character-selector-card "+(selectedHero===h.id?"active":"")} onClick={()=>{setSelectedHero(h.id);setSelectedEquipSlot(0);setSelectedWarehouseItem(undefined)}}>
          <span className="hero-avatar mini skin-avatar" style={{background:skinTheme(h.equippedSkinId||h.costumeId).background}}><SkinPortrait job={h.job} skinId={h.equippedSkinId||h.costumeId} compact /></span>
          <span><b>{h.name}</b><small>{jobKo[h.job]} · Lv.{h.level}</small></span>
          <em>{equippedItemsOf(h).length}/3</em>
        </button>)}</div>
        <div className="character-equipment-layout">
          <div className="character-equipment-sheet">
            <div className="character-equipment-identity"><div className="hero-avatar large skin-avatar" style={{background:skinTheme(hero.equippedSkinId||hero.costumeId).background}}><SkinPortrait job={hero.job} skinId={hero.equippedSkinId||hero.costumeId} /></div><div><b>{hero.name}</b><span>{jobKo[hero.job]} · {promotionLabel(hero)}</span><small>전투 방향 · {compactTendency(hero)}</small></div></div>
            <div className="character-equipment-stats"><span><small>공격</small><b>{Math.round(heroCombatStats.attack)}</b></span><span><small>방어</small><b>{Math.round(heroCombatStats.defense)}</b></span><span><small>HP</small><b>{Math.round(heroCombatStats.maxHp)}</b></span><span><small>속도</small><b>{Math.round(heroCombatStats.speed*100)/100}</b></span></div><div className="costume-bonus-strip"><b>코스튬 보유 보너스</b><span>{costumeStatLabels(hero.skinIds||[]).join(" · ")||"보너스 없음"}</span>{ownedCostumePassive(hero.skinIds||[]).detail&&<small>✦ {ownedCostumePassive(hero.skinIds||[]).name} · {ownedCostumePassive(hero.skinIds||[]).detail}</small>}</div>
            <div className="character-equipment-slots">{[0,1,2].map(slot=>{const item=equipmentSlotsOf(hero)[slot];const combat=item?itemCombatLabels(item):[];const enh=item?enhancementCombatLabels(item):[];return <div key={slot} className={"character-equipment-slot "+(selectedEquipSlot===slot?"active":"")}><button onClick={()=>setSelectedEquipSlot(slot)}><span>SLOT {slot+1}</span><strong>{item?.name||"장비 없음"}{item&&<em className="slot-enhance-level"> +{enhancementLevel(item)}</em>}</strong><small>{item?item.rarity+" · Lv."+item.level+" · "+enhancementLevel(item)+"/"+MAX_ENHANCEMENT+" 강화":"인벤토리에서 장착"}</small>{item&&<div className="slot-stat-detail">{item.stats.slice(0,3).map(stat=><em key={stat}>{stat}</em>)}{combat.slice(0,2).map(stat=><em key={"c-"+stat}>{stat}</em>)}{enh.slice(0,2).map(stat=><em key={"e-"+stat}>{stat}</em>)}</div>}</button>{item&&<><button className="ghost-btn slot-enhance-btn" onClick={e=>{e.stopPropagation();enhanceItem(item.id)}} disabled={enhancementLevel(item)>=MAX_ENHANCEMENT||save.gold<enhancementCost(item)}>{enhancementLevel(item)>=MAX_ENHANCEMENT?"MAX":"+"}</button><button className="ghost-btn" onClick={()=>unequip(slot)}>해제</button></>}</div>})}</div>
          </div>
          <div className="character-equipment-inventory">
            <div className="character-inventory-head"><div><b>{hero.name} 인벤토리</b><span>선택 슬롯 · {selectedEquipSlot+1} · 아이콘 클릭으로 장착</span><small className="recommend-hint">{recommendedLoadout(hero,save.items).length>0?"추천 장비 "+recommendedLoadout(hero,save.items).length+"개 대기":"현재 장비 유지 권장"}</small></div><span>{save.items.length}/60</span></div>
            {save.items.length===0?<div className="quick-empty">인벤토리가 비어 있습니다. 전투 전리품과 보물방에서 장비를 획득하세요.</div>:<div className="character-inventory-grid">{save.items.map((item,idx)=><InventoryIcon item={item} key={item.id+"-"+idx} compare={equipmentPreview(hero,item,selectedEquipSlot)} onEquip={()=>equip(item,selectedEquipSlot)}/>)}</div>}
          </div>        </div>
      </div>
      <div className="memory-panel"><div><b>{hero.name}의 최근 기억</b><span>최근 전투에서 강하게 남은 경험이 다음 판단에 영향을 줍니다.</span></div><div className="memory-list">{(hero.memories||[]).slice(0,4).map((m,i)=><em key={i}>{m.text} · 영향 {Math.round(m.weight*10)/10}</em>)}</div></div>
       <div className="skin-panel"><div><b>캐릭터 스킨</b><span>{skinLabel(hero.job,hero.equippedSkinId||hero.costumeId)} · 보유 {(hero.skinIds||[]).length}/{costumesForJob(hero.job).length}</span></div><div className="skin-grid">{costumesForJob(hero.job).map(c=>{const owned=(hero.skinIds||[]).includes(c.id);const equipped=(hero.equippedSkinId||hero.costumeId||costumesForJob(hero.job)[0]?.id)===c.id;const cost=skinCost(c);return <button key={c.id} className={"skin-card "+c.tier+(equipped?" equipped":"")+(owned?" owned":" locked")} onClick={()=>owned?equipSkin(c.id):unlockSkin(c.id)} disabled={!owned&&(save.gold<cost.gold)}><div className="skin-card-top"><span className="skin-card-portrait" style={{background:skinTheme(c.id).background}}><SkinPortrait job={hero.job} skinId={c.id} compact /></span><small>{c.tier} · {owned?"보유":"잠김"}</small></div><b>{c.name.split(" · ")[1]}</b><span>{c.description}</span><div className="skin-stat-preview">{costumeStatLabels([c.id]).map(stat=><em key={stat}>{stat}</em>)}</div><small className="skin-passive-preview">✦ {costumePassive(c.id).name}</small><span className="skin-passive-detail">{costumePassive(c.id).detail}</span><em>{equipped?"장착 중":owned?"장착":skinUnlockText(c)}</em></button>})}</div></div></section>}

    {screen==="recruit"&&<section className="page management-page recruit-page"><div className="section-head"><div><span className="eyebrow">RECRUITMENT</span><h2>용사 모집란</h2><p className="muted">기초직업 5종의 신규 용사를 지속적으로 모집할 수 있습니다. 모집비 350 골드.</p></div><span className="counter">{save.heroes.length}명</span></div><div className="recruit-panel"><div><b>기초직업 모집</b><span>모집된 용사는 Lv.1에서 시작하며 기본 직업과 서로 다른 초기 성향을 가집니다.</span></div><div className="recruit-grid">{(Object.keys(jobKo) as Job[]).map(j=><article className="recruit-card" key={j}><div className="room-icon">{jobIcon[j]}</div><b>{jobKo[j]}</b><p>기초 직업 · 장기 성향이 성장하며 자동 전직합니다.</p><button className="primary-btn compact" disabled={save.gold<350} onClick={()=>recruit(j)}><UserPlus size={15}/> 모집 350G</button></article>)}</div></div><div className="subpanel"><div><b>모집 원칙</b><span>신규 용사의 미래는 실제 행동과 경험이 결정합니다.</span></div><button className="primary-btn compact" onClick={()=>setScreen("party")}><UserRound size={16}/> 캐릭터 보기</button></div></section>}

    {screen==="dungeon"&&<section className="page play-page dungeon-page"><div className="section-head"><div><span className="eyebrow">DUNGEON</span><h2>{save.floor}F · 다음 방 선택</h2><p className="muted">경로만 선택할 수 있습니다. 전투가 시작되면 AI가 전부 결정합니다. · 세계 {(save.sealCount||0)+1}회차 · 적 Lv.{dungeonLevelRange(save.floor,save.sealCount||0).min}~{dungeonLevelRange(save.floor,save.sealCount||0).max} · 적 전투력 +{sealEnemyEnhancement(save.sealCount||0)}%</p></div><button className="ghost-btn" onClick={()=>setScreen("party")}><UserRound size={16}/> 파티 수정</button></div>
      <NpcGuide floor={save.floor} mode={mode} compact onOpen={openNpc} dialogueIndex={npcTalkIndex}/>
      <div className="progress-strip">{Array.from({length:6},(_,i)=><div key={i} className={"progress-node "+(i<save.stage?"done":i===save.stage?"current":"")}><span>{i<save.stage?"✓":i+1}</span><small>{i===5?"BOSS":"ROOM "+(i+1)}</small></div>)}</div>
      {Object.keys(save.scenarioClears).length>0&&<div className="repeat-panel"><div><b>완료 시나리오 재도전</b><span>성장을 위해 완료한 시나리오를 반복할 수 있습니다. 반복할수록 보상이 감소하고 25% 확률로 정예 몬스터 무리가 등장합니다.</span></div><div className="repeat-list">{Object.keys(save.scenarioClears).sort((a,b)=>Number(b)-Number(a)).map(k=>{const n=save.scenarioClears[k];const mult=Math.max(.3,.6-.1*Math.max(0,n-1));return <button key={k} className="repeat-card" onClick={()=>startRepeat(Number(k))}><b>{k}F 시나리오</b><span>클리어 {n}회 · 다음 보상 {Math.round(mult*100)}%</span><ChevronRight size={16}/></button>})}</div></div>}
      <div className="route-grid">{route(save.stage,save.floor,party.length?party.reduce((n,h)=>n+h.tendencies.curiosity,0)/party.length:0).map((r,i)=>{const f=routeForecast(r.kind,save.floor,party,save.routeMemory);return <button key={i} className={"route-card room-"+r.kind} onClick={()=>start(r.kind)}><div className="room-icon">{roomIcon[r.kind]}</div><div><small>{roomKo[r.kind]}</small><h3>{r.title}</h3><p>{r.summary}</p><div className="route-intel"><span>위험 {f.risk}</span><span>예상 보상 {f.reward}G</span><span>적합도 {f.fit}</span><span>{environmentInfo[f.environment].name}</span><span>경험 {f.experience}회{f.experience>0?" · 성공 "+f.successRate+"%":""}</span></div></div><ChevronRight size={20}/></button>})}</div>
      {Object.entries(save.routeMemory||{}).filter(([,m])=>m.attempts>0).length>0&&<div className="route-memory-panel"><div><span className="eyebrow">DUNGEON MEMORY</span><b>던전 경로 기억</b><small>같은 종류의 방을 실제로 경험한 결과가 다음 예측에 조금씩 반영됩니다.</small></div><div className="route-memory-list">{Object.entries(save.routeMemory||{}).filter(([,m])=>m.attempts>0).sort((a,b)=>b[1].attempts-a[1].attempts).slice(0,6).map(([kind,m])=><div className="route-memory-row" key={kind}><strong>{roomKo[kind as RoomKind]}</strong><span>경험 {m.attempts}회</span><span>성공 {Math.round(m.clears/m.attempts*100)}%</span>{m.rewardSamples>=2&&<span>실측 보상 {Math.round(m.rewardGold/m.rewardSamples)}G</span>}</div>)}</div></div>}
      <div className="dungeon-meta"><div><b>현재 파티</b>{party.map(h=><span key={h.id}>{jobIcon[h.job]} {h.name}</span>)}</div><div><b>대서사의 목표</b><span>{save.worldSealed?"세계의 구멍 봉인 완료":"동굴을 돌파해 악의 동굴을 찾고 세계의 구멍을 봉인하세요."}</span></div></div></section>}

    {screen==="battle"&&<section className="page play-page battle-page"><div className="battle-header"><div><span className="eyebrow">{roomKo[battle.room]}</span><h2>{battle.room==="evilCave"?"악의 동굴 · 세계의 구멍":battle.room==="boss"?"심층 관문":battle.repeatScenarioFloor!==undefined?"시나리오 재도전":"자동 전투 진행 중"}</h2><p className="muted">전투 명령 없음 · 일시정지와 재생 속도만 조절할 수 있습니다.</p></div>
      <div className="battle-tools"><button className="ghost-btn" onClick={()=>setPaused(x=>!x)}>{paused?<CirclePlay size={17}/>:<CirclePause size={17}/>} {paused?"재생":"일시정지"}</button>{[.5,1,2,4].map(x=><button key={x} className={speed===x?"speed-on":"speed-btn"} onClick={()=>setSpeed(x)}>{x}x</button>)}</div></div>
      <div className="battle-summary-strip">
        <span>MODE · {battle.repeatScenarioFloor!==undefined?"SCENARIO REPLAY":battle.mode==="defense"?"DEFENSE":battle.mode==="raid"?"BOSS RAID":"DUNGEON"}</span><span>진형 · {formationLabel(party,battle.mode)}</span>{battle.plan&&<span>방침 · {battle.plan.label}</span>}{battle.repeatScenarioFloor!==undefined&&<><span>재도전 · {battle.repeatScenarioFloor}F</span><span>반복 {battle.repeatCount}회</span><span>보상 {Math.round((battle.rewardMultiplier||1)*100)}%</span>{battle.elitePack&&<span>정예 무리 출현</span>}</>}
        {battle.mode==="defense"&&<><span>목표 · {defenseObjectiveKo[battle.objectiveKind||"gate"]}</span><span>{defenseObjectiveDetail[battle.objectiveKind||"gate"]}</span><span>WAVE {battle.wave}</span><span>목표 내구도 {battle.objectiveHp}%</span><span>남은 시간 {Math.max(0,Math.ceil(((battle.deadline||Date.now())-Date.now())/1000))}초</span></>}
        {battle.mode==="raid"&&<><span>보스 · {battle.units.find(u=>u.team==="enemy"&&u.grade==="Boss")?.name||"—"}</span><span>PHASE {battle.phase}</span><span>종족 전용 패턴 · {battle.units.find(u=>u.team==="enemy"&&u.grade==="Boss")?.species||"—"}</span></>}
        {battle.environment&&<span>환경 · {environmentInfo[battle.environment].name}</span>}
      </div>
      {battle.phaseNotice&&<div className={"phase-banner phase-banner-"+battle.phase}><span>⚠ PHASE SHIFT</span><b>{battle.phaseNotice}</b><small>{battle.phase===3?"FINAL PHASE · LIMIT BREAK":"BOSS PATTERN UPDATED"}</small></div>}
       {battle.bossIntro&&<div className={"boss-intro-overlay boss-"+battle.bossIntro.species.toLowerCase()}><div className="boss-intro-card"><div className="boss-intro-art"><img src={"/backgrounds/boss-"+battle.bossIntro.species.toLowerCase()+".svg"} alt="" /></div><div className="boss-intro-content"><span className="boss-intro-kicker">BOSS ENCOUNTER · 심층 경보</span><div className="boss-intro-emblem">♛</div><div><small>{battle.bossIntro.species} · 강화 보스</small><h2>{battle.bossIntro.name}</h2><b>{battle.bossIntro.subtitle}</b><p>“{battle.bossIntro.quote}”</p></div><em>전투는 곧 시작됩니다 · 모든 행동은 AI가 결정합니다.</em></div></div></div>}
      {battle.environment&&<div className="environment-note"><b>{environmentInfo[battle.environment].name}</b><span>{environmentInfo[battle.environment].detail}</span></div>}
      {active?.actionText&&(()=>{const activeHero=active.team==="player"?save.heroes.find(h=>h.id===active.id):undefined;const ultimate=!!activeHero?.finalAwakening&&activeHero.level>=100&&/비전|궁극|무쌍|천극|종언|성역|해방|심판/.test(active.actionText);return <div className={"battle-action-overlay "+(active.fxKind?"action-"+active.fxKind:"")+" "+(ultimate?"action-ultimate":"")}><div className="action-burst-ring"/><div className="action-burst-core">{ultimate?"✦":"✧"}</div><div className="action-burst-copy"><small>{ultimate?"ULTIMATE AWAKENING · FINAL SKILL":active.team==="player"?"ACTION":"ENEMY ACTION"}</small><b>{ultimate?activeHero!.finalAwakening!.skillName:active.actionText}</b><span>{ultimate?activeHero!.finalAwakening!.name+" · "+activeHero!.finalAwakening!.skillDetail:(active.job?jobKo[active.job]:(active.species||"적대 개체")+" · ROUND "+battle.round)}</span></div><div className="action-burst-sparks"/></div>})()}
      <div className={"battle-scene battle-scene-"+battle.mode+" battle-room-"+battle.room+" battle-phase-"+battle.phase+" "+(active?.team==="enemy"?"battle-active-enemy ":"")+" "+(active?.species?"battle-active-species-"+monsterVisual(active.species).className:"")+" "+(active?.team==="enemy"&&active?.grade==="Boss"&&active?.actionText?.includes("보스 패턴")?"boss-pattern-active ":"")}><div className="battle-sky-glow"/><div className="battle-vignette"/><div className="battle-banner-left">⚔ FRONTIER ARMY</div><div className="battle-banner-right">ENEMY FRONT ⚠</div>{battle.mode==="raid"&&<div className={"raid-phase-hud raid-phase-"+battle.phase}><span>PHASE {battle.phase}</span><b>{battle.phase===1?"전초 · 패턴 분석":battle.phase===2?"격화 · 전장 압박":"종언 · 보스 폭주"}</b><small>보스 HP {Math.round((pct(battle.units.find(u=>u.team==="enemy"&&u.grade==="Boss")||{hp:0,maxHp:1}))*100)}%</small><em>{(()=>{const boss=battle.units.find(u=>u.team==="enemy"&&u.grade==="Boss");return boss?bossPatternLabel(boss.species,battle.phase):"보스 패턴 대기"})()}</em></div>}<div className="battle-layout" style={{gridTemplateColumns:"1fr"}}><div className="cave-panel"><div className="cave-label"><span>입구</span><span>심층</span></div><div className="cave-lane"><div className="cave-floor"/>
        {battle.units.map(u=><div key={u.id} className={"battle-unit "+u.team+" "+(u.alive?"":"dead")+" "+(active?.id===u.id?"active-unit":"")+" "+(u.fxKind?"fx-"+u.fxKind:"")+" "+(u.job?"unit-job-"+u.job.toLowerCase():"")+" "+(u.grade?"unit-grade-"+String(u.grade).toLowerCase():"")+" "+(u.grade==="Boss"?"boss-unit ":"")+" "+(u.grade==="Boss"&&u.species?"boss-species-"+monsterVisual(u.species).className:"")+" "+(u.team==="player"?"costume-"+costumeVisualKey(u.skinId):"")} style={{left:(u.pos*9.3)+"%"}}>
          <div className="unit-token-frame"><div className={"unit-token art-character-frame "+(u.team==="player"?"art-hero-frame":"art-enemy-frame")}>{u.team==="player"?<SkinPortrait job={u.job!} skinId={save.heroes.find(h=>h.id===u.id)?.equippedSkinId} compact />:<div className={"monster-asset monster-asset-"+String(u.grade||"Normal").toLowerCase()+" monster-species-"+monsterVisual(u.species).className} aria-hidden="true"><MonsterArt species={u.species} grade={u.grade} size={42}/><i>{u.grade==="Boss"?"♛":u.grade==="Named"?"☠":u.grade==="Elite"?"◆":""}</i></div>}{u.team==="enemy"&&<span className={"monster-level-badge grade-"+String(u.grade||"Normal").toLowerCase()}>Lv.{u.level||1}</span>}{u.team==="player"&&<span className="unit-job-badge">{jobIcon[u.job!]}</span>}</div><span className="unit-scanline"/></div><div className="unit-nameplate"><b>{u.name}</b><span>{u.team==="player"?(u.job?jobKo[u.job]:"전투원"):(u.species||"적대 개체")}</span></div>{u.team==="enemy"&&<small className="monster-meta">{u.species} · {u.grade||"Normal"}{u.promotionTier?(" · 승급 "+u.promotionTier+"단계"):""}</small>}{u.team==="enemy"&&<span className="monster-style-badge"><i>◆</i> {monsterCombatStyle(u.species)}</span>}{u.team==="enemy"&&u.grade==="Boss"&&<span className={"boss-pattern-badge boss-pattern-"+monsterVisual(u.species).className}><i>⚠</i> {bossPatternLabel(u.species,battle.phase)}</span>}{u.mutation&&<small className="mutation-label">{u.mutation}</small>}{u.fx&&<span className="combat-fx">{u.fx}</span>}<div className="hp-bar"><span style={{width:(100*pct(u))+"%"}}/></div><small className="unit-hp-text">{Math.max(0,Math.round(u.hp))}/{u.maxHp}</small></div>)}
      </div><div className="battle-status-tags">{active?.statusEffects&&active.statusEffects.length>0&&active.statusEffects.map(s=><span key={s.kind}>{statusEffectIcon[s.kind]} {statusEffectKo[s.kind]} {s.turns}T</span>)}</div><div className="battle-status">{battle.ended?<><Trophy size={17}/> {battle.result==="victory"?"승리 · 성장 기록 반영":"패배 · 원정 종료"}</>:<><Zap size={16}/> ROUND {battle.round} · {active?.name||"자동 전투"}</>}</div></div>
</div></div>
      {battle.ended&&<div className={"result-panel result-popup "+(battle.result==="victory"?"result-victory":"result-defeat")}>
  <div className={"result-icon "+(battle.result==="victory"?"win":"lose")}>{battle.result==="victory"?"✓":"×"}</div>
  <div className="result-summary">
    <small>{battle.result==="victory"?"원정대 생존":"전멸"}</small>
    <h3>{battle.result==="victory"?"전투 승리":"원정 종료"}</h3>
    <p>{battle.result==="victory"?"전투 기록과 경험이 캐릭터에 반영되었습니다.":"이번 전투에서 원정이 종료되었습니다."}</p>
  </div>
  {battle.result==="victory"&&<div className="clear-cutin"><span>MISSION CLEAR</span><b>{battle.room==="evilCave"?"WORLD SEAL BREAKER":"BATTLEFIELD DOMINANCE"}</b><i>전투 기록 · 경험 · 각성 진행이 저장되었습니다.</i></div>}
  <div className="result-report">
    <div className="battle-report">
      <div className="report-head"><b>AI 전투 리포트</b><span>이번 전투의 핵심 행동만 표시</span></div>
      <div className="battle-report-grid">{battle.units.filter(u=>u.team==="player").map(u=><div className="report-card" key={u.id}>
        <div className="report-card-head"><strong>{u.name}</strong><span>{jobKo[u.job as Job]||"전투원"}</span></div>
        <div className="report-metrics"><span><b>{u.battleStats?.actions||0}</b><small>행동</small></span><span><b>{u.battleStats?.damage||0}</b><small>피해</small></span><span><b>{u.battleStats?.healing||0}</b><small>회복</small></span><span><b>{u.battleStats?.taken||0}</b><small>받은 피해</small></span><span><b>{u.battleStats?.kills||0}</b><small>처치</small></span></div><small className="report-costume-fx">✦ 코스튬 효과 {(u.battleStats?.costumeFx||0)}회 · 치명타 {(u.battleStats?.critical||0)}회</small>
        <small className="report-actions">{Object.entries(u.behaviorCounts||{}).sort((x,y)=>y[1]-x[1]).slice(0,2).map(x=>x[0]+" "+x[1]+"회").join(" · ")||"주요 행동 기록 없음"}</small>
      </div>)}</div>
    </div>
    {battle.result==="victory"&&lastLoot.length>0&&<div className="loot-summary"><b>획득 전리품</b><span>{lastLoot.map(x=>x.name).join(" · ")}</span></div>}
  </div>
  <button className="primary-btn result-action-btn" onClick={()=>{if(battle.result==="victory"&&battle.room==="evilCave"){sealWorld();return;}setScreen("dungeon");setBattle(b=>({...b,ended:false,result:undefined}));}}>{battle.result==="victory"&&battle.room==="evilCave"?"세계의 구멍 봉인":battle.result==="victory"?"경로 선택":"다시 시작"} <ChevronRight size={17}/></button>
</div>}</section>}

    {screen==="inventory"&&(()=>{const filtered=save.items.filter(i=>warehouseTab==="all"||i.slot===warehouseTab);const rarityRank:Record<string,number>={신화:7,고대:6,전설:5,영웅:4,희귀:3,고급:2,일반:1};const sorted=filtered.slice().sort((a,b)=>warehouseSort==="level"?b.level-a.level:warehouseSort==="rarity"?(rarityRank[b.rarity]||0)-(rarityRank[a.rarity]||0):0);return <section className="page management-page inventory-page"><div className="section-head"><div><span className="eyebrow">GUILD WAREHOUSE · INVENTORY</span><h2>용사단 인벤토리</h2><p className="muted">아이콘 중심으로 간소화했습니다. 커서를 올리면 이름·희귀도·스탯·AI 보정·설명이 표시되고, 클릭하면 현재 선택 슬롯에 장착됩니다.</p></div><span className="counter">{save.items.length} / 60</span></div>
      <div className="warehouse-toolbar"><div className="warehouse-tabs">{([["all","전체"],["weapon","무기"],["armor","방어구"],["ring","반지"],["accessory","장신구"]] as const).map(([key,label])=><button key={key} className={warehouseTab===key?"warehouse-tab active":"warehouse-tab"} onClick={()=>setWarehouseTab(key)}>{label}<small>{key==="all"?save.items.length:save.items.filter(i=>i.slot===key).length}</small></button>)}</div><div className="warehouse-sort"><span>정렬</span>{([["recent","최근"],["level","레벨"],["rarity","희귀도"]] as const).map(([key,label])=><button key={key} className={warehouseSort===key?"sort-btn active":"sort-btn"} onClick={()=>setWarehouseSort(key)}>{label}</button>)}</div></div>
      <div className="warehouse-target-panel"><div><b>장착 대상 캐릭터</b><span>캐릭터를 선택한 뒤 장비 아이콘을 클릭</span></div><div className="warehouse-targets">{save.heroes.map(h=><button key={h.id} className={"warehouse-target "+(selectedHero===h.id?"active":"")} onClick={()=>{setSelectedHero(h.id);setSelectedEquipSlot(0)}}><span className="warehouse-target-avatar skin-avatar" style={{background:skinTheme(h.equippedSkinId||h.costumeId).background}}><SkinPortrait job={h.job} skinId={h.equippedSkinId||h.costumeId} compact /></span><span><b>{h.name}</b><small>{jobKo[h.job]} · {equippedItemsOf(h).length}/3</small></span></button>)}</div></div>
      <div className="warehouse-equipment-strip"><div className="warehouse-strip-head"><div><b>{hero.name} 장비창</b><span>3칸 · 선택 슬롯 {selectedEquipSlot+1}</span></div><div className="equipment-head-actions"><button className="ghost-btn" onClick={recommendEquip}>✦ 추천 장착</button><button className="ghost-btn" onClick={()=>setSelectedEquipSlot((selectedEquipSlot+1)%3)}>다음 슬롯</button></div></div><div className="equipment-slots compact-five">{[0,1,2].map(slot=>{const item=equipmentSlotsOf(hero)[slot];return <div key={slot} className={"equipment-slot "+(selectedEquipSlot===slot?"selected":"")}><button onClick={()=>setSelectedEquipSlot(slot)} className="slot-main"><small>SLOT {slot+1}</small><b>{item?.name||"장비 없음"}</b><span>{item?item.rarity+" · Lv."+item.level:"아이콘을 선택해 장착"}</span></button>{item&&<button className="ghost-btn slot-action" onClick={()=>unequip(slot)}>해제</button>}</div>})}</div></div>
      <div className="warehouse-icon-grid">{sorted.length===0?<div className="subpanel empty-warehouse"><b>해당 카테고리에 장비가 없습니다.</b><span>전투 전리품과 보물방에서 장비를 획득하세요.</span></div>:sorted.map((item,idx)=><InventoryIcon item={item} key={item.id+"-"+idx} warehouse compare={equipmentPreview(hero,item,selectedEquipSlot)} onEquip={()=>equip(item,selectedEquipSlot)} onSell={()=>sellItem(item)}/>)}</div>
    </section>})()}
    {statusHeroId&&save.heroes.find(h=>h.id===statusHeroId)&&<CharacterStatusModal heroes={save.heroes} hero={save.heroes.find(h=>h.id===statusHeroId)!} onClose={()=>setStatusHeroId(undefined)} onNavigate={id=>setStatusHeroId(id)} onTranscend={transcendHero} onUpgradePassive={upgradeHeroPassive} onChoosePromotion={chooseHeroPromotion}/>}
    <footer><span>Prototype · autonomous dungeon AI</span><button onClick={reset}><RotateCcw size={14}/> 초기화</button></footer>
  </main>;
}

function CharacterStatusModal({hero,heroes,onClose,onNavigate,onTranscend,onUpgradePassive,onChoosePromotion}:{hero:Hero;heroes:Hero[];onClose:()=>void;onNavigate:(id:string)=>void;onTranscend:(heroId:string)=>void;onUpgradePassive:(heroId:string,skillId:string)=>void;onChoosePromotion:(heroId:string,name:string)=>void}){
  const stats=combatStats(hero);
  const bonus=chronicleBonuses(hero);
  const growth=promotionForecast(hero);
  const items=equippedItemsOf(hero);
  const star=heroStar(hero);
  const traitMultiplier=traitStrengthMultiplier(hero);
  const transcendReq=transcendenceRequirement(hero);
  const transcendReady=!!transcendReq&&hero.level>=transcendReq.level;
  const transcendCostLabel=transcendReq?transcendReq.gold+"G":"MAX";
  const personality=hero.personality||buildPersonality(hero);
  const index=Math.max(0,heroes.findIndex(h=>h.id===hero.id));
  const prev=heroes[index-1];
  const next=heroes[index+1];
  return <div className="status-modal-backdrop" onClick={onClose}>
    <section className="status-modal" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}>
      <div className="status-modal-head"><div className="status-modal-title-row"><div className="status-modal-portrait skin-avatar" style={{background:skinTheme(hero.equippedSkinId||hero.costumeId||hero.job.toLowerCase()+"-base").background}}><SkinPortrait job={hero.job} skinId={hero.equippedSkinId||hero.costumeId} compact /></div><button className="status-nav-btn" disabled={!prev} onClick={()=>prev&&onNavigate(prev.id)} aria-label="이전 캐릭터">‹</button><div><span className="eyebrow">CHARACTER STATUS</span><h2>{hero.name}</h2><p>{jobKo[hero.job]} · {promotionLabel(hero)} · Lv.{hero.level} · {starLabel(star)}</p></div><button className="status-nav-btn" disabled={!next} onClick={()=>next&&onNavigate(next.id)} aria-label="다음 캐릭터">›</button></div><div className="status-modal-actions"><span>{index+1} / {heroes.length}</span><button className="ghost-btn" onClick={onClose}>닫기</button></div></div>
      <div className="status-modal-grid">
        <div className="status-modal-card star-status-card"><div className="modal-card-title"><b>성급 · 초월</b><span>{star}/6성</span></div><div className="star-rank"><strong>{starLabel(star)}</strong><b>{star}성</b><span>특성 강화 ×{traitMultiplier.toFixed(1)}</span></div>{star<6&&<div className="transcend-info"><small>다음 초월 · {star+1}성 · Lv.{transcendReq?.level} 필요</small><small>비용 · {transcendCostLabel}</small><button className="primary-btn compact" onClick={()=>onTranscend(hero.id)} disabled={!transcendReady}>{transcendReady?"초월 · "+(star+1)+"성":"Lv."+transcendReq?.level+" 필요"}</button></div>}{star>=6&&<div className="transcend-info"><small>최대 성급에 도달했습니다.</small><span>6성 최종 초월 · 특성 효과 2.0배</span></div>}</div>
        <div className="status-modal-card"><div className="modal-card-title"><b>기본 스탯</b><span>기본값 → 적용값</span></div><div className="modal-stat-grid">{([["HP",Math.round(hero.hp),Math.round(stats.maxHp)],["공격",Math.round(hero.attack),Math.round(stats.attack)],["방어",Math.round(hero.defense),Math.round(stats.defense)],["속도",Math.round(hero.speed*100)/100,Math.round(stats.speed*100)/100],["사거리",Math.round(hero.range*100)/100,Math.round(stats.range*100)/100],["경험",hero.experience+"/"+xpRequiredForLevel(hero.level),hero.experience+"/"+xpRequiredForLevel(hero.level)]] as [string,string|number,string|number][]).map(x=><div key={x[0]}><small>{x[0]}</small><b>{x[1]}</b>{String(x[1])!==String(x[2])&&<span>→ {x[2]}</span>}</div>)}</div><div className="modal-note">연대기 가산 · 공격 +{bonus.attack||0} · 방어 +{bonus.defense||0} · HP +{bonus.hpPct||0}% · 속도 +{bonus.speedPct||0}%</div></div>
        <div className="status-modal-card"><div className="modal-card-title"><b>전투 방향</b><span>{compactTendency(hero)}</span></div><div className="compact-tendency-card"><b>{compactTendency(hero)}</b><p>세부 수치 대신 전투에서 드러나는 큰 방향만 표시합니다.</p></div></div>
        <div className="status-modal-card" style={{gridColumn:"1 / -1"}}><div className="modal-card-title"><b>초월 각성</b><span>{(hero.awakenings||[]).length}/3 해금</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{[50,70,100].map(level=>{const data=(hero.awakenings||[]).find(x=>x.level===level);return <div key={level} style={{padding:10,borderRadius:10,border:"1px solid "+(data?"#8f7440":"#26364f"),background:data?"#17140d":"#0c1421"}}><b>{level===50?"🌱 개화":level===70?"⚡ 극점":"♾️ 무한"}</b><small style={{display:"block",marginTop:5,color:data?"#d7c18c":"#6f7c90"}}>{data?.name||"Lv."+level+" 해금"}</small><small style={{display:"block",marginTop:4,color:"#9aa9bf"}}>{data?.detail||"레벨 도달 시 영구 성장 보너스 획득"}</small></div>})}</div></div>
        <div className="status-modal-card personality-status-card"><div className="modal-card-title"><b>캐릭터 개성</b><span>{personality.archetype}</span></div><div className="personality-quote"><b>“{personality.quote}”</b><small>{personality.temperament} · 유대 방식 · {personality.bondStyle}</small></div><div className="personality-detail-grid"><span><b>개성 핵심</b>{personality.archetype}</span><span><b>선호 행동</b>{personality.favoriteAction}</span><span><b>특징</b>{personality.quirk}</span></div></div>
         <div className="status-modal-card"><div className="modal-card-title"><b>성장 전망</b><span>{growth.next}</span></div>{hero.promotionPending&&<div style={{padding:10,marginBottom:10,border:"1px solid #8f7440",borderRadius:10,background:"#17140d"}}><b style={{display:"block",color:"#e0c67c"}}>⚔ 플레이어 전직 선택</b><small style={{display:"block",marginTop:4,color:"#aebbd0"}}>자동 전직을 중단했습니다. 아래 3개 경로 중 하나를 직접 선택하세요.</small><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:8}}>{promotionOptions(hero).map(option=><button key={option.name} className="primary-btn compact" onClick={()=>onChoosePromotion(hero.id,option.name)}><b>{option.name}</b><small style={{display:"block",marginTop:3,opacity:.8}}>{option.detail}</small></button>)}</div></div>}<div className="growth-level"><div><b>Lv.{hero.level}</b><span>/ {growth.level}</span></div><i><em style={{width:growth.progress+"%"}}/></i></div><p className="growth-reason">{growth.reason}</p>{promotionPassive(hero)&&<div style={{marginTop:8,padding:"8px 10px",border:"1px solid #35435a",borderRadius:9,background:"#0c1420"}}><b style={{display:"block",color:"#c9a85c"}}>✦ {promotionPassive(hero)!.name}</b><small style={{display:"block",marginTop:3,color:"#9ba8ba"}}>{promotionPassive(hero)!.detail}</small></div>}<div className="growth-now"><span><b>현재 전직</b>{promotionLabel(hero)}</span><span><b>현재 경험</b>{hero.experience}/{xpRequiredForLevel(hero.level)}</span></div></div>
        <div className="status-modal-card" style={{gridColumn:"1 / -1"}}><div className="modal-card-title"><b>캐릭터별 패시브 스킬트리</b><span>스킬 포인트 {hero.skillPoints||0} · 각 패시브 최대 Lv.30</span></div><div style={{fontSize:10,color:"#8997ad",marginBottom:8}}>{passiveSetFor(hero).title} · 레벨업 시 스킬 포인트 +1 · 원하는 패시브에 자유롭게 투자</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,position:"relative"}}><div style={{gridColumn:"1 / -1",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:2}}>{Array.from(new Set(passiveSetFor(hero).skills.map(s=>s.branch))).slice(0,3).map((branch,i)=><div key={branch} style={{padding:"6px 8px",textAlign:"center",fontSize:10,fontWeight:800,color:"#b89955",border:"1px solid #26364f",borderRadius:8,background:"#0a111d"}}>{branch} <span style={{color:"#6f8098"}}>Ⅰ ──→ Ⅱ ──→ Ⅲ</span></div>)}</div>{[1,2,3].map(tier=><div key={tier} style={{display:"flex",flexDirection:"column",gap:8,padding:8,borderRadius:12,border:"1px solid #26364f",background:"#0c1421"}}><div style={{fontWeight:800,color:"#b89955",fontSize:11}}>{tier===1?"Ⅰ 기초 단계":tier===2?"Ⅱ 중급 단계":"Ⅲ 최종 단계"} · 선행 조건 {tier===1?"없음":"이전 단계 Lv.5"}</div>{passiveSetFor(hero).skills.filter(s=>s.tier===tier).map(skill=>{const lv=hero.passiveSkills?.[skill.id]||0;const max=skill.maxLevel;const locked=!!skill.requires&&((hero.passiveSkills?.[skill.requires.skillId]||0)<skill.requires.level);const cost=skill.combatPerLevel;const ai=Object.entries(skill.aiMods).map(([k,v])=>tendencyKo[k as keyof Tendencies]+" +"+v).join(" · ");const combat=Object.entries(cost).map(([k,v])=>k==="attack"?"공격 +"+v+"%/Lv":k==="defense"?"방어 +"+v+"/Lv":k==="hpPct"?"HP +"+v+"%/Lv":k==="speedPct"?"속도 +"+v+"%/Lv":k==="range"?"사거리 +"+v+"/Lv":"치유 +"+v+"%/Lv").join(" · ");return <div key={skill.id} style={{padding:10,border:"1px solid "+(locked?"#1d2838":"#314766"),borderRadius:10,background:locked?"#0b111b":"#101927",opacity:locked?.58:1}}><div style={{display:"flex",justifyContent:"space-between",gap:6}}><b>{skill.name}</b><strong>Lv.{lv}/{max}</strong></div><div style={{height:5,background:"#202c40",borderRadius:4,margin:"7px 0"}}><div style={{height:"100%",width:(lv/max*100)+"%",background:"#b89955",borderRadius:4}}/></div><small style={{display:"block",color:"#aebbd0",minHeight:30}}>{skill.detail}</small><small style={{display:"block",color:"#8997ad",marginTop:6}}>AI · {ai}</small><small style={{display:"block",color:"#8997ad",marginTop:3}}>전투 · {combat}</small>{skill.requires&&<small style={{display:"block",color:locked?"#d27b7b":"#76b98c",marginTop:4}}>{locked?"🔒 ":"✓ "}선행: {skill.requires.skillId} Lv.{skill.requires.level}</small>}<button className="primary-btn compact" style={{marginTop:8,width:"100%"}} disabled={!hero.skillPoints||lv>=max||locked} onClick={()=>onUpgradePassive(hero.id,skill.id)}>{locked?"선행 스킬 필요":lv>=max?"MAX · Lv.30":"스킬 포인트 1 투자"}</button></div>})}</div>)}</div></div><div className="status-modal-card" style={{gridColumn:"1 / -1"}}><div className="modal-card-title"><b>패시브 각성 · 궁극 효과</b><span>Lv.10 / 20 / 30</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{[10,20,30].map(level=><div key={level} style={{padding:10,borderRadius:10,border:"1px solid #26364f",background:"#0c1421"}}><b>{level===10?"✨ 각성":level===20?"⚡ 극성":"👑 궁극"}</b><div style={{marginTop:5,fontSize:11,color:"#9aa9bf"}}>{passiveMilestones(hero).filter(x=>x.level===level).length}개 해금</div>{passiveMilestones(hero).filter(x=>x.level===level).slice(0,4).map(x=><small key={x.skillId} style={{display:"block",marginTop:5,color:"#c5d0df"}}>{x.name} · {x.detail}</small>)}{passiveMilestones(hero).filter(x=>x.level===level).length===0&&<small style={{display:"block",marginTop:5,color:"#6f7c90"}}>해금된 효과 없음</small>}</div>)}</div></div><div className="status-modal-card"><div className="modal-card-title"><b>캐릭터 특성</b><span>{(hero.traits||[]).length}/4 · ×{traitMultiplier.toFixed(1)}</span></div><div className="modal-traits">{(hero.traits||[]).map(name=>{const effect=eventTraitEffects[name]||growthTraitCatalog[name];return <div key={name}><b>{name}<em>×{traitMultiplier.toFixed(1)}</em></b><span>{effect?.detail||"던전에서 얻은 고유 특성입니다."}</span></div>})}</div></div>
        <div className="status-modal-card"><div className="modal-card-title"><b>던전 획득 기록</b><span>최근 8회</span></div><div className="modal-event-rewards">{(hero.eventRewards||[]).slice().reverse().map((r,i)=><div key={r.name+"-"+r.floor+"-"+i}><span>{r.kind==="trait"?"특성":r.kind==="artifact"?"기재":"장비"} · {r.floor}F{r.source?" · "+r.source:""}</span><b>{r.name}</b><small>{r.detail}</small></div>)}{(!hero.eventRewards||hero.eventRewards.length===0)&&<small>던전 이벤트에서 획득한 특성·기재·장비 기록이 여기에 남습니다.</small>}</div></div>
        <div className="status-modal-card"><div className="modal-card-title"><b>장비 · 특성 · 기재</b><span>{items.length}/3 장착</span></div><div className="modal-equipment">{[0,1,2].map(slot=><div key={slot}><small>SLOT {slot+1}</small><b>{items[slot]?.name||"장비 없음"}</b><span>{items[slot]?(items[slot].rarity+" · Lv."+items[slot].level):"비어 있음"}</span></div>)}</div><div className="modal-collection"><div><small>특성</small><b>{(hero.traits||[]).join(" · ")||"없음"}</b></div><div><small>기재</small>{(hero.artifacts||[]).length===0?<b>없음</b>:<div className="modal-artifact-list">{(hero.artifacts||[]).map(name=>{const effect=eventArtifactEffects[name]||growthArtifactCatalog[name];const ai=Object.entries(effect?.aiMods||{}).map(([k,v])=>tendencyKo[k as keyof Tendencies]+" +"+v).join(" · ");const combat=Object.entries(effect?.combatMods||{}).map(([k,v])=>(k==="attack"?"공격 +"+v:k==="defense"?"방어 +"+v:k==="hpPct"?"HP +"+v+"%":k==="speedPct"?"속도 +"+v+"%":k==="range"?"사거리 +"+v:k==="healPct"?"치유 +"+v+"%":k==="critPct"?"치명타 +"+v+"%":k+" +"+v)).join(" · ");return <div key={name}><b>{name}</b><small>{effect?.detail||"던전 이벤트에서 얻은 고유 기재입니다."}</small>{ai&&<em>AI · {ai}</em>}{combat&&<em>전투 · {combat}</em>}</div>})}</div>}</div></div><div className="modal-state-grid"><span><b>기분</b>{systemMood(hero)}</span><span><b>상태</b>{systemStatus(hero)}</span><span><b>평가</b>{systemEvaluation(hero)}</span></div></div>
      </div>
      <div className="status-modal-bottom"><div className="modal-bottom-card"><b>장기 전투 기록</b><span>{hero.combatProfile?.battles||0}전투 · {hero.combatProfile?.actions||0}행동 · {hero.combatProfile?.damage||0}피해 · {hero.combatProfile?.healing||0}회복</span><small>{Object.entries(hero.combatProfile?.topActions||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]+" · "+x[1]+"회").join("  /  ")||"기록 없음"}</small></div><div className="modal-bottom-card"><b>최근 기억</b><span>{(hero.memories||[]).slice(0,2).map(m=>m.text+" · 영향 "+Math.round(m.weight*10)/10).join("  /  ")||"강하게 남은 기억 없음"}</span><small>스킨 · {skinLabel(hero.job,hero.equippedSkinId||hero.costumeId)} · 칭호 · {chronicleLabel(hero)}</small></div></div>
    </section>
  </div>;
}
function InventoryIcon({item,onEquip,onEnhance,onSell,warehouse=false,compare}:{item:Item;onEquip:()=>void;onEnhance?:()=>void;onSell?:()=>void;warehouse?:boolean;compare?:ReturnType<typeof equipmentPreview>}){
  const iconMap={weapon:"⚔",armor:"🛡",ring:"◈",accessory:"✦"} as const;
  const icon=iconMap[item.slot]||"✦";
  const combat=itemCombatLabels(item);
  const enhanced=enhancementLevel(item);
  const enhanceLabels=enhancementCombatLabels(item);
  const deltaLabel=(label:string,value:number)=>label+" "+(value>0?"+":"")+Math.round(value*100)/100;
  return <div className="inventory-icon-wrap">
    <button className={"inventory-icon "+(warehouse?"warehouse-icon ":"")+(item.unique?"unique":"")} onClick={onEquip} aria-label={item.name+" 장착"}>
      <span className="item-asset-icon"><b>{icon}</b></span><small>Lv.{item.level} · +{enhanced}</small>{item.unique&&<b>U</b>}
      <span className="item-tooltip-card" role="tooltip">
        <span className="item-tooltip-head"><b>{item.name}</b>{item.unique&&<em>UNIQUE</em>}</span>
        <span className="item-tooltip-sub">{item.rarity} · {item.slot} · Lv.{item.level} · 강화 +{enhanced}/{MAX_ENHANCEMENT}</span>
        <span className="item-tooltip-stats">{item.stats.map(stat=><i key={stat}>{stat}</i>)}</span>
        {combat.length>0&&<span className="item-tooltip-combat">전투 적용 · {combat.join(" · ")}</span>}
        {enhanceLabels.length>0&&<span className="item-tooltip-combat enhancement-line">{enhanceLabels.join(" · ")}</span>}
        {Object.values(item.aiMods||{}).some(v=>v!==0)&&<span className="item-tooltip-ai">AI 보정 있음</span>}
        {compare&&(compare.attack!==0||compare.defense!==0||compare.hp!==0||compare.speed!==0||compare.range!==0)&&
          <span className="item-tooltip-compare">
            <b>현재 슬롯 대비</b>
            {compare.attack!==0&&<i className={compare.attack>0?"up":"down"}>{deltaLabel("공격",compare.attack)}</i>}
            {compare.defense!==0&&<i className={compare.defense>0?"up":"down"}>{deltaLabel("방어",compare.defense)}</i>}
            {compare.hp!==0&&<i className={compare.hp>0?"up":"down"}>{deltaLabel("HP",compare.hp)}</i>}
            {compare.speed!==0&&<i className={compare.speed>0?"up":"down"}>{deltaLabel("속도",compare.speed)}</i>}
            {compare.range!==0&&<i className={compare.range>0?"up":"down"}>{deltaLabel("사거리",compare.range)}</i>}          </span>}
        <span className="item-tooltip-desc">{item.description}</span>
        <span className="item-tooltip-tip">{enhanced<MAX_ENHANCEMENT?(onEnhance?"⚒ 강화 가능":"강화 가능"):"MAX +15"} · 클릭하면 장착</span>
      </span>
    </button>
    {onEnhance&&enhanced<MAX_ENHANCEMENT&&<button className="inventory-enhance" onClick={e=>{e.stopPropagation();onEnhance();}} aria-label={item.name+" 강화"}>+</button>}
    {warehouse&&onSell&&<button className="inventory-sell" onClick={e=>{e.stopPropagation();onSell();}} aria-label={item.name+" 판매"}>×</button>}
  </div>;
}
function NpcGuide({floor,mode,onOpen,compact=false,dialogueIndex=0}:{floor:number;mode:BattleMode;onOpen:()=>void;compact?:boolean;dialogueIndex?:number}){
  const info=npcLineFor(floor,mode,dialogueIndex);
  return <button className={"npc-guide "+(compact?"npc-guide-compact":"")} onClick={onOpen}>
    <div className="npc-guide-portrait"><img src={NPC_IMAGE} alt="세라피나 NPC 초상화"/></div>
    <span className="npc-guide-copy">
      <small>NPC · 백색의 안내자</small>
      <b>세라피나</b>
      <em>{info.mood} · 대화 가능</em>
      <span>{info.line}</span>
    </span>
    <ChevronRight size={18}/>
  </button>;
}
function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <article className="feature-card"><div className="feature-icon">{icon}</div><b>{title}</b><p>{text}</p></article>;}
function SkinPortrait({job,skinId,compact=false}:{job:Job;skinId?:string;compact?:boolean}){
  const theme=skinTheme(skinId);
  const size=compact?34:62;
  const skinKey=skinId?skinId.split("-").slice(1).join("-"):"base";
  const icon=skinVisual(skinId);
  const uid="skin-"+job.toLowerCase()+"-"+(skinKey||"base").replace(/[^a-z0-9]/gi,"-");
  const portraitIndex:Record<Job,number>={Warrior:0,Guardian:1,Archer:2,Mage:3,Cleric:4};
  const portraitCol=portraitIndex[job]%3;
  const portraitRow=Math.floor(portraitIndex[job]/3);
  const portraitUrl="/assets/hero-portraits.svg";
  return <svg className={"skin-portrait "+(compact?"compact":"")} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <linearGradient id={uid+"-bg"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={theme.primary}/><stop offset="1" stopColor={theme.secondary}/></linearGradient>
      <clipPath id={uid+"-clip"}><circle cx="50" cy="45" r="35"/></clipPath>
    </defs>
    <circle cx="50" cy="48" r="40" fill={theme.background} opacity=".92"/>
    <g clipPath={"url(#"+uid+"-clip)"} opacity=".94">
      <rect x="15" y="10" width="70" height="70" fill={"url(#"+uid+"-bg)"}/>
      <image href={portraitUrl} x={-portraitCol*100+15} y={-portraitRow*100+10} width="300" height="300" preserveAspectRatio="none"/>
    </g>
    <circle cx="50" cy="45" r="35" fill="none" stroke={theme.accent} strokeOpacity=".42" strokeWidth="2"/>
    <path d="M30 84 Q50 68 70 84 L76 96 L24 96 Z" fill={"url(#"+uid+"-bg)"} opacity=".9"/>
    {job==="Warrior"&&<><path d="M27 70 L18 58 L23 54 L35 67" fill="none" stroke={theme.accent} strokeWidth="6" strokeLinecap="round"/><path d="M73 70 L82 58 L77 54 L65 67" fill="none" stroke={theme.accent} strokeWidth="6" strokeLinecap="round"/></>}
    {job==="Guardian"&&<path d="M25 66 Q50 51 75 66 L70 88 Q50 98 30 88 Z" fill="none" stroke={theme.accent} strokeWidth="5"/>}
    {job==="Archer"&&<><path d="M23 67 Q50 90 77 67" fill="none" stroke={theme.accent} strokeWidth="4"/><path d="M50 63 L50 89" stroke={theme.accent} strokeWidth="3"/></>}
    {job==="Mage"&&<><circle cx="50" cy="74" r="13" fill="none" stroke={theme.accent} strokeWidth="4"/><path d="M50 58 V90 M34 74 H66" stroke={theme.accent} strokeWidth="2"/></>}
    {job==="Cleric"&&<path d="M50 65 V91 M39 78 H61" stroke={theme.accent} strokeWidth="6" strokeLinecap="round"/>}
    {skinKey==="monster-disguise"&&<path d="M35 28 L28 15 L41 23 M65 28 L72 15 L59 23" fill={theme.accent}/>}
    {skinKey==="light-hero"&&<ellipse cx="50" cy="14" rx="21" ry="7" fill="none" stroke={theme.accent} strokeWidth="4"/>}
    {skinKey==="fallen-hero"&&<circle cx="50" cy="48" r="27" fill="none" stroke={theme.accent} strokeWidth="2" strokeDasharray="4 5"/>}
    {skinKey==="beach"&&<circle cx="79" cy="22" r="8" fill={theme.accent}/>}
    {skinKey==="fur-winter"&&<path d="M78 72 L88 62 M83 57 V78 M74 67 H92" stroke={theme.accent} strokeWidth="2"/>}
    {skinKey==="summer"&&<path d="M78 73 Q91 65 82 55 Q72 64 78 73" fill={theme.accent}/>}
    {skinKey==="bodysuit"&&<><rect x="70" y="57" width="18" height="7" rx="3" fill={theme.accent}/><circle cx="79" cy="60" r="2" fill={theme.background}/></>}
    <text x="50" y="98" textAnchor="middle" fontSize="12" fill={theme.accent} fontWeight="700">{icon}</text>
  </svg>;
}
function starLabel(star:number){
  const n=Math.max(1,Math.min(6,Math.floor(star||1)));
  return "★".repeat(n)+"☆".repeat(6-n);
}
function HeroCard({hero,active,onClick,onStatus}:{hero:Hero;active:boolean;onClick:()=>void;onStatus:()=>void}){
  const bond=hero.relationships?Object.entries(hero.relationships).sort((a,b)=>(b[1]?.bond||0)-(a[1]?.bond||0))[0]:undefined;
  const bondName=heroesSeed.find(h=>h.id===bond?.[0])?.name;
  return <article className={"hero-card "+(active?"hero-selected":"")} onClick={onClick}>
    <div className="hero-showcase-art" style={{background:skinTheme(hero.equippedSkinId||hero.costumeId||hero.job.toLowerCase()+"-base").background}}><div className="hero-showcase-glow"/><div className="hero-avatar large skin-avatar hero-card-portrait"><SkinPortrait job={hero.job} skinId={hero.equippedSkinId||hero.costumeId} /></div><span className="hero-showcase-job">{jobKo[hero.job]}</span></div>
    <div className="hero-card-main">
      <div className="name-row"><b>{hero.name}</b><span>{starLabel(heroStar(hero))}</span><span>Lv.{hero.level}</span></div>
      <p>{jobKo[hero.job]} · {promotionLabel(hero)} · 경험 {hero.experience}/{xpRequiredForLevel(hero.level)}</p>
      <div className="tag-row"><em>전투 방향 · {compactTendency(hero)}</em></div>
      <small>장비 · {equippedItemsOf(hero).length}/3{equippedItemsOf(hero).length?" · "+equippedItemsOf(hero).slice(0,2).map(x=>x.name).join(" · "):""}</small>
      <small>특성 · {(hero.traits||[]).join(" · ")||"없음"}</small>
      <small>개성 · {(hero.personality||buildPersonality(hero)).archetype} · {(hero.personality||buildPersonality(hero)).temperament}</small>
       <small>기재 · {(hero.artifacts||[]).join(" · ")||"없음"}</small>
      <small>스킨 · {skinLabel(hero.job,hero.equippedSkinId||hero.costumeId)}</small>
      <small>관계 · {bondName?bondName+" "+Math.round(bond?.[1]?.bond||0):"아직 형성된 유대 없음"}</small>
      <button className="ghost-btn hero-status-btn" onClick={e=>{e.stopPropagation();onStatus();}}>상태 보기</button>
    </div>
    <ChevronRight size={17}/>
  </article>;
}
function compactTendency(hero:Hero){
  const t=hero.tendencies;
  const axes=[["공격형",t.aggression*.5+t.bravery*.3+t.pursuit*.2],["수비형",t.caution*.45+t.survival*.35+t.protect*.2],["지원형",t.protect*.45+t.cooperation*.35+t.caution*.2],["탐색형",t.curiosity*.5+t.focus*.3+t.pursuit*.2]] as [string,number][]; axes.sort((a,b)=>b[1]-a[1]);
  return Math.abs(axes[0][1]-axes[1][1])<4?"균형형":axes[0][0];
}
function ItemCard({item,equipped,onEquip,onSell}:{item:Item;equipped?:boolean;onEquip?:()=>void;onSell?:()=>void}){return <article className={"item-card "+(item.unique?"unique-item":"")}><div className="item-top"><span>{item.rarity}</span>{item.unique&&<b>UNIQUE</b>}</div><h3>{item.name}</h3><small>{item.slot} · Lv.{item.level}</small><div className="stat-list">{item.stats.map(s=><span key={s}>{s}</span>)}</div>{item.aiMods&&Object.values(item.aiMods).some(v=>v!==0)&&<div className="ai-mod"><Brain size={14}/><span>AI 보정 있음</span></div>}<p>{item.description}</p><div className="item-actions">{onEquip&&<button className="ghost-btn" onClick={onEquip}>{equipped?"장착 중":"장착"}</button>}{onSell&&<button className="ghost-btn danger-btn" onClick={onSell}>판매</button>}</div></article>;}


function ModeCard({title,subtitle,text,icon,onClick}:{title:string;subtitle:string;text:string;icon:string;onClick:()=>void}){
  return <button className="mode-card" onClick={onClick}><div className="mode-glyph">{icon}</div><div><small>{title}</small><b>{subtitle}</b><span>{text}</span></div><ChevronRight size={18}/></button>;
}