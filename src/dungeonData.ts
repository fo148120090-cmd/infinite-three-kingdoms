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
  unique?:boolean; description:string;
};

export type Relationship = {trust:number; respect:number; fear:number; bond:number};
export type Memory = {text:string; weight:number; createdAt:number};

export type Hero = {
  id:string; name:string; job:Job; level:number; hp:number; attack:number; defense:number;
  speed:number; range:number; tendencies:Tendencies; item:Item; experience:number;
  history:string[]; color:string; promotionTier?:number; promotionPath?:string[];
  relationships?:Record<string,Relationship>; memories?:Memory[]; behaviorCounts?:Record<string,number>;
  chronicle?:{kind:"achievement"|"title";id:string;name:string;description:string;earnedAt:number}[];
  mood?:string; statusNote?:string; evaluation?:string;
  campaignStats?:{wins:number;losses:number;eliteWins:number;bossWins:number;repeatWins:number;finalWins:number};
  costumeId?:string;
};

export type MonsterLineage = {
  id:string; species:string; level:number; experience:number; focus:Record<string,number>;
  evolutionStage:number; evolutionPath:string[]; lastMemory?:string;
};

export type Monster = {
  id:string; name:string; species:string; grade:Grade; level:number; hp:number; attack:number;
  defense:number; speed:number; range:number; tendencies:Tendencies; pos:number; maxHp:number;
  behavior:string[]; mutation?:string;
};

export type BattleUnit = {
  id:string; name:string; team:"player"|"enemy"; species?:string; job?:Job; grade?:Grade;
  hp:number; maxHp:number; attack:number; defense:number; speed:number; range:number;
  pos:number; alive:boolean; tendencies:Tendencies; item?:Item; actionText:string;
  cooldown:number; guard:number; xp:number; relationships?:Record<string,Relationship>; memories?:Memory[]; mutation?:string; behaviorCounts?:Record<string,number>; promotionPath?:string[];
};

export const defaultTendencies: Record<Job,Tendencies> = {
  Warrior:{aggression:82,bravery:74,caution:32,survival:28,protect:34,pursuit:80,focus:58,greed:40,curiosity:38,cooperation:45},
  Guardian:{aggression:46,bravery:68,caution:64,survival:58,protect:94,pursuit:28,focus:76,greed:18,curiosity:22,cooperation:88},
  Archer:{aggression:58,bravery:46,caution:64,survival:62,protect:35,pursuit:50,focus:90,greed:34,curiosity:54,cooperation:62},
  Mage:{aggression:62,bravery:38,caution:68,survival:58,protect:44,pursuit:26,focus:88,greed:30,curiosity:82,cooperation:58},
  Cleric:{aggression:30,bravery:42,caution:72,survival:76,protect:96,pursuit:18,focus:74,greed:14,curiosity:46,cooperation:94}
};

