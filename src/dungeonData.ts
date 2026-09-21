import { buildPersonality, type CharacterPersonality } from "./personality";
export type Job = "Warrior" | "Guardian" | "Archer" | "Mage" | "Cleric";
export type RoomKind = "battle" | "elite" | "treasure" | "rest" | "event" | "hidden" | "boss" | "evilCave";
export type Grade = "Normal" | "Elite" | "Named" | "Boss";

export type Tendencies = {
  aggression:number;bravery:number;caution:number;survival:number;protect:number;
  pursuit:number;focus:number;greed:number;curiosity:number;cooperation:number;
};

export type Item = {
  id:string; name:string; slot:"weapon"|"armor"|"ring"|"accessory"; level:number; rarity:string;
  stats:string[]; aiMods:Partial<Tendencies>; combatMods?:{attack?:number;defense?:number;hpPct?:number;speedPct?:number;range?:number;healPct?:number;critPct?:number};
  unique?:boolean; description:string; enhancement?:number;
};

export type Relationship = {trust:number; respect:number; fear:number; bond:number};
export type Memory = {text:string; weight:number; createdAt:number};
export type StatusEffectKind = "poison"|"slow"|"stun"|"fear";
export type StatusEffect = {kind:StatusEffectKind; turns:number; power?:number};

export type Hero = {
  id:string; name:string; job:Job; level:number; hp:number; maxHp?:number; attack:number; defense:number;
  speed:number; range:number; tendencies:Tendencies; item?:Item; equipment?:[Item?,Item?,Item?]; experience:number;
  history:string[]; color:string; star?:number; promotionTier?:number; promotionPath?:string[]; promotionPending?:{tier:number;choices:string[]};
  relationships?:Record<string,Relationship>; memories?:Memory[]; behaviorCounts?:Record<string,number>;
  traits?:string[];
  personality?:CharacterPersonality;
  skinIds?:string[];
  equippedSkinId?:string;
  artifacts?:string[];
  eventRewards?:{kind:"trait"|"artifact"|"equipment";name:string;floor:number;detail:string;source?:string}[];
  chronicle?:{kind:"achievement"|"title";id:string;name:string;description:string;earnedAt:number}[];
  mood?:string; statusNote?:string; evaluation?:string;
  campaignStats?:{wins:number;losses:number;eliteWins:number;bossWins:number;repeatWins:number;finalWins:number}; combatProfile?:{actions:number;damage:number;healing:number;battles:number;topActions?:Record<string,number>};
  costumeId?:string;
  skillPoints?:number; passiveSkills?:Record<string,number>;
  awakenings?:{level:50|70|100;name:string;detail:string;earnedAt:number}[];
  finalAwakening?:{id:string;name:string;detail:string;skillName:string;skillDetail:string;earnedAt:number};
};

export type MonsterLineage = {
  id:string; species:string; level:number; experience:number; focus:Record<string,number>;
  evolutionStage:number; evolutionPath:string[]; lastMemory?:string;
};

export type Monster = {
  id:string; name:string; species:string; grade:Grade; level:number; hp:number; attack:number;
  defense:number; speed:number; range:number; tendencies:Tendencies; pos:number; maxHp:number;
  behavior:string[]; mutation?:string; evolutionStage?:number; evolutionPath?:string[]; evolutionFocus?:string; promotionTier?:number; promotionPath?:string[];
};

export type BattleUnit = {
  id:string; name:string; team:"player"|"enemy"; species?:string; job?:Job; grade?:Grade; level?:number;
  hp:number; maxHp:number; attack:number; defense:number; speed:number; range:number;
  pos:number; alive:boolean; tendencies:Tendencies; item?:Item; equipment?:Item[]; actionText:string;
  cooldown:number; guard:number; xp:number; statusEffects?:StatusEffect[]; relationships?:Record<string,Relationship>; memories?:Memory[]; mutation?:string; behaviorCounts?:Record<string,number>; personality?:CharacterPersonality; skinId?:string; promotionPath?:string[]; evolutionStage?:number; evolutionPath?:string[]; evolutionFocus?:string; promotionTier?:number; passiveHealPct?:number; fx?:string; fxKind?:"damage"|"heal"|"critical"|"status"; battleStats?:{damage:number;healing:number;actions:number;critical:number;costumeFx:number;taken:number;kills:number};
};

export const defaultTendencies: Record<Job,Tendencies> = {
  Warrior:{aggression:82,bravery:74,caution:32,survival:28,protect:34,pursuit:80,focus:58,greed:40,curiosity:38,cooperation:45},
  Guardian:{aggression:46,bravery:68,caution:64,survival:58,protect:94,pursuit:28,focus:76,greed:18,curiosity:22,cooperation:88},
  Archer:{aggression:58,bravery:46,caution:64,survival:62,protect:35,pursuit:50,focus:90,greed:34,curiosity:54,cooperation:62},
  Mage:{aggression:62,bravery:38,caution:68,survival:58,protect:44,pursuit:26,focus:88,greed:30,curiosity:82,cooperation:58},
  Cleric:{aggression:30,bravery:42,caution:72,survival:76,protect:96,pursuit:18,focus:74,greed:14,curiosity:46,cooperation:94}
};

