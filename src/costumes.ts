import type { Job } from "./dungeonData";

export type CostumeTier="Normal"|"Rare"|"Unique";
export type Costume={id:string;tier:CostumeTier;name:string;description:string;style:string};

const jobName:Record<Job,string>={Warrior:"전사",Guardian:"수호자",Archer:"궁수",Mage:"마법사",Cleric:"성직자"};

const templates=[
  {id:"beach",tier:"Normal" as CostumeTier,name:"해변 휴양복",description:"해변가에 놀러 온 가벼운 휴양복 스타일.",style:"시원하고 편안한 바캉스"},
  {id:"summer",tier:"Normal" as CostumeTier,name:"한여름 평상복",description:"한여름 마을에서 입는 실용적인 일상복.",style:"청량한 일상복"},
  {id:"fur-winter",tier:"Normal" as CostumeTier,name:"혹한기 모피복장",description:"혹한의 동굴과 설원을 견디는 두꺼운 모피 복장.",style:"방한 중심의 야외복"},
  {id:"barbarian",tier:"Rare" as CostumeTier,name:"바바리안 코스튬",description:"야성적인 전사의 분위기를 강조한 전투 의상.",style:"거친 야전 전사"},
  {id:"bodysuit",tier:"Rare" as CostumeTier,name:"미래형 바디슈트",description:"미래 기술을 연상시키는 기능성 전투 슈트.",style:"첨단 전투 장비"},
  {id:"monster-disguise",tier:"Rare" as CostumeTier,name:"몬스터 변장 코스튬",description:"동굴 종족으로 위장하기 위한 모험용 변장 의상.",style:"동굴 잠입 위장"},
  {id:"light-hero",tier:"Unique" as CostumeTier,name:"빛의 용사 코스튬",description:"빛의 문양과 성휘가 새겨진 전설의 영웅 의상.",style:"성광의 전설"},
  {id:"fallen-hero",tier:"Unique" as CostumeTier,name:"타락용사 코스튬",description:"봉인의 어둠과 맞닿은 타락한 영웅의 의상.",style:"암흑의 전설"}
];

export function costumesForJob(job:Job):Costume[]{
  return templates.map(t=>({
    ...t,
    id:job.toLowerCase()+"-"+t.id,
    name:jobName[job]+" · "+t.name,
    description:t.description+" "+jobName[job]+"의 전투 장비 실루엣에 맞춰 재해석된다."
  }));
}

export function costumeLabel(job:Job,id?:string):string{
  if(!id)return "기본 복장";
  const item=costumesForJob(job).find(x=>x.id===id);
  return item?.name||"기본 복장";
}
