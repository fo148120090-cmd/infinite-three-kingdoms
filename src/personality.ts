import type { Hero, Job } from "./dungeonData";

export type CharacterPersonality = {
  archetype:string;
  temperament:string;
  quirk:string;
  favoriteAction:string;
  bondStyle:string;
  quote:string;
};

const seedPersonalities:Record<string,CharacterPersonality>={
  kael:{archetype:"돌격대장",temperament:"직선적",quirk:"강한 상대를 보면 추격보다 먼저 정면 승부를 택한다.",favoriteAction:"추격",bondStyle:"먼저 길을 열어 동료가 따라오게 만드는 타입",quote:"길이 없으면 내가 먼저 만든다."},
  seren:{archetype:"철벽 수호자",temperament:"침착함",quirk:"아군이 위험해지면 자신의 공격 기회를 포기하고 보호를 우선한다.",favoriteAction:"아군 보호",bondStyle:"신뢰가 쌓일수록 더 단단하게 지키는 타입",quote:"뒤는 내가 맡는다."},
  lyra:{archetype:"냉정한 사냥꾼",temperament:"관찰적",quirk:"쓰러뜨릴 수 있는 적을 발견하면 주변보다 그 한 발의 가치를 먼저 계산한다.",favoriteAction:"정밀 사격",bondStyle:"거리를 유지하면서 필요한 순간만 확실하게 돕는 타입",quote:"한 발이면 충분해."},
  orion:{archetype:"전장 연구가",temperament:"호기심 많음",quirk:"적이 많아질수록 새로운 마법 조합을 시험하려는 경향이 강해진다.",favoriteAction:"광역 마법",bondStyle:"전투 중 동료의 움직임을 관찰하고 연계를 만든다.",quote:"전장은 가장 좋은 실험실이지."},
  mira:{archetype:"따뜻한 보호자",temperament:"온화함",quirk:"부상당한 동료의 이름을 가장 먼저 부르며 회복을 시작한다.",favoriteAction:"회복",bondStyle:"함께 오래 싸운 동료일수록 우선적으로 돌보는 타입",quote:"살아 있다면, 아직 끝나지 않았어."}
};

const jobDefaults:Record<Job,{archetype:string;favoriteAction:string;temperament:string;bondStyle:string}>={
  Warrior:{archetype:"돌격형",favoriteAction:"일반 공격",temperament:"대담함",bondStyle:"나란히 싸우며 신뢰를 쌓는다."},
  Guardian:{archetype:"수호형",favoriteAction:"아군 보호",temperament:"침착함",bondStyle:"위험을 대신 떠안으며 관계가 깊어진다."},
  Archer:{archetype:"사냥형",favoriteAction:"정밀 사격",temperament:"관찰적",bondStyle:"거리를 두고 필요한 순간에 정확히 돕는다."},
  Mage:{archetype:"탐구형",favoriteAction:"광역 마법",temperament:"호기심 많음",bondStyle:"전투 정보를 공유하며 동료를 이해한다."},
  Cleric:{archetype:"보호형",favoriteAction:"회복",temperament:"온화함",bondStyle:"함께 버틴 동료를 오래 기억한다."}
};

function hash(text:string){
  let h=0;
  for(let i=0;i<text.length;i++)h=(h*31+text.charCodeAt(i))>>>0;
  return h;
}

export function buildPersonality(hero:Pick<Hero,"id"|"job"|"name"|"tendencies">):CharacterPersonality{
  if(seedPersonalities[hero.id])return seedPersonalities[hero.id];
  const t=hero.tendencies;
  const axes=[
    ["돌격형",t.aggression+t.bravery+t.pursuit],
    ["수호형",t.protect+t.cooperation+t.survival],
    ["탐구형",t.curiosity+t.focus],
    ["사냥형",t.focus+t.pursuit+t.aggression],
    ["생존형",t.caution+t.survival]
  ].sort((a,b)=>b[1]-a[1]);
  const archetype=axes[0]?.[0]||jobDefaults[hero.job].archetype;
  let favoriteAction=jobDefaults[hero.job].favoriteAction;
  if(archetype==="돌격형")favoriteAction=t.pursuit>=t.aggression?"추격":"일반 공격";
  if(archetype==="수호형"||archetype==="생존형")favoriteAction=t.protect>=t.cooperation?"아군 보호":"방어 태세";
  if(archetype==="탐구형")favoriteAction=t.curiosity>=t.focus?"저주 확산":"광역 마법";
  if(archetype==="사냥형")favoriteAction=t.focus>=t.pursuit?"정밀 사격":"추격";
  const temperaments=["직선적","침착함","관찰적","호기심 많음","온화함","무심한 자신감"];
  const temperament=temperaments[hash(hero.id)%temperaments.length];
  const quirks=[
    "전투 시작 전에 가장 위협적인 상대를 먼저 살핀다.",
    "위험한 순간에도 자신만의 루틴을 지키려 한다.",
    "같은 행동을 반복하기보다 상황이 달라지는 순간에 반응한다.",
    "동료의 행동을 보고 자신의 다음 판단을 바꾸는 편이다.",
    "보상보다 전투에서 의미 있는 순간을 오래 기억한다."
  ];
  const quoteByArchetype:Record<string,string>={
    "돌격형":"먼저 움직이고, 나중에 설명하지.",
    "수호형":"내가 버티면 모두가 다시 움직일 수 있어.",
    "탐구형":"한 번 본 패턴은 다음에는 다르게 풀어낸다.",
    "사냥형":"흔들리는 순간이 가장 좋은 기회야.",
    "생존형":"살아남는 것도 하나의 전술이다."
  };
  return {
    archetype,
    temperament,
    quirk:quirks[hash(hero.name+hero.id)%quirks.length],
    favoriteAction,
    bondStyle:jobDefaults[hero.job].bondStyle,
    quote:quoteByArchetype[archetype]||"내 방식대로 답을 찾는다."
  };
}

export function personalityActionBonus(hero:Pick<Hero,"id"|"job"|"name"|"tendencies"|"personality">,action:string){
  const p=hero.personality||buildPersonality(hero);
  let score=0;
  if(action===p.favoriteAction)score+=14;
  if(p.archetype==="돌격형"&&["일반 공격","추격","광폭 돌격"].includes(action))score+=7;
  if(p.archetype==="수호형"&&["아군 보호","수호 맹세","철벽 진형"].includes(action))score+=8;
  if(p.archetype==="탐구형"&&["광역 마법","원소 폭발","저주 확산","비전 해방"].includes(action))score+=8;
  if(p.archetype==="사냥형"&&["정밀 사격","사냥 본능","추격","심판"].includes(action))score+=8;
  if(p.archetype==="생존형"&&["방어 태세","후퇴","회복"].includes(action))score+=8;
  if(p.temperament==="직선적"&&action==="후퇴")score-=5;
  if(p.temperament==="관찰적"&&action==="대기")score+=3;
  return score;
}