export const heroesSeed: Hero[] = [
  {id:"kael",name:"카엘",job:"Warrior",level:6,star:1,hp:172,attack:34,defense:18,speed:1.05,range:1.4,tendencies:{...defaultTendencies.Warrior},item:{
    id:"iron-greatsword",name:"정련된 대검",slot:"weapon",level:6,rarity:"희귀",stats:["공격력 +14","치명타 +4%"],aiMods:{aggression:8,pursuit:6},combatMods:{attack:14},description:"공격적인 전투를 돕는 고성능 일반 장비."
  },experience:62,history:["돌진을 자주 선택","약한 적 추격"],color:"#d65a5a"},
  {id:"seren",name:"세린",job:"Guardian",level:6,star:1,hp:218,attack:24,defense:32,speed:.82,range:1.3,tendencies:{...defaultTendencies.Guardian},item:{
    id:"guardian-wall",name:"수호자의 성벽",slot:"accessory",level:6,rarity:"전설",stats:["방어력 +18","최대 HP +12%"],aiMods:{protect:50,cooperation:18,survival:18},combatMods:{defense:18,hpPct:12},unique:true,description:"부상당한 아군 쪽으로 이동하고 보호 행동을 우선한다."
  } as Item,experience:88,history:["전투마다 아군 보호","후퇴 명령을 거의 하지 않음"],color:"#5b8bd9"},
  {id:"lyra",name:"리라",job:"Archer",level:7,star:1,hp:134,attack:30,defense:14,speed:1.16,range:5.2,tendencies:{...defaultTendencies.Archer},item:{
    id:"hunter-eye",name:"사냥꾼의 눈",slot:"ring",level:7,rarity:"전설",stats:["명중 +8%","치명타 +6%"],aiMods:{focus:20,pursuit:16},combatMods:{range:.3},unique:true,description:"HP가 낮은 적을 발견하면 마무리 공격을 강하게 선호한다."
  } as Item,experience:94,history:["마무리 사격 12회","거리 유지 성공률 높음"],color:"#d1a252"},
  {id:"orion",name:"오리온",job:"Mage",level:7,star:1,hp:118,attack:39,defense:10,speed:.94,range:4.8,tendencies:{...defaultTendencies.Mage},item:{
    id:"sage-staff",name:"현자의 지팡이",slot:"weapon",level:7,rarity:"영웅",stats:["마법 공격 +18","관통 +7%"],aiMods:{focus:14,curiosity:10},combatMods:{attack:18},description:"광역 마법과 제어 마법의 사용 빈도를 높인다."
  } as Item,experience:71,history:["광역 마법을 선호","다수 적에게 집중"],color:"#8b70cf"},
  {id:"mira",name:"미라",job:"Cleric",level:5,star:1,hp:142,attack:18,defense:15,speed:.90,range:4.5,tendencies:{...defaultTendencies.Cleric},item:{
    id:"saints-cup",name:"성자의 성배",slot:"accessory",level:5,rarity:"영웅",stats:["치유량 +22%","상태이상 저항 +10%"],aiMods:{protect:34,cooperation:22},combatMods:{healPct:22},unique:true,description:"위험한 아군을 먼저 회복하고 보호한다."
  } as Item,experience:40,history:["카엘을 8회 회복","후퇴 판단으로 생존"],color:"#70b6ad"}
];

