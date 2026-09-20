import type { Job } from "./dungeonData";

export type CostumeTier="Normal"|"Rare"|"Unique";
export type Costume={id:string;tier:CostumeTier;name:string;description:string;style:string;icon:string};
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
  if(skin.id.endsWith("-base")||skin.tier==="Normal")return {gold:skin.id.endsWith("-base")?0:180,materials:skin.id.endsWith("-base")?0:0};
  if(skin.tier==="Rare")return {gold:450,materials:35};
  return {gold:1200,materials:110};
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
  return cost.gold===0?"기본 지급":cost.gold+"G"+(cost.materials?" · "+cost.materials+" 자원":"");
}
