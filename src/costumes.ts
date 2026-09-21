import type { Job } from "./dungeonData";

export type CostumeTier="Normal"|"Rare"|"Unique";
export type Costume={id:string;tier:CostumeTier;name:string;description:string;style:string;icon:string};
export type CostumeCombatBonus={attack:number;defense:number;hpPct:number;speedPct:number;range:number;healPct:number;critPct:number};
export type SkinTheme={background:string;primary:string;secondary:string;accent:string;motif:string};
export type Skin=Costume;

const jobName:Record<Job,string>={Warrior:"전사",Guardian:"수호자",Archer:"궁수",Mage:"마법사",Cleric:"성직자"};

const templates=[
  {id:"base",tier:"Normal" as CostumeTier,name:"기본 모험복",description:"동굴 원정에 맞춘 기본 전투 복장.",style:"원정대 기본복",icon:"♙"},
  {id:"beach",tier:"Normal" as CostumeTier,name:"해변 휴양복",description:"해변가에 놀러 온 가벼운 휴양복 스타일.",style:"시원하고 편안한 바캉스",icon:"☀"},
  {id:"summer",tier:"Normal" as CostumeTier,name:"한여름 평상복",description:"한여름 마을에서 입는 실용적인 일상복.",style:"청량한 일상복",icon:"🌿"},
  {id:"fur-winter",tier:"Normal" as CostumeTier,name:"혹한기 모피복장",description:"혹한의 동굴과 설원을 견디는 두꺼운 모피 복장.",style:"방한 중심의 야외복",icon:"❄"},
  {id:"barbarian",tier:"Rare" as CostumeTier,name:"바바리안 코스튬",description:"야성적인 전사의 분위기를 강조한 전투 의상.",style:"거친 야전 전사",icon:"⚔"},
  {id:"bodysuit",tier:"Rare" as CostumeTier,name:"미래형 바디슈트",description:"미래 기술을 연상시키는 기능성 전투 슈트.",style:"첨단 전투 장비",icon:"◈"},
  {id:"monster-disguise",tier:"Rare" as CostumeTier,name:"몬스터 변장 코스튬",description:"동굴 종족으로 위장하기 위한 모험용 변장 의상.",style:"동굴 잠입 위장",icon:"👹"},
  {id:"light-hero",tier:"Unique" as CostumeTier,name:"빛의 용사 코스튬",description:"빛의 문양과 성휘가 새겨진 전설의 영웅 의상.",style:"성광의 전설",icon:"✦"},
  {id:"fallen-hero",tier:"Unique" as CostumeTier,name:"타락용사 코스튬",description:"봉인의 어둠과 맞닿은 타락한 영웅의 의상.",style:"암흑의 전설",icon:"☾"}
];

export function costumesForJob(job:Job):Costume[]{
  return templates.map(t=>({
    ...t,
    id:job.toLowerCase()+"-"+t.id,
    name:jobName[job]+" · "+t.name,
    description:t.description+" "+jobName[job]+"의 전투 장비 실루엣에 맞춰 재해석된다."
  }));
}
export const skinsForJob=costumesForJob;

export function costumeLabel(job:Job,id?:string):string{
  if(!id)return "기본 복장";
  const item=costumesForJob(job).find(x=>x.id===id);
  return item?.name||"기본 복장";
}
export const skinLabel=costumeLabel;

export function skinCost(skin:Costume){
  if(skin.id.endsWith("-base")||skin.tier==="Normal")return {gold:skin.id.endsWith("-base")?0:180};
  if(skin.tier==="Rare")return {gold:800};
  return {gold:2300};
}