export const speciesDefaults: Record<string,{tendencies:Tendencies;behavior:string[];attack:number;defense:number}> = {
  Slime:{tendencies:{aggression:44,bravery:65,caution:30,survival:45,protect:0,pursuit:35,focus:35,greed:10,curiosity:72,cooperation:35},behavior:["분열","흡수","환경 적응"],attack:18,defense:10},
  Goblin:{tendencies:{aggression:60,bravery:42,caution:70,survival:72,protect:25,pursuit:58,focus:50,greed:86,curiosity:82,cooperation:66},behavior:["기습","약자 집중","도주"],attack:22,defense:9},
  Kobold:{tendencies:{aggression:48,bravery:40,caution:82,survival:76,protect:42,pursuit:34,focus:70,greed:62,curiosity:76,cooperation:74},behavior:["함정","매복","협공"],attack:20,defense:12},
  Gnoll:{tendencies:{aggression:78,bravery:72,caution:36,survival:44,protect:18,pursuit:92,focus:68,greed:46,curiosity:38,cooperation:78},behavior:["추격","무리사냥","마무리"],attack:26,defense:13},
  Orc:{tendencies:{aggression:82,bravery:88,caution:24,survival:30,protect:22,pursuit:62,focus:54,greed:34,curiosity:20,cooperation:58},behavior:["정면전","돌파","낮은 후퇴"],attack:31,defense:18},
  Lizardman:{tendencies:{aggression:64,bravery:58,caution:58,survival:48,protect:22,pursuit:54,focus:68,greed:28,curiosity:48,cooperation:68},behavior:["측면공격","매복","수중적응"],attack:25,defense:16},
  Naga:{tendencies:{aggression:55,bravery:56,caution:70,survival:62,protect:26,pursuit:31,focus:86,greed:30,curiosity:72,cooperation:66},behavior:["상태이상","전술","중거리 압박"],attack:28,defense:15},
  Harpy:{tendencies:{aggression:66,bravery:50,caution:68,survival:70,protect:14,pursuit:76,focus:72,greed:38,curiosity:60,cooperation:48},behavior:["기동","후방 습격","고립"],attack:24,defense:11},
  Uruk:{tendencies:{aggression:70,bravery:80,caution:62,survival:52,protect:54,pursuit:42,focus:84,greed:18,curiosity:22,cooperation:92},behavior:["집중사격","지휘","규율"],attack:30,defense:20},
  Ogre:{tendencies:{aggression:95,bravery:92,caution:12,survival:22,protect:0,pursuit:64,focus:32,greed:46,curiosity:14,cooperation:26},behavior:["광역타격","넉백","환경파괴"],attack:48,defense:25},
  Arachne:{tendencies:{aggression:62,bravery:55,caution:72,survival:58,protect:0,pursuit:38,focus:74,greed:52,curiosity:70,cooperation:40},behavior:["거미줄","함정","영역방어"],attack:29,defense:14},
  Siren:{tendencies:{aggression:44,bravery:32,caution:84,survival:78,protect:0,pursuit:18,focus:88,greed:48,curiosity:90,cooperation:30},behavior:["매혹","환각","회피"],attack:27,defense:10},
  Darkworm:{tendencies:{aggression:76,bravery:70,caution:40,survival:50,protect:0,pursuit:44,focus:60,greed:30,curiosity:48,cooperation:12},behavior:["잠복","기습","굴 파기"],attack:36,defense:22},
  Demon:{tendencies:{aggression:72,bravery:68,caution:78,survival:74,protect:34,pursuit:46,focus:96,greed:64,curiosity:88,cooperation:70},behavior:["역할 분석","힐러 우선","재교전"],attack:42,defense:24}
};

const scale = (n:number,level:number,grade:Grade) => {
  const g = grade==="Normal"?1:grade==="Elite"?1.25:grade==="Named"?1.55:1.95;
  // Keep the existing 5-level floor brackets intact while making stat growth
  // predictable across world rounds. The linear curve avoids sudden jumps at
  // Lv.31/Lv.61 and remains easy to tune later.
  const normalizedLevel=Math.max(1,Math.floor(Number(level)||1));
  const levelGrowth=1+(normalizedLevel-1)*.075;
  return Math.round(n*levelGrowth*g);
};

const speedScale = (base:number,level:number,grade:Grade) => {
  const gradeBonus=grade==="Boss"?.12:grade==="Named"?.07:grade==="Elite"?.04:0;
  // Speed grows more gently than HP/attack/defense so higher world rounds
  // feel stronger without turning every battle into a burst-speed check.
  const levelBonus=Math.min(.24,Math.max(0,Math.floor(Number(level)||1)-1)*.0025);
  return Math.max(.2,Math.round((base+gradeBonus)*(1+levelBonus)*100)/100);
};

const mutations:Record<string,{name:string;mods:Partial<Tendencies>;attack:number;defense:number;speed:number;behavior:string}> = {
  "공격성 폭주":{name:"광폭",mods:{aggression:12,bravery:7,caution:-8},attack:7,defense:-2,speed:.06,behavior:"공격 우선"},
  "생존형":{name:"기민",mods:{caution:12,survival:14,pursuit:-6},attack:-2,defense:4,speed:.1,behavior:"위험 회피"},
  "협동형":{name:"무리",mods:{cooperation:14,focus:8},attack:3,defense:3,speed:.02,behavior:"협공 강화"},
  "집중형":{name:"집중",mods:{focus:14,pursuit:8},attack:4,defense:1,speed:.01,behavior:"약점 집중"}
};

function rollMutation(species:string,grade:Grade){
  const chance=grade==="Boss"?.9:grade==="Named"?.75:grade==="Elite"?.5:.3;
  if(Math.random()>chance)return undefined;
  const preferred=species==="Goblin"||species==="Kobold"||species==="Harpy"?"생존형":
    species==="Gnoll"||species==="Orc"||species==="Ogre"?"공격성 폭주":
    species==="Uruk"||species==="Lizardman"?"협동형":
    species==="Naga"||species==="Siren"||species==="Demon"||species==="Arachne"?"집중형":
    ["공격성 폭주","생존형","협동형","집중형"][Math.floor(Math.random()*4)];
  return mutations[preferred];
}

