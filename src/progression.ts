import type { Hero, Tendencies } from "./dungeonData";
import { remember } from "./relationships";

const clamp=(n:number)=>Math.max(0,Math.min(100,n));

const behaviorDelta:Record<string,Partial<Tendencies>>={
  "일반 공격":{aggression:.12,focus:.05},"추격":{aggression:.16,pursuit:.18,bravery:.08},"광폭 돌격":{aggression:.28,bravery:.2,survival:-.08},
  "결투 집중":{focus:.2,bravery:.08,pursuit:.1},"정밀 사격":{focus:.22,caution:.08,pursuit:.1},"사냥 본능":{pursuit:.2,focus:.08},
  "수호 맹세":{protect:.24,cooperation:.16,bravery:.06},"철벽 진형":{protect:.2,survival:.18,caution:.1},"아군 보호":{protect:.18,cooperation:.14,survival:.05},
  "회복":{protect:.16,cooperation:.2,caution:.04},"대회복":{protect:.24,cooperation:.22,focus:.08},"원소 폭발":{aggression:.12,focus:.2,curiosity:.06},
  "저주 확산":{focus:.18,curiosity:.12,caution:.08},"비전 해방":{focus:.24,curiosity:.12},"심판":{focus:.18,bravery:.12,caution:.06},
  "후퇴":{survival:.2,caution:.16,bravery:-.1},"기습 후퇴":{survival:.18,caution:.12,greed:.04},"대기":{caution:.03,focus:.02}
};

export function applyBehaviorHistory(hero:Hero,battleCounts:Record<string,number>):Hero{
  const counts={...(hero.behaviorCounts||{})};
  const tendencies={...hero.tendencies};
  let next=hero;
  for(const [action,count] of Object.entries(battleCounts)){
    counts[action]=(counts[action]||0)+count;
    const delta=behaviorDelta[action]||{};
    const recentWeight=Math.min(1,Math.sqrt(count)/3);
    for(const [k,v] of Object.entries(delta)) tendencies[k as keyof Tendencies]=clamp(tendencies[k as keyof Tendencies]+(v||0)*recentWeight);
    const total=counts[action]||0;
    if(total>=8 && total%8<count) next=remember(next,"반복된 행동 · "+action+" "+total+"회",1.4);
    if(total>=20 && total%20<count) next=remember(next,"강하게 굳어진 전투 습관 · "+action,2.1);
  }
  return {...next,behaviorCounts:counts,tendencies,memories:(next.memories||[]).slice(0,12)};
}

export function behaviorSummary(hero:Hero):string{
  const entries=Object.entries(hero.behaviorCounts||{}).sort((a,b)=>b[1]-a[1]);
  if(!entries.length)return "아직 누적된 전투 습관 없음";
  const [action,count]=entries[0];
  return "가장 자주 한 행동 · "+action+" "+count+"회";
}

export function tendencyProfile(hero:Hero):string[]{
  const entries=(Object.keys(hero.tendencies) as (keyof Tendencies)[]).sort((a,b)=>hero.tendencies[b]-hero.tendencies[a]).slice(0,3);
  return entries.map(k=>k+":"+Math.round(hero.tendencies[k]));
}

export function buildProfile(hero:Hero):{name:string;detail:string;keys:(keyof Tendencies)[]}{
  const t=hero.tendencies;
  if(t.protect+t.cooperation>=150)return {name:"수호형",detail:"동료를 지키고 회복하는 행동이 굳어지고 있다.",keys:["protect","cooperation","survival"]};
  if(t.aggression+t.bravery>=150)return {name:"돌격형",detail:"위험을 감수하고 정면에서 압박하는 경향이 강하다.",keys:["aggression","bravery","pursuit"]};
  if(t.focus+t.pursuit>=150)return {name:"정밀형",detail:"약점과 마무리 기회를 오래 관찰한다.",keys:["focus","pursuit","caution"]};
  if(t.focus+t.curiosity>=150)return {name:"비전형",detail:"전장을 분석하고 새로운 전투 수단을 탐색한다.",keys:["focus","curiosity","caution"]};
  if(t.survival+t.caution>=150)return {name:"생존형",detail:"위험을 줄이고 살아남는 선택을 반복한다.",keys:["survival","caution","focus"]};
  if(t.greed+t.curiosity>=135)return {name:"탐색형",detail:"보상과 비밀을 찾는 행동을 자주 선택한다.",keys:["greed","curiosity","caution"]};
  return {name:"균형형",detail:"뚜렷한 한 방향보다 상황에 따라 행동을 조절한다.",keys:["focus","cooperation","caution"]};
}

export function partyPreference(heroes:Hero[]):Partial<Tendencies>{
  const out:Partial<Tendencies>={};
  if(!heroes.length)return out;
  (Object.keys(heroes[0].tendencies) as (keyof Tendencies)[]).forEach(k=>out[k]=heroes.reduce((n,h)=>n+h.tendencies[k],0)/heroes.length);
  return out;
}

export function habitBias(hero:{behaviorCounts?:Record<string,number>},action:string):number{
  const count=hero.behaviorCounts?.[action]||0;
  if(count<=0)return 0;
  return Math.min(12,Math.sqrt(count)*1.8);
}

export function profileInsight(hero:Hero):string{
  const entries=Object.entries(hero.behaviorCounts||{}).sort((a,b)=>b[1]-a[1]).slice(0,3);
  if(!entries.length)return "아직 뚜렷한 전투 습관이 없습니다.";
  return entries.map(([action,count])=>action+" "+count+"회").join(" · ");
}
