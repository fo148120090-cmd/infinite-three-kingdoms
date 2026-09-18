import type { Hero, Tendencies } from "./dungeonData";
import type { EnvironmentKind } from "./dungeonEnvironment";


type EventUpdate={hpDelta?:number;tendencies?:Partial<Tendencies>};
export type DungeonEventOutcome={
  text:string;
  gold:number;
  materials:number;
  heroUpdates:Record<string,EventUpdate>;
};

const clamp=(n:number)=>Math.max(0,Math.min(100,n));

const partyPreference=(party:Hero[]):Partial<Tendencies>=>{
  const out:Partial<Tendencies>={};
  if(!party.length)return out;
  (Object.keys(party[0].tendencies) as (keyof Tendencies)[]).forEach(k=>out[k]=party.reduce((n,h)=>n+h.tendencies[k],0)/party.length);
  return out;
};


export function resolveHiddenRoom(heroes:Hero[],partyIds:string[],floor:number,environment:EnvironmentKind):DungeonEventOutcome{
  const party=heroes.filter(h=>partyIds.includes(h.id));
  const heroUpdates:Record<string,EventUpdate>={};
  const curiosity=party.length?party.reduce((n,h)=>n+h.tendencies.curiosity,0)/party.length:0;
  const focus=party.length?party.reduce((n,h)=>n+h.tendencies.focus,0)/party.length:0;
  party.forEach(h=>heroUpdates[h.id]={tendencies:{curiosity:clamp(h.tendencies.curiosity+1.2),focus:clamp(h.tendencies.focus+.5)}});
  const envReward=environment==="water"?20:environment==="dark"?18:environment==="unstable"?28:12;
  return {text:`숨은 방 발견 · ${environmentInfoName(environment)} · 호기심 ${Math.round(curiosity)}/100 / 집중 ${Math.round(focus)}/100`,gold:220,materials:envReward,heroUpdates};
}
function environmentInfoName(environment:EnvironmentKind){return environment==="dark"?"암흑 보관실":environment==="narrow"?"비밀 측로":environment==="toxic"?"해독 연구실":environment==="water"?"수중 금고":"공명 수정실";}