export function createMonster(species:string, level:number, grade:Grade, index:number): Monster {
  const b=speciesDefaults[species] ?? speciesDefaults.Goblin;
  const mutation=rollMutation(species,grade);
  const aggressionBoost=grade==="Boss"?18:grade==="Named"?16:grade==="Elite"?14:12;
  const tendencies={...b.tendencies,aggression:Math.min(100,b.tendencies.aggression+aggressionBoost),bravery:Math.min(100,b.tendencies.bravery+5)};
  if(mutation) for(const [k,v] of Object.entries(mutation.mods)) tendencies[k as keyof Tendencies]=Math.max(0,Math.min(100,tendencies[k as keyof Tendencies]+(v||0)));
  const baseName=grade==="Boss"?species+" 군주":grade==="Named"?species+" 사냥꾼":species;
  return {
    id:species+"-"+index+"-"+Math.random().toString(36).slice(2,7),
    name:mutation?baseName+" ["+mutation.name+"]":baseName,
    species,grade,level,
    hp:Math.max(1,scale(95,level,grade)),maxHp:Math.max(1,scale(95,level,grade)),
    attack:Math.max(1,scale(b.attack+(mutation?.attack||0),level,grade)),
    defense:Math.max(1,scale(b.defense+(mutation?.defense||0),level,grade)),
    speed:Math.max(.2,speedScale(grade==="Boss"?1.08:.9+Math.random()*.25,level,grade)+(mutation?.speed||0)),
    range:species==="Harpy"||species==="Siren"?4:species==="Darkworm"?2.2:1.5,
    tendencies,pos:7-index*0.65,behavior:mutation?[...b.behavior,mutation.behavior]:b.behavior,mutation:mutation?.name
  };
}

export const dungeonStages = [
  {id:"r1",title:"갈림길",kind:"battle" as RoomKind,summary:"고블린 정찰대가 통로를 지키고 있다.",species:["Goblin","Kobold"]},
  {id:"r2",title:"젖은 동굴",kind:"battle" as RoomKind,summary:"슬라임과 리자드맨의 흔적이 남아 있다.",species:["Slime","Lizardman"]},
  {id:"r3",title:"거미 둥지",kind:"elite" as RoomKind,summary:"거미줄로 막힌 좁은 방. 정예가 기다린다.",species:["Arachne","Goblin"]},
  {id:"r4",title:"버려진 제단",kind:"treasure" as RoomKind,summary:"오래된 장비 상자와 작은 제단.",species:[]},
  {id:"r5",title:"휴식처",kind:"rest" as RoomKind,summary:"불이 꺼지지 않은 야영지. 잠시 숨을 고를 수 있다.",species:[]},
  {id:"r6",title:"심층 관문",kind:"boss" as RoomKind,summary:"오크와 우르크를 거느리는 네임드가 길을 막는다.",species:["Orc","Uruk"]}
];

const expandedUniqueItems: Item[] = [
  {id:"storm-breaker",name:"폭풍의 파쇄검",slot:"weapon",level:14,rarity:"신화",stats:["공격력 +31","공격 속도 +10%","추적성 +16"],aiMods:{aggression:22,pursuit:30,bravery:12},combatMods:{attack:31,speedPct:10},unique:true,description:"전투가 길어질수록 추격과 공격 행동을 강하게 선호한다."},
  {id:"guardian-aegis",name:"수호의 아이기스",slot:"armor",level:14,rarity:"신화",stats:["방어력 +25","최대 HP +16%","아군보호 +20"],aiMods:{protect:34,cooperation:24,survival:18,caution:8},combatMods:{defense:25,hpPct:16},unique:true,description:"위험한 동료를 발견하면 자신의 위치보다 보호를 우선한다."},
  {id:"eagle-eye",name:"천리안의 눈",slot:"accessory",level:14,rarity:"신화",stats:["사거리 +1.2","치명타 +12%","집중력 +28"],aiMods:{focus:34,caution:16,pursuit:20},combatMods:{range:1.2,critPct:12},unique:true,description:"거리와 약점 계산에 집중하며 무리한 접근을 줄인다."},
  {id:"mana-core",name:"심층 마나핵",slot:"accessory",level:14,rarity:"신화",stats:["공격력 +26","사거리 +0.8","치유량 +8%"],aiMods:{focus:30,curiosity:26,cooperation:10},combatMods:{attack:26,range:.8,healPct:8},unique:true,description:"전장의 다수 목표를 읽고 강한 능력을 선택한다."},
  {id:"martyr-band",name:"순교자의 인장",slot:"ring",level:14,rarity:"신화",stats:["방어력 +18","최대 HP +18%","아군보호 +25"],aiMods:{protect:38,cooperation:18,bravery:10,survival:16},combatMods:{defense:18,hpPct:18},unique:true,description:"자신의 생존보다 동료를 지키는 행동을 우선한다."},
  {id:"greed-crown",name:"황금 탐욕의 관",slot:"accessory",level:14,rarity:"신화",stats:["공격력 +22","치명타 +10%","탐욕 +32"],aiMods:{greed:36,curiosity:18,aggression:16},combatMods:{attack:22,critPct:10},unique:true,description:"더 큰 보상을 향해 위험한 선택도 감수하는 성향을 강화한다."},
  {id:"survivor-cloak",name:"생환자의 망토",slot:"armor",level:14,rarity:"신화",stats:["방어력 +20","최대 HP +20%","생존본능 +30"],aiMods:{survival:38,caution:28,bravery:-4,pursuit:-8},combatMods:{defense:20,hpPct:20},unique:true,description:"치명적인 상황에서 후퇴와 생존을 매우 강하게 고려한다."},
  {id:"war-chorus",name:"전장의 합창",slot:"ring",level:14,rarity:"신화",stats:["공격 속도 +8%","방어력 +14","협동성 +30"],aiMods:{cooperation:36,focus:18,bravery:12,protect:14},combatMods:{speedPct:8,defense:14},unique:true,description:"동료의 행동을 읽고 협공과 지원 행동을 강화한다."},
];