const costumeBonusByKey:Record<string,CostumeCombatBonus>={
  // 코스튬은 밸런스 제한 없이 고성능 성장 요소로 사용한다.
  // 전투 적용 단계에서도 동일하게 5배가 적용되므로, 데이터 자체도 5배 수치로 관리한다.
  base:{attack:0,defense:0,hpPct:5,speedPct:0,range:0,healPct:0,critPct:0},
  beach:{attack:0,defense:0,hpPct:5,speedPct:5,range:0,healPct:0,critPct:0},
  summer:{attack:5,defense:0,hpPct:5,speedPct:5,range:0,healPct:5,critPct:0},
  "fur-winter":{attack:0,defense:10,hpPct:10,speedPct:0,range:0,healPct:0,critPct:0},
  barbarian:{attack:15,defense:5,hpPct:10,speedPct:5,range:0,healPct:0,critPct:5},
  bodysuit:{attack:5,defense:5,hpPct:5,speedPct:15,range:.5,healPct:0,critPct:10},
  "monster-disguise":{attack:10,defense:10,hpPct:10,speedPct:5,range:0,healPct:5,critPct:5},
  "light-hero":{attack:25,defense:15,hpPct:20,speedPct:10,range:1,healPct:10,critPct:10},
  "fallen-hero":{attack:30,defense:10,hpPct:15,speedPct:15,range:0,healPct:0,critPct:15}
};
export function costumeCombatBonus(id?:string):CostumeCombatBonus{
  const key=id? id.split("-").slice(1).join("-"):"base";
  const base=costumeBonusByKey[key]||costumeBonusByKey.base;
  // 코스튬 고유 전투 능력치는 기존 수치의 5배로 적용한다.
  return {
    attack:base.attack,
    defense:base.defense,
    hpPct:base.hpPct,
    speedPct:base.speedPct,
    range:base.range,
    healPct:base.healPct,
    critPct:base.critPct
  };
}
export type CostumePassiveBonus={name:string;detail:string;attack:number;defense:number;hpPct:number;speedPct:number;range:number;healPct:number;critPct:number};
const costumePassiveByKey:Record<string,CostumePassiveBonus>= {
  base:{name:"기본 전투 감각",detail:"추가 효과 없음",attack:0,defense:0,hpPct:0,speedPct:0,range:0,healPct:0,critPct:0},
  beach:{name:"파도 타기",detail:"이동 속도와 생존력을 강화한다.",attack:0,defense:2,hpPct:3,speedPct:4,range:0,healPct:0,critPct:0},
  summer:{name:"청량한 집중",detail:"공격과 치유 행동의 효율을 높인다.",attack:3,defense:0,hpPct:0,speedPct:3,range:.1,healPct:4,critPct:1},
  "fur-winter":{name:"혹한 적응",detail:"방어와 최대 HP를 크게 강화한다.",attack:0,defense:6,hpPct:6,speedPct:0,range:0,healPct:0,critPct:0},
  barbarian:{name:"야전 광전",detail:"공격 압박과 치명타를 강화한다.",attack:7,defense:2,hpPct:3,speedPct:3,range:0,healPct:0,critPct:3},
  bodysuit:{name:"전술 오버클럭",detail:"기동성과 사거리를 강화한다.",attack:3,defense:2,hpPct:2,speedPct:7,range:.25,healPct:0,critPct:4},
  "monster-disguise":{name:"종족 위장술",detail:"방어와 약화 지원 효율을 강화한다.",attack:4,defense:5,hpPct:4,speedPct:2,range:0,healPct:5,critPct:2},
  "light-hero":{name:"성휘의 가호",detail:"공격·방어·치유를 동시에 강화한다.",attack:8,defense:7,hpPct:6,speedPct:4,range:.2,healPct:8,critPct:4},
  "fallen-hero":{name:"타락의 폭주",detail:"공격과 치명타를 크게 강화한다.",attack:10,defense:3,hpPct:4,speedPct:6,range:0,healPct:0,critPct:7}
};
export function costumePassive(id?:string):CostumePassiveBonus{
  const key=id? id.split("-").slice(1).join("-"):"base";
  return costumePassiveByKey[key]||costumePassiveByKey.base;
}
export function ownedCostumePassive(ids:string[]=[]):CostumePassiveBonus{
  const total:CostumePassiveBonus={name:"코스튬 패시브",detail:"장착 코스튬 패시브 합산",attack:0,defense:0,hpPct:0,speedPct:0,range:0,healPct:0,critPct:0};
  ids.forEach(id=>{const b=costumePassive(id);(Object.keys(total) as (keyof CostumePassiveBonus)[]).filter(k=>k!=="name"&&k!=="detail").forEach(k=>total[k]+=b[k] as number);});
  return total;
}
export function ownedCostumeCombatBonus(ids:string[]=[]):CostumeCombatBonus{
  const total:CostumeCombatBonus={attack:0,defense:0,hpPct:0,speedPct:0,range:0,healPct:0,critPct:0};
  ids.forEach(id=>{const b=costumeCombatBonus(id);(Object.keys(total) as (keyof CostumeCombatBonus)[]).forEach(k=>total[k]+=b[k]);});
  return total;
}
export function costumeStatLabels(ids:string[]=[]){
  const b=ownedCostumeCombatBonus(ids);
  return [
    b.attack?"공격 +"+b.attack:undefined,
    b.defense?"방어 +"+b.defense:undefined,
    b.hpPct?"HP +"+b.hpPct+"%":undefined,
    b.speedPct?"속도 +"+b.speedPct+"%":undefined,
    b.range?"사거리 +"+b.range:undefined,
    b.healPct?"치유 +"+b.healPct+"%":undefined,
    b.critPct?"치명타 +"+b.critPct+"%":undefined
  ].filter((x):x is string=>!!x);
}
export function skinVisual(id?:string){
  if(!id)return "♙";
  const key=id.split("-").slice(1).join("-");
  return templates.find(x=>x.id===key)?.icon||"♙";
}
const themeByKey:Record<string,SkinTheme>={
  base:{background:"#182337",primary:"#c7d1df",secondary:"#4e6485",accent:"#d9c27c",motif:"crest"},
  beach:{background:"#16384a",primary:"#f1f3e5",secondary:"#4ea9ba",accent:"#f0c76d",motif:"sun"},
  summer:{background:"#203e2b",primary:"#e9f2df",secondary:"#67a86e",accent:"#d7d07a",motif:"leaf"},
  "fur-winter":{background:"#26313d",primary:"#f0eee7",secondary:"#768596",accent:"#9ec1dc",motif:"snow"},
  barbarian:{background:"#3a241d",primary:"#a85e42",secondary:"#533027",accent:"#d6a55a",motif:"blade"},
  bodysuit:{background:"#172a39",primary:"#5fb6c8",secondary:"#243e56",accent:"#9fe8ef",motif:"tech"},
  "monster-disguise":{background:"#2a2232",primary:"#7b5d48",secondary:"#41324d",accent:"#cf9b6c",motif:"horn"},
  "light-hero":{background:"#2c2a1c",primary:"#f4e7ad",secondary:"#9da2d6",accent:"#fff4bc",motif:"halo"},
  "fallen-hero":{background:"#1c1b27",primary:"#4d456a",secondary:"#262331",accent:"#b26a9e",motif:"void"}
};
export function skinTheme(id?:string):SkinTheme{
  const key=id? id.split("-").slice(1).join("-"):"base";
  return themeByKey[key]||themeByKey.base;
}
export function skinUnlockText(skin:Costume){
  const cost=skinCost(skin);
  return cost.gold===0?"기본 지급":cost.gold+"G";
}