export function resolveDungeonEvent(heroes:Hero[],partyIds:string[],floor:number,environment?:EnvironmentKind):DungeonEventOutcome{
  const party=heroes.filter(h=>partyIds.includes(h.id));
  const avg=(key:keyof Tendencies)=>party.length?party.reduce((n,h)=>n+h.tendencies[key],0)/party.length:0;
  const curiosity=avg("curiosity"), caution=avg("caution"), greed=avg("greed"), bravery=avg("bravery"), survival=avg("survival"), focus=avg("focus"), cooperation=avg("cooperation");
  const roll=Math.random();
  const heroUpdates:Record<string,EventUpdate>={}; 
  party.forEach(h=>heroUpdates[h.id]={});
  const touch=(id:string,update:EventUpdate)=>{
    const prev=heroUpdates[id]||{};
    heroUpdates[id]={...prev,hpDelta:(prev.hpDelta||0)+(update.hpDelta||0),tendencies:{...(prev.tendencies||{}),...(update.tendencies||{})}};
  };

  if(environment==="dark" && curiosity>=62 && roll<.52){
    party.forEach(h=>touch(h.id,{tendencies:{curiosity:clamp(h.tendencies.curiosity+1),focus:clamp(h.tendencies.focus+.6)}}));
    return {text:"암흑 기록실: 어둠 속 숨겨진 문서를 찾아 추가 자원을 확보했다.",gold:190,materials:28,heroUpdates};
  }
  if(environment==="narrow" && caution<58 && roll<.55){
    const damage=Math.max(5,Math.round(9+(58-caution)*.18));
    party.forEach(h=>touch(h.id,{hpDelta:-damage,tendencies:{caution:clamp(h.tendencies.caution-.6),survival:clamp(h.tendencies.survival+.5)}}));
    return {text:"압력판 통로: 좁은 길에서 함정이 작동해 파티가 피해를 입었다.",gold:70,materials:16,heroUpdates};
  }
  if(environment==="toxic" && survival>=58 && roll<.58){
    party.forEach(h=>touch(h.id,{hpDelta:10,tendencies:{survival:clamp(h.tendencies.survival+.7),caution:clamp(h.tendencies.caution+.4)}}));
    return {text:"해독 약초 저장고: 독성 지대에서 약초와 보급품을 확보했다.",gold:90,materials:30,heroUpdates};
  }
  if(environment==="water" && curiosity>=58 && roll<.55){
    party.forEach(h=>touch(h.id,{tendencies:{curiosity:clamp(h.tendencies.curiosity+.8)}}));
    return {text:"수중 금고: 물속에 잠긴 보관함에서 희귀한 보급 자원을 발견했다.",gold:180,materials:34,heroUpdates};
  }
  if(environment==="unstable" && focus>=66 && roll<.5){
    const gain=45+Math.round(focus*.2);
    party.forEach(h=>touch(h.id,{hpDelta:-4,tendencies:{focus:clamp(h.tendencies.focus+1),bravery:clamp(h.tendencies.bravery+.4)}}));
    return {text:"공명 수정맥: 불안정한 결정을 제어해 많은 자원을 추출했다.",gold:130,materials:gain,heroUpdates};
  }


  if(curiosity>=70 && roll<.42){
    party.forEach(h=>touch(h.id,{tendencies:{curiosity:clamp(h.tendencies.curiosity+.5),greed:clamp(h.tendencies.greed+.2)}}));
    return {text:"봉인된 제단: 호기심이 봉인을 풀어 추가 자원을 발견했다.",gold:150,materials:24,heroUpdates};
  }

  if(greed>=70 && roll<.68){
    const reward=260+Math.round(greed*.9);
    const damage=Math.max(4,Math.round(12+(100-caution)*.12));
    party.forEach(h=>touch(h.id,{hpDelta:-damage,tendencies:{greed:clamp(h.tendencies.greed+.7),caution:clamp(h.tendencies.caution-.3)}}));
    return {text:"탐욕의 보관고: 보상은 컸지만 함정을 밟아 파티가 피해를 입었다.",gold:reward,materials:10,heroUpdates};
  }

  if(bravery>=68 && roll<.5){
    const gain=35+Math.round(bravery*.25);
    party.forEach(h=>touch(h.id,{hpDelta:gain,tendencies:{bravery:clamp(h.tendencies.bravery+.8),survival:clamp(h.tendencies.survival-.2)}}));
    return {text:"불안정한 지맥: 용감하게 통과해 경험과 자원을 챙겼다.",gold:100,materials:gain,heroUpdates};
  }

  if(survival>=65 || caution>=65){
    party.forEach(h=>touch(h.id,{hpDelta:18,tendencies:{caution:clamp(h.tendencies.caution+.5),survival:clamp(h.tendencies.survival+.5)}}));
    return {text:"안전한 우회로: 위험을 피하고 작은 보급품을 확보했다.",gold:90,materials:22,heroUpdates};
  }

  if(cooperation>=70){
    party.forEach(h=>touch(h.id,{hpDelta:12,tendencies:{cooperation:clamp(h.tendencies.cooperation+.7)}}));
    return {text:"무너진 통로: 함께 길을 정리해 자원을 추가로 확보했다.",gold:110,materials:30,heroUpdates};
  }

  party.forEach(h=>touch(h.id,{hpDelta:8,tendencies:{curiosity:clamp(h.tendencies.curiosity+.4)}}));
  return {text:"낡은 탐사 흔적: 큰 위험 없이 소량의 보급품을 찾았다.",gold:70,materials:14,heroUpdates};
}


export type DungeonChoice={
  id:string;
  label:string;
  detail:string;
  tendency:keyof Tendencies;
  risk:number;
  reward:number;
};

export type DungeonChoiceEvent={
  title:string;
  text:string;
  choices:DungeonChoice[];
};