const extraUniqueItems: Item[] = [
  {id:"immortal-greatsword",name:"불멸자의 대검",slot:"weapon",level:10,rarity:"신화",stats:["공격력 +28","최대 HP +10%","공격 속도 +7%"],aiMods:{aggression:24,bravery:18,survival:-12},combatMods:{attack:28,hpPct:10,speedPct:7},unique:true,description:"치명적인 상황에서도 물러서지 않고 전투를 계속한다."},
  {id:"death-bow",name:"죽음의 활",slot:"weapon",level:10,rarity:"신화",stats:["공격력 +24","사거리 +0.8","치명타 +9%"],aiMods:{focus:26,pursuit:22,greed:6},combatMods:{attack:24,range:.8},unique:true,description:"도망치는 적보다 쓰러뜨릴 수 있는 적을 우선한다."},
  {id:"arcane-lens",name:"비전의 렌즈",slot:"accessory",level:10,rarity:"신화",stats:["공격력 +20","사거리 +0.6","최대 HP +5%"],aiMods:{focus:28,curiosity:20,caution:8},combatMods:{attack:20,range:.6,hpPct:5},unique:true,description:"다수의 적이 모이면 강한 광역 행동을 선택한다."},
  {id:"dead-mans-ring",name:"망자의 반지",slot:"ring",level:10,rarity:"신화",stats:["방어력 +12","최대 HP +14%","치유량 +12%"],aiMods:{survival:20,caution:22,protect:12},combatMods:{defense:12,hpPct:14,healPct:12},unique:true,description:"치명적인 상황에서 생존과 회복 행동을 크게 중시한다."}
];

