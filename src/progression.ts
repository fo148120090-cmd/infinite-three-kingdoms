import type { Hero, Tendencies } from "./dungeonData";
import { remember } from "./relationships";

const clamp=(n:number)=>Math.max(0,Math.min(100,n));

const behaviorDelta:Record<string,Partial<Tendencies>>={
  "일반 공격":{aggression:.12,focus:.05},
  "추격":{aggression:.16,pursuit:.18,bravery:.08},
  "광폭 돌격":{aggression:.28,bravery:.2,survival:-.08},
  "결투 집중":{focus:.2,bravery:.08,pursuit:.1},
  "정밀 사격":{focus:.22,caution:.08,pursuit:.1},
  "사냥 본능":{pursuit:.2,focus:.08},
  "수호 맹세":{protect:.24,cooperation:.16,bravery:.06},
  "철벽 진형":{protect:.2,survival:.18,caution:.1},
  "아군 보호":{protect:.18,cooperation:.14,survival:.05},
  "회복":{protect:.16,cooperation:.2,caution:.04},
  "대회복":{protect:.24,cooperation:.22,focus:.08},
  "원소 폭발":{aggression:.12,focus:.2,curiosity:.06},
  "저주 확산":{focus:.18,curiosity:.12,caution:.08},
  "비전 해방":{focus:.24,curiosity:.12},
  "심판":{focus:.18,bravery:.12,caution:.06},
  "후퇴":{survival:.2,caution:.16,bravery:-.1},
  "기습 후퇴":{survival:.18,caution:.12,greed:.04},
  "대기":{caution:.03,focus:.02}
};

export function applyBehaviorHistory(hero:Hero,battleCounts:Record<string,number>):Hero{
  const counts={...(hero.behaviorCounts||{})};
  const tendencies={...hero.tendencies};
  for(const [action,count] of Object.entries(battleCounts)){
    counts[action]=(counts[action]||0)+count;
    const delta=behaviorDelta[action]||{};
    const total=counts[action]||0;
    const recentWeight=Math.min(1,Math.sqrt(count)/3);
    for(const [k,v] of Object.entries(delta)){
      tendencies[k as keyof Tendencies]=clamp(tendencies[k as keyof Tendencies]+(v||0)*recentWeight);
    }
    if(total>=8 && total%8<count) hero=remember(hero,"반복된 행동 · "+action+" "+total+"회",1.4);
    if(total>=20 && total%20<count) hero=remember(hero,"강하게 굳어진 전투 습관 · "+action,2.1);
  }
  return {...hero,behaviorCounts:counts,tendencies,memories:(hero.memories||[]).slice(0,12)};
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