export const heroesSeed: Hero[] = [
  {id:"kael",name:"카엘",job:"Warrior",level:6,hp:172,attack:34,defense:18,speed:1.05,range:1.4,tendencies:{...defaultTendencies.Warrior},item:{
    id:"iron-greatsword",name:"정련된 대검",slot:"weapon",level:6,rarity:"희귀",stats:["공격력 +14","치명타 +4%"],aiMods:{aggression:8,pursuit:6},combatMods:{attack:14},description:"공격적인 전투를 돕는 고성능 일반 장비."
  },experience:62,history:["돌진을 자주 선택","약한 적 추격"],color:"#d65a5a"},
  {id:"seren",name:"세린",job:"Guardian",level:6,hp:218,attack:24,defense:32,speed:.82,range:1.3,tendencies:{...defaultTendencies.Guardian},item:{
    id:"guardian-wall",name:"수호자의 성벽",slot:"accessory",level:6,rarity:"전설",stats:["방어력 +18","최대 HP +12%"],aiMods:{protect:50,cooperation:18,survival:18},combatMods:{defense:18,hpPct:12},unique:true,description:"부상당한 아군 쪽으로 이동하고 보호 행동을 우선한다."
  } as Item,experience:88,history:["전투마다 아군 보호","후퇴 명령을 거의 하지 않음"],color:"#5b8bd9"},
  {id:"lyra",name:"리라",job:"Archer",level:7,hp:134,attack:30,defense:14,speed:1.16,range:5.2,tendencies:{...defaultTendencies.Archer},item:{
    id:"hunter-eye",name:"사냥꾼의 눈",slot:"ring",level:7,rarity:"전설",stats:["명중 +8%","치명타 +6%"],aiMods:{focus:20,pursuit:16},combatMods:{range:.3},unique:true,description:"HP가 낮은 적을 발견하면 마무리 공격을 강하게 선호한다."
  } as Item,experience:94,history:["마무리 사격 12회","거리 유지 성공률 높음"],color:"#d1a252"},
  {id:"orion",name:"오리온",job:"Mage",level:7,hp:118,attack:39,defense:10,speed:.94,range:4.8,tendencies:{...defaultTendencies.Mage},item:{
    id:"sage-staff",name:"현자의 지팡이",slot:"weapon",level:7,rarity:"영웅",stats:["마법 공격 +18","관통 +7%"],aiMods:{focus:14,curiosity:10},combatMods:{attack:18},description:"광역 마법과 제어 마법의 사용 빈도를 높인다."
  } as Item,experience:71,history:["광역 마법을 선호","다수 적에게 집중"],color:"#8b70cf"},
  {id:"mira",name:"미라",job:"Cleric",level:5,hp:142,attack:18,defense:15,speed:.90,range:4.5,tendencies:{...defaultTendencies.Cleric},item:{
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
  return Math.round(n*(1+(level-1)*.075)*g);
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
  const tendencies={...b.tendencies};
  if(mutation) for(const [k,v] of Object.entries(mutation.mods)) tendencies[k as keyof Tendencies]=Math.max(0,Math.min(100,tendencies[k as keyof Tendencies]+(v||0)));
  const baseName=grade==="Boss"?species+" 군주":grade==="Named"?species+" 사냥꾼":species;
  return {
    id:species+"-"+index+"-"+Math.random().toString(36).slice(2,7),
    name:mutation?baseName+" ["+mutation.name+"]":baseName,
    species,grade,level,
    hp:Math.max(1,scale(95,level,grade)),maxHp:Math.max(1,scale(95,level,grade)),
    attack:Math.max(1,scale(b.attack+(mutation?.attack||0),level,grade)),
    defense:Math.max(1,scale(b.defense+(mutation?.defense||0),level,grade)),
    speed:(grade==="Boss"?1.08:.9+Math.random()*.25)+(mutation?.speed||0),
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

const extraUniqueItems: Item[] = [
  {id:"immortal-greatsword",name:"불멸자의 대검",slot:"weapon",level:10,rarity:"신화",stats:["공격력 +28","최대 HP +10%","공격 속도 +7%"],aiMods:{aggression:24,bravery:18,survival:-12},combatMods:{attack:28,hpPct:10,speedPct:7},unique:true,description:"치명적인 상황에서도 물러서지 않고 전투를 계속한다."},
  {id:"death-bow",name:"죽음의 활",slot:"weapon",level:10,rarity:"신화",stats:["공격력 +24","사거리 +0.8","치명타 +9%"],aiMods:{focus:26,pursuit:22,greed:6},combatMods:{attack:24,range:.8},unique:true,description:"도망치는 적보다 쓰러뜨릴 수 있는 적을 우선한다."},
  {id:"arcane-lens",name:"비전의 렌즈",slot:"accessory",level:10,rarity:"신화",stats:["공격력 +20","사거리 +0.6","최대 HP +5%"],aiMods:{focus:28,curiosity:20,caution:8},combatMods:{attack:20,range:.6,hpPct:5},unique:true,description:"다수의 적이 모이면 강한 광역 행동을 선택한다."},
  {id:"dead-mans-ring",name:"망자의 반지",slot:"ring",level:10,rarity:"신화",stats:["방어력 +12","최대 HP +14%","치유량 +12%"],aiMods:{survival:20,caution:22,protect:12},combatMods:{defense:12,hpPct:14,healPct:12},unique:true,description:"치명적인 상황에서 생존과 회복 행동을 크게 중시한다."}
];

export const uniqueItems: Item[] = [
  heroesSeed[1].item,heroesSeed[2].item,heroesSeed[4].item,...extraUniqueItems
];

export function randomGeneralItem(level:number=6, preference?:Partial<Tendencies>): Item {
  const names=[
    ["철검","weapon"],["전투도끼","weapon"],["장궁","weapon"],["마도서","weapon"],
    ["정찰자의 반지","ring"],["수호 흉갑","armor"],["주술 목걸이","accessory"],["기민한 장화","armor"]
  ] as const;
  const [name,slot]=names[Math.floor(Math.random()*names.length)];
  type Roll={text:string;mod:()=>Record<string,number>};
  const rolls:Roll[]=[
    {text:"공격력 +",mod:()=>({attack:8+Math.floor(Math.random()*18)})},
    {text:"방어력 +",mod:()=>({defense:6+Math.floor(Math.random()*14)})},
    {text:"치명타 +",mod:()=>({})},
    {text:"최대 HP +",mod:()=>({hpPct:5+Math.floor(Math.random()*16)})},
    {text:"공격 속도 +",mod:()=>({speedPct:2+Math.floor(Math.random()*9)})},
    {text:"사거리 +",mod:()=>({range:Number((.2+Math.random()*.7).toFixed(1))})},
    {text:"치유량 +",mod:()=>({healPct:5+Math.floor(Math.random()*15)})},
    {text:"피해 감소 +",mod:()=>({defense:2+Math.floor(Math.random()*5)})}
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
      const crit=2+Math.floor(Math.random()*8);
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
  const rarity=roll<.06?"전설":roll<.24?"영웅":roll<.58?"희귀":"고급";
  return {
    id:`roll-${Date.now()}-${Math.random()}`,name,slot,level,rarity,stats,aiMods,combatMods,
    description:"각 옵션과 AI 성향 보정이 독립적으로 굴러가는 무작위 일반 장비."
  };
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
  const item=randomGeneralItem(1,tendencies);
  return {
    id:"recruit-"+Date.now()+"-"+Math.random().toString(36).slice(2,8),
    name,job,level:1,hp:115,attack:20,defense:11,speed:.92,range:job==="Archer"||job==="Mage"||job==="Cleric"?4.2:1.4,
    tendencies,item,experience:0,history:["모집된 신규 용사"],color:"#6f819b",
    campaignStats:{wins:0,losses:0,eliteWins:0,bossWins:0,repeatWins:0,finalWins:0},
    chronicle:[]
  };
}