const massUniqueItems: Item[] = [
{id:"crimson-fang",name:"홍련의 송곳니",slot:"weapon",level:12,rarity:"전설",stats:["공격력 +26","치명타 +8%","공격 속도 +5%"],aiMods:{aggression:24,pursuit:20,bravery:12},combatMods:{attack:26,critPct:8,speedPct:5},unique:true,description:"공격과 추격을 이어가는 전사의 무기."},
{id:"frost-edge",name:"서리의 칼날",slot:"weapon",level:16,rarity:"전설",stats:["공격력 +29","사거리 +0.3","공격 속도 +6%"],aiMods:{focus:18,caution:12,pursuit:16},combatMods:{attack:29,range:.3,speedPct:6},unique:true,description:"거리를 유지하며 정확한 공격을 반복한다."},
{id:"thunder-maul",name:"천둥의 철퇴",slot:"weapon",level:18,rarity:"고대",stats:["공격력 +38","방어력 +8","최대 HP +9%"],aiMods:{aggression:28,bravery:22,cooperation:8},combatMods:{attack:38,defense:8,hpPct:9},unique:true,description:"강한 일격으로 전열을 무너뜨리는 중병기."},
{id:"moonbow",name:"월광의 장궁",slot:"weapon",level:15,rarity:"전설",stats:["공격력 +27","사거리 +1.0","치명타 +10%"],aiMods:{focus:30,caution:16,pursuit:18},combatMods:{attack:27,range:1,critPct:10},unique:true,description:"먼 거리에서 약점을 찾아 마무리한다."},
{id:"starfall-grimoire",name:"성운의 마도서",slot:"weapon",level:20,rarity:"고대",stats:["공격력 +42","사거리 +0.7","치유량 +6%"],aiMods:{focus:32,curiosity:30,cooperation:12},combatMods:{attack:42,range:.7,healPct:6},unique:true,description:"전장의 흐름을 읽고 강력한 마법을 선택한다."},
{id:"dragonheart-blade",name:"용심의 검",slot:"weapon",level:25,rarity:"신화",stats:["공격력 +52","최대 HP +12%","공격 속도 +8%"],aiMods:{aggression:30,bravery:24,pursuit:24},combatMods:{attack:52,hpPct:12,speedPct:8},unique:true,description:"용의 심장처럼 맹렬한 힘을 내뿜는 궁극의 대검."},
{id:"ironbark-armor",name:"철목의 갑주",slot:"armor",level:12,rarity:"전설",stats:["방어력 +30","최대 HP +18%"],aiMods:{survival:28,caution:22,protect:24},combatMods:{defense:30,hpPct:18},unique:true,description:"단단한 외피처럼 피해를 견딘다."},
{id:"phantom-mail",name:"환영의 경갑",slot:"armor",level:16,rarity:"전설",stats:["방어력 +24","공격 속도 +7%","사거리 +0.2"],aiMods:{caution:24,survival:18,pursuit:14},combatMods:{defense:24,speedPct:7,range:.2},unique:true,description:"기동성을 잃지 않으면서 방어력을 확보한다."},
{id:"bastion-plate",name:"철벽의 판금",slot:"armor",level:20,rarity:"고대",stats:["방어력 +44","최대 HP +24%"],aiMods:{protect:34,survival:30,bravery:10},combatMods:{defense:44,hpPct:24},unique:true,description:"아군의 방패가 되어 피해를 받아낸다."},
{id:"windrunner-cloak",name:"질풍의 망토",slot:"armor",level:18,rarity:"고대",stats:["방어력 +22","공격 속도 +10%","사거리 +0.5"],aiMods:{pursuit:28,caution:18,focus:16},combatMods:{defense:22,speedPct:10,range:.5},unique:true,description:"빠른 이동과 공격을 중시한다."},
{id:"abyssal-shell",name:"심연의 껍질",slot:"armor",level:25,rarity:"신화",stats:["방어력 +55","최대 HP +30%"],aiMods:{survival:38,caution:30,protect:20},combatMods:{defense:55,hpPct:30},unique:true,description:"심연의 압력을 견디는 최상위 방어구."},
{id:"oracle-ring",name:"예언자의 반지",slot:"ring",level:13,rarity:"전설",stats:["사거리 +0.6","치명타 +8%","집중력 +24"],aiMods:{focus:34,curiosity:26,caution:12},combatMods:{range:.6,critPct:8},unique:true,description:"전개의 흐름을 읽어 정확한 행동을 선택한다."},
{id:"berserker-band",name:"광전사의 팔찌",slot:"ring",level:15,rarity:"전설",stats:["공격력 +24","공격 속도 +9%"],aiMods:{aggression:34,bravery:24,survival:-10},combatMods:{attack:24,speedPct:9},unique:true,description:"방어보다 공격을 우선한다."},
{id:"lifebloom-ring",name:"생명의 꽃반지",slot:"ring",level:17,rarity:"고대",stats:["방어력 +20","최대 HP +20%","치유량 +18%"],aiMods:{protect:32,cooperation:28,survival:24},combatMods:{defense:20,hpPct:20,healPct:18},unique:true,description:"회복과 동료 보호를 강화한다."},
{id:"void-signet",name:"공허의 인장",slot:"ring",level:22,rarity:"고대",stats:["공격력 +30","사거리 +0.8","치명타 +12%"],aiMods:{focus:36,curiosity:24,pursuit:22},combatMods:{attack:30,range:.8,critPct:12},unique:true,description:"공허의 힘으로 약점을 꿰뚫는다."},
{id:"phoenix-ring",name:"불사조의 반지",slot:"ring",level:25,rarity:"신화",stats:["방어력 +28","최대 HP +28%","치유량 +22%"],aiMods:{survival:34,bravery:20,protect:30},combatMods:{defense:28,hpPct:28,healPct:22},unique:true,description:"쓰러지지 않는 생명력을 상징한다."},
{id:"tactician-lens",name:"전술가의 렌즈",slot:"accessory",level:11,rarity:"전설",stats:["공격력 +20","사거리 +0.7"],aiMods:{focus:30,curiosity:22,cooperation:20},combatMods:{attack:20,range:.7},unique:true,description:"전장의 위치와 목표를 정교하게 계산한다."},
{id:"guardian-talisman",name:"수호신의 부적",slot:"accessory",level:14,rarity:"전설",stats:["방어력 +22","최대 HP +15%"],aiMods:{protect:40,cooperation:32,survival:20},combatMods:{defense:22,hpPct:15},unique:true,description:"위험한 동료를 즉시 보호한다."},
{id:"mana-prism",name:"마력의 프리즘",slot:"accessory",level:19,rarity:"고대",stats:["공격력 +34","사거리 +0.9","치유량 +10%"],aiMods:{focus:34,curiosity:34,cooperation:10},combatMods:{attack:34,range:.9,healPct:10},unique:true,description:"마력을 증폭해 공격과 지원을 함께 강화한다."},
{id:"fortune-charm",name:"행운의 부적",slot:"accessory",level:21,rarity:"고대",stats:["공격력 +25","치명타 +15%"],aiMods:{greed:38,curiosity:24,pursuit:18},combatMods:{attack:25,critPct:15},unique:true,description:"희귀한 기회를 놓치지 않는 탐험가의 부적."},
{id:"worldtree-seed",name:"세계수의 씨앗",slot:"accessory",level:28,rarity:"신화",stats:["방어력 +36","최대 HP +35%","치유량 +20%"],aiMods:{survival:34,protect:34,cooperation:28},combatMods:{defense:36,hpPct:35,healPct:20},unique:true,description:"세계수의 생명력이 깃든 최상위 성장형 장비."},
{id:"black-sun",name:"검은 태양의 핵",slot:"accessory",level:30,rarity:"신화",stats:["공격력 +58","사거리 +1.0","치명타 +16%"],aiMods:{aggression:30,focus:34,bravery:18},combatMods:{attack:58,range:1,critPct:16},unique:true,description:"전장의 모든 시선을 끌어들이는 초월적 핵."},
{id:"ancient-crown",name:"태고의 왕관",slot:"accessory",level:32,rarity:"신화",stats:["공격력 +40","방어력 +32","최대 HP +20%"],aiMods:{bravery:26,cooperation:30,focus:28},combatMods:{attack:40,defense:32,hpPct:20},unique:true,description:"고대 왕들의 권능을 이어받은 왕관."},
{id:"dawn-medallion",name:"여명의 메달",slot:"accessory",level:15,rarity:"고대",stats:["공격력 +23","방어력 +18","최대 HP +14%"],aiMods:{bravery:18,cooperation:24,survival:18},combatMods:{attack:23,defense:18,hpPct:14},unique:true,description:"새로운 전투를 시작하는 용사의 상징."},
{id:"nightveil",name:"밤의 장막",slot:"armor",level:23,rarity:"고대",stats:["방어력 +26","사거리 +0.6","공격 속도 +8%"],aiMods:{caution:32,pursuit:20,focus:24},combatMods:{defense:26,range:.6,speedPct:8},unique:true,description:"어둠 속에서 적의 시선을 피하며 공격한다."},
{id:"kingbreaker",name:"왕을 부수는 창",slot:"weapon",level:27,rarity:"신화",stats:["공격력 +60","치명타 +14%"],aiMods:{aggression:34,pursuit:32,bravery:18},combatMods:{attack:60,critPct:14},unique:true,description:"강대한 적을 추격하고 마무리하는 신화의 창."},
{id:"seraph-wings",name:"세라프의 날개",slot:"armor",level:29,rarity:"신화",stats:["방어력 +34","공격 속도 +12%","치유량 +16%"],aiMods:{bravery:22,cooperation:30,protect:28},combatMods:{defense:34,speedPct:12,healPct:16},unique:true,description:"빛의 수호자가 남긴 초월적 전투 장비."}
];