export function dungeonChoiceEvent(floor:number,environment:EnvironmentKind):DungeonChoiceEvent{
  if(environment==="dark"){
    return {
      title:"어둠 속 기록실",
      text:"희미한 봉인문 너머에서 오래된 원정 기록과 보급 상자가 보인다. 무엇을 할까?",
      choices:[
        {id:"read",label:"기록을 해독한다",detail:"집중력을 요구하지만 숨겨진 정보를 얻을 가능성이 높다.",tendency:"focus",risk:6,reward:170+floor*8},
        {id:"loot",label:"보급 상자를 연다",detail:"탐욕스럽게 보상을 챙기지만 함정에 노출될 수 있다.",tendency:"greed",risk:14,reward:230+floor*10},
        {id:"leave",label:"안전하게 지나간다",detail:"보상은 작지만 불필요한 위험을 피한다.",tendency:"caution",risk:0,reward:70+floor*4}
      ]
    };
  }
  if(environment==="narrow"){
    return {
      title:"붕괴 직전의 갈림길",
      text:"천장이 흔들리고 세 갈래의 통로 중 하나에서 균열음이 들린다.",
      choices:[
        {id:"rush",label:"빠르게 돌파한다",detail:"용맹을 믿고 가장 짧은 길을 선택한다.",tendency:"bravery",risk:18,reward:190+floor*8},
        {id:"secure",label:"안전한 길을 찾는다",detail:"신중하게 지형을 살펴 시간을 들인다.",tendency:"caution",risk:4,reward:130+floor*6},
        {id:"cooperate",label:"파티가 함께 통로를 보강한다",detail:"협동으로 붕괴 위험을 낮추지만 시간이 걸린다.",tendency:"cooperation",risk:2,reward:155+floor*7}
      ]
    };
  }
  if(environment==="toxic"){
    return {
      title:"독성 저장고",
      text:"독성 안개 속에 약초와 봉인된 약품 상자가 있다.",
      choices:[
        {id:"herbs",label:"약초를 채집한다",detail:"생존본능을 살려 필요한 것만 안전하게 챙긴다.",tendency:"survival",risk:7,reward:145+floor*7},
        {id:"rare",label:"희귀 약품을 꺼낸다",detail:"더 큰 보상을 노리지만 독성에 노출될 수 있다.",tendency:"greed",risk:15,reward:250+floor*10},
        {id:"careful",label:"장비 없이 지나간다",detail:"보상을 포기하고 안전을 우선한다.",tendency:"caution",risk:0,reward:55+floor*3}
      ]
    };
  }
  if(environment==="water"){
    return {
      title:"수중 봉인고",
      text:"물이 차오른 방 아래에 반짝이는 보관함이 잠겨 있다.",
      choices:[
        {id:"dive",label:"직접 잠수한다",detail:"호기심을 따라 위험을 감수하고 깊은 곳으로 내려간다.",tendency:"curiosity",risk:16,reward:270+floor*11},
        {id:"team",label:"함께 끌어올린다",detail:"협동으로 보관함을 들어 올린다.",tendency:"cooperation",risk:5,reward:180+floor*8},
        {id:"skip",label:"보관함을 포기한다",detail:"안전을 우선하고 통로를 통과한다.",tendency:"caution",risk:0,reward:80+floor*4}
      ]
    };
  }
  if(environment==="unstable"){
    return {
      title:"공명 수정맥",
      text:"균열 사이에서 귀중한 수정이 맥동한다. 잘못 건드리면 지형이 무너질 수 있다.",
      choices:[
        {id:"focus",label:"진동 패턴을 읽는다",detail:"집중력을 사용해 안정 구간을 찾는다.",tendency:"focus",risk:8,reward:210+floor*9},
        {id:"break",label:"강제로 채굴한다",detail:"용맹하게 수정을 부수어 많은 자원을 노린다.",tendency:"bravery",risk:20,reward:320+floor*12},
        {id:"mark",label:"위치를 기록하고 철수한다",detail:"다음 원정을 위해 정보를 남긴다.",tendency:"caution",risk:0,reward:95+floor*4}
      ]
    };
  }
  return {
    title:"봉인된 제단",
    text:"오래된 제단 위에 손대지 않은 보급품과 이상한 문양이 남아 있다.",
    choices:[
      {id:"study",label:"문양을 조사한다",detail:"호기심으로 숨겨진 의미를 찾는다.",tendency:"curiosity",risk:8,reward:190+floor*8},
      {id:"take",label:"보급품을 챙긴다",detail:"탐욕을 따라 즉시 보상을 가져간다.",tendency:"greed",risk:12,reward:240+floor*10},
      {id:"observe",label:"주변을 살핀다",detail:"신중하게 함정 여부를 확인한다.",tendency:"caution",risk:2,reward:110+floor*5}
    ]
  };
}

export function resolveDungeonChoice(heroes:Hero[],partyIds:string[],floor:number,environment:EnvironmentKind,choice:DungeonChoice):DungeonEventOutcome{
  const party=heroes.filter(h=>partyIds.includes(h.id));
  const heroUpdates:Record<string,EventUpdate>={};
  const bonusByTendency:Partial<Tendencies>={curiosity:.6,focus:.5,greed:.8,caution:.7,bravery:.8,cooperation:.8,survival:.7};
  const baseDamage=Math.max(0,Math.round(choice.risk-(party.reduce((n,h)=>n+h.tendencies[choice.tendency],0)/(party.length||1))*0.05));
  const hpDelta=-baseDamage;
  party.forEach(h=>{
    heroUpdates[h.id]={
      hpDelta,
      tendencies:{
        [choice.tendency]:clamp(h.tendencies[choice.tendency]+(bonusByTendency[choice.tendency]||.5))
      }
    };
  });
  const threshold=party.length?party.reduce((n,h)=>n+h.tendencies[choice.tendency],0)/party.length:0;
  const reward=Math.max(20,choice.reward+Math.round((threshold-50)*1.2));
  const materials=Math.max(4,Math.round(reward*.05));
  const text=baseDamage>0
    ? `${choice.label} · ${choice.detail} · 피해 ${baseDamage}`
    : `${choice.label} · ${choice.detail} · 안전하게 성공`;
  return {text,gold:reward,materials,heroUpdates};
}