export const uniqueItems: Item[] = [
  ...heroesSeed.map(h=>h.item).filter((x):x is Item=>!!x),
  ...extraUniqueItems,
  ...expandedUniqueItems,
  ...massUniqueItems
];

export function randomGeneralItem(level:number=6, preference?:Partial<Tendencies>): Item {
  const names=[
    ["철검","weapon"],["전투도끼","weapon"],["장궁","weapon"],["마도서","weapon"],
    ["전쟁망치","weapon"],["쌍날도끼","weapon"],["석궁","weapon"],["정령서","weapon"],
    ["정찰자의 반지","ring"],["사냥꾼의 반지","ring"],["전술의 반지","ring"],
    ["수호 흉갑","armor"],["경량 사슬갑옷","armor"],["심층 판금","armor"],
    ["주술 목걸이","accessory"],["마력 목걸이","accessory"],["수호 부적","accessory"],
    ["기민한 장화","armor"],["추적자의 장화","armor"],["마법사의 로브","armor"]
  ] as const;
  // Higher-level drops keep the same option identity, but their numeric power rises gradually.
  // This keeps Lv.31+ loot from being only a higher label while avoiding abrupt power spikes.
  const normalizedLevel=Math.max(1,Math.floor(Number(level)||1));
  const powerScale=1+Math.max(0,normalizedLevel-6)*.025;
  const scaleRoll=(value:number)=>Math.max(1,Math.round(value*powerScale));
  const [name,slot]=names[Math.floor(Math.random()*names.length)];
  type Roll={text:string;mod:()=>Record<string,number>};
  const rolls:Roll[]=[
    {text:"공격력 +",mod:()=>({attack:scaleRoll(8+Math.floor(Math.random()*18))})},
    {text:"방어력 +",mod:()=>({defense:scaleRoll(6+Math.floor(Math.random()*14))})},
    {text:"치명타 +",mod:()=>({})},
    {text:"최대 HP +",mod:()=>({hpPct:scaleRoll(5+Math.floor(Math.random()*16))})},
    {text:"공격 속도 +",mod:()=>({speedPct:scaleRoll(2+Math.floor(Math.random()*9))})},
    {text:"사거리 +",mod:()=>({range:Math.round(Number((.2+Math.random()*.7).toFixed(1))*powerScale*10)/10})},
    {text:"치유량 +",mod:()=>({healPct:scaleRoll(5+Math.floor(Math.random()*15))})},
    {text:"피해 감소 +",mod:()=>({defense:scaleRoll(2+Math.floor(Math.random()*5))})}
  ];
  const shuffled=rolls.slice().sort(()=>Math.random()-.5);
  const count=2+Math.floor(Math.random()*3);
  const picked=shuffled.slice(0,count);
  const combatMods:NonNullable<Item["combatMods"]>={};
  const stats:string[]=[];
  for(const r of picked){
    const m=r.mod();
    for(const [key,value] of Object.entries(m)) combatMods[key as keyof typeof combatMods]=(combatMods[key as keyof typeof combatMods]||0)+value;
    if(r.text==="치명타 +"){
      const crit=scaleRoll(2+Math.floor(Math.random()*8));
      combatMods.critPct=crit;
      stats.push("치명타 +"+crit+"%");
    }
    else if(r.text==="사거리 +")stats.push(r.text+String(m.range));
    else stats.push(r.text+String(Object.values(m)[0])+(r.text.includes("HP")||r.text.includes("속도")||r.text.includes("치유")||r.text.includes("감소")?"%":""));
  }
  const allKeys=(Object.keys(defaultTendencies.Warrior) as (keyof Tendencies)[]);
  const preferredKeys=preference
    ? allKeys.slice().sort((a,b)=>(preference[b]||0)-(preference[a]||0)).slice(0,4)
    : [];
  const aiKeys=allKeys.slice().sort(()=>Math.random()-.5).filter(k=>!preferredKeys.includes(k)).slice(0,1+Math.floor(Math.random()*2)).concat(preferredKeys.slice(0,1+Math.floor(Math.random()*2)));
  const aiMods:Partial<Tendencies>={};
  for(const key of aiKeys){
    const base=preference?.[key]||50;
    aiMods[key]=Math.round((base>=70?3:base>=55?1:-1)+(Math.random()*9-4));
  }
  const roll=Math.random();
  const rarity=roll<.002?"신화":roll<.01?"고대":roll<.06?"전설":roll<.18?"영웅":roll<.48?"희귀":roll<.78?"고급":"일반";
  return {
    id:`roll-${Date.now()}-${Math.random()}`,name,slot,level,rarity,stats,aiMods,combatMods,
    description:"각 옵션과 AI 성향 보정이 독립적으로 굴러가는 무작위 일반 장비."
  };
}

export function uniqueLootCopy(item:Item,level:number):Item {
  const normalizedLevel=Math.max(1,Math.floor(Number(level)||1));
  // 고유 장비도 후반 회차에서 기본 레벨과 전투 수치가 자연스럽게 따라오도록 한다.
  // 증가폭은 일반 장비보다 조금 낮게 잡고, 표시 옵션과 실제 전투 수치를 함께 맞춘다.
  const powerScale=1+Math.max(0,normalizedLevel-item.level)*.02;
  const scaleValue=(value:number)=>Math.round(value*powerScale*100)/100;
  const combatMods=item.combatMods?Object.fromEntries(Object.entries(item.combatMods).map(([key,value])=>[key,scaleValue(value||0)])):undefined;
  const stats=item.stats.map(stat=>stat.replace(/(\\d+(?:\\.\\d+)?)/,(match)=>{
    const value=Number(match);
    const scaled=scaleValue(value);
    return Number.isInteger(scaled)?String(Math.round(scaled)):String(scaled);
  }));
  return {
    ...item,
    id:item.id+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),
    level:Math.max(item.level,normalizedLevel),
    combatMods,
    stats
  };
}

export function rollBattleLoot(level:number, room:RoomKind, preference?:Partial<Tendencies>, rewardMultiplier=1): Item[] {
  const general=randomGeneralItem(Math.max(1,level),preference);
  const bossLike=room==="boss"||room==="evilCave";
  const eliteLike=room==="elite";
  const baseUniqueChance=room==="evilCave"?.55:room==="boss"?.35:room==="elite"?.16:.08;
  // Later-level dungeons gain a small additional unique-drop chance, capped to keep the economy stable.
  const levelBonus=Math.min(.04,Math.max(0,Math.floor(Number(level)||1)-6)*.0015);
  const uniqueChance=(baseUniqueChance+levelBonus)*Math.max(.3,Math.min(1,rewardMultiplier));
  const loot=[general];
  if(bossLike||eliteLike||Math.random()<uniqueChance){
    if(Math.random()<uniqueChance){
      loot.push(uniqueLootCopy(uniqueItems[Math.floor(Math.random()*uniqueItems.length)],level));
    } else if(bossLike||eliteLike){
      loot.push(randomGeneralItem(Math.max(1,level+1),preference));
    }
  }
  return loot;
}

export function chooseMonsterSpecies(floor:number): string {
  const pools = floor<4 ? ["Goblin","Kobold","Slime"] : floor<6 ? ["Lizardman","Arachne","Gnoll"] : ["Orc","Uruk","Ogre"];
  return pools[Math.floor(Math.random()*pools.length)];
}

export function cloneTendencies(t:Tendencies):Tendencies { return {...t}; }


const recruitNames=["아르노","벨라","카린","도렌","에이든","마레","루카스","세아","테오","리엔","노아","엘린"];

export function createRecruitHero(job:Job):Hero{
  const base=defaultTendencies[job];
  const tendencies={...base} as Tendencies;
  const keys=(Object.keys(tendencies) as (keyof Tendencies)[]).sort(()=>Math.random()-.5).slice(0,3);
  keys.forEach(k=>tendencies[k]=Math.max(0,Math.min(100,tendencies[k]+Math.floor(Math.random()*19)-9)));
  const name=recruitNames[Math.floor(Math.random()*recruitNames.length)]+" "+String(Math.floor(Math.random()*90)+10);
    return {
    id:"recruit-"+Date.now()+"-"+Math.random().toString(36).slice(2,8),
    name,job,level:1,star:1,hp:115,maxHp:115,attack:20,defense:11,speed:.92,range:job==="Archer"||job==="Mage"||job==="Cleric"?4.2:1.4,
    tendencies,equipment:[],experience:0,skillPoints:0,passiveSkills:{},history:["모집된 신규 용사"],color:"#6f819b",personality:buildPersonality({id:"recruit-temp",name,job,tendencies}),skinIds:[job.toLowerCase()+"-base"],equippedSkinId:job.toLowerCase()+"-base",
    campaignStats:{wins:0,losses:0,eliteWins:0,bossWins:0,repeatWins:0,finalWins:0},
    chronicle:[]
  };
}
