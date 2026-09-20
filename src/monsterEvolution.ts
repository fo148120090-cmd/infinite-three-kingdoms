import type { Monster, MonsterLineage, Grade, Tendencies } from "./dungeonData";

type Branch={focus:string;forms:string[]};
export const monsterEvolutionTrees:Record<string,Branch[]>={
  Slime:[{focus:"absorb",forms:["메가 슬라임","킹 슬라임"]},{focus:"split",forms:["멀티 슬라임","슬라임 콜로니"]},{focus:"poison",forms:["독성 슬라임","데스 슬라임"]},{focus:"mana",forms:["마나 슬라임","아케인 슬라임"]}],
  Goblin:[{focus:"combat",forms:["홉고블린","고블린 전사왕"]},{focus:"command",forms:["고블린 대장","고블린 족장"]},{focus:"greed",forms:["고블린 도적","고블린 암살자"]},{focus:"magic",forms:["고블린 주술사","대주술사"]}],
  Kobold:[{focus:"trap",forms:["공병 코볼트","함정 장인"]},{focus:"combat",forms:["코볼트 전사","코볼트 경비대장"]},{focus:"scout",forms:["코볼트 정찰병","코볼트 사냥꾼"]},{focus:"command",forms:["코볼트 족장","대족장"]}],
  Gnoll:[{focus:"hunt",forms:["사냥 놀","늑대 놀"]},{focus:"combat",forms:["전투 놀","놀 전쟁군주"]},{focus:"command",forms:["놀 주술사","놀 족장"]}],
  Orc:[{focus:"combat",forms:["오크 전사","오크 챔피언"]},{focus:"defense",forms:["오크 수호자","철벽 오크"]},{focus:"command",forms:["오크 족장","대족장"]},{focus:"berserk",forms:["오크 광전사","학살자"]}],
  Lizardman:[{focus:"hunt",forms:["리자드맨 사냥꾼","리자드맨 전사"]},{focus:"poison",forms:["독 리자드","맹독 리자드"]},{focus:"aquatic",forms:["수중 리자드","심해 리자드"]},{focus:"command",forms:["리자드 장로","리자드 왕"]}],
  Naga:[{focus:"combat",forms:["나가 전사","나가 장군"]},{focus:"poison",forms:["독술사 나가","맹독의 주인"]},{focus:"magic",forms:["나가 마도사","나가 대마도사"]},{focus:"command",forms:["여왕의 호위","나가 여왕"]}],
  Harpy:[{focus:"speed",forms:["바람 하피","폭풍 하피"]},{focus:"combat",forms:["전투 하피","하피 전사장"]},{focus:"mental",forms:["사이렌 하피","매혹의 하피"]},{focus:"command",forms:["하피 여왕"] .slice(0,2)}],
  Uruk:[{focus:"soldier",forms:["우르크 베테랑","우르크 챔피언"]},{focus:"officer",forms:["우르크 지휘관","우르크 장군"]},{focus:"armor",forms:["중장 우르크","철갑군"]},{focus:"command",forms:["우르크 전쟁대장","우르크 전쟁군주"]}],
  Ogre:[{focus:"strength",forms:["거대 오거","오거 왕"]},{focus:"defense",forms:["장갑 오거","오거 요새"]},{focus:"berserk",forms:["광폭 오거","오거 파괴자"]}],
  Arachne:[{focus:"hunt",forms:["사냥 거미","살인 거미"]},{focus:"poison",forms:["독거미","맹독 아라크네"]},{focus:"web",forms:["거미줄 장인","둥지 여왕"]},{focus:"command",forms:["아라크네 여왕","고대 여왕"]}],
  Siren:[{focus:"charm",forms:["유혹의 사이렌","매혹의 여왕"]},{focus:"illusion",forms:["환영 사이렌","악몽 사이렌"]},{focus:"control",forms:["정신의 사이렌","정신 지배자"]},{focus:"song",forms:["고대 사이렌","심해의 여왕"]}],
  Darkworm:[{focus:"ambush",forms:["암흑벌레","밤의 벌레"]},{focus:"size",forms:["대형 다크웜","고대 웜"]},{focus:"mana",forms:["마나 웜","공허 웜"]},{focus:"territory",forms:["던전 웜","심연의 웜"]}],
  Demon:[{focus:"war",forms:["중급 악마","고급 악마"]},{focus:"flame",forms:["화염 악마","화염 군주"]},{focus:"domination",forms:["지배 악마","악마 군주"]},{focus:"illusion",forms:["환영 악마","공포의 악마"]},{focus:"death",forms:["사령 악마","죽음의 대공"]}]
};

const focusForAction=(action:string,species?:string):string=>{
  if(action.includes("분열"))return "split";
  if(action.includes("흡수"))return "absorb";
  if(action.includes("함정"))return species==="Kobold"?"trap":"greed";
  if(action.includes("거미줄"))return "web";
  if(action.includes("무리 사냥"))return "hunt";
  if(action.includes("공격")||action.includes("추격")){
    if(species==="Uruk")return "soldier";
    if(species==="Ogre")return "strength";
    return "combat";
  }
  if(action.includes("전투 함성"))return "command";
  if(action.includes("측면 습격"))return "hunt";
  if(action.includes("급강하"))return "speed";
  if(action.includes("독성 압박"))return "poison";
  if(action.includes("매혹"))return "charm";
  if(action.includes("대지 강타"))return "strength";
  if(action.includes("회피 기동")||action.includes("후퇴"))return "survival";
  if(action.includes("역할 분석"))return species==="Demon"?"domination":"officer";
  if(action.includes("지휘")||action.includes("보스 패턴")||action.includes("영역 지배"))return "command";
  if(action.includes("광역"))return "magic";
  if(action.includes("광폭화"))return "berserk";
  if(action.includes("대기"))return "defense";
  if(action.includes("사격"))return "combat";
  return "combat";
};

export function emptyLineage(id:string,species:string):MonsterLineage{
  return {id,species,level:1,experience:0,focus:{},evolutionStage:0,evolutionPath:[]};
}

export function evolveLineage(lineage:MonsterLineage):MonsterLineage{
  const branches=monsterEvolutionTrees[lineage.species]||[];
  const current=Math.floor(lineage.evolutionStage/1);
  const eligible=branches
    .map(b=>({...b,score:(lineage.focus[b.focus]||0)}))
    .sort((a,b)=>b.score-a.score);
  const best=eligible[0];
  if(!best||best.score<4)return lineage;
  const desiredStage=Math.min(2,lineage.evolutionStage+1);
  const form=best.forms[desiredStage-1];
  if(!form||lineage.evolutionStage>=2)return lineage;
  return {...lineage,evolutionStage:desiredStage,evolutionPath:[...lineage.evolutionPath,form],lastMemory:"행동 경향 "+best.focus+" 누적"};
}

export function recordLineage(lineage:MonsterLineage,action:string,won:boolean):MonsterLineage{
  const focus=focusForAction(action,lineage.species);
  const next={...lineage,focus:{...lineage.focus},experience:lineage.experience+(won?2:1)};
  next.focus[focus]=(next.focus[focus]||0)+(won?1.4:.6);
  next.level=Math.max(1,1+Math.floor(next.experience/10));
  return evolveLineage(next);
}

export function applyLineage(monster:Monster,lineage?:MonsterLineage):Monster{
  if(!lineage||lineage.evolutionStage===0)return monster;
  const form=lineage.evolutionPath[lineage.evolutionPath.length-1];
  const stat=1+(lineage.evolutionStage*.08);
  const tendencies:Tendencies={...monster.tendencies};
  Object.entries(lineage.focus).forEach(([k,v])=>{
    const map:Record<string,keyof Tendencies>={combat:"aggression",soldier:"aggression",officer:"focus",armor:"caution",command:"cooperation",survival:"survival",magic:"focus",ambush:"pursuit",defense:"caution",strength:"aggression",split:"cooperation",absorb:"aggression",poison:"focus",mana:"focus",greed:"greed",trap:"caution",scout:"pursuit",hunt:"pursuit",berserk:"aggression",aquatic:"survival",speed:"bravery",mental:"focus",charm:"focus",illusion:"caution",control:"cooperation",song:"focus",web:"caution",war:"aggression",flame:"aggression",domination:"cooperation",size:"aggression",territory:"caution",death:"survival"};
    const key=map[k];
    if(key)tendencies[key]=Math.min(100,tendencies[key]+Math.min(12,v));
  });
  const evolutionFocus=Object.entries(lineage.focus).sort((a,b)=>b[1]-a[1])[0]?.[0];
  return {...monster,name:form?monster.name+" · "+form:monster.name,level:Math.max(monster.level,lineage.level),evolutionFocus,
    hp:Math.round(monster.hp*stat),maxHp:Math.round(monster.maxHp*stat),attack:Math.round(monster.attack*stat),
    defense:Math.round(monster.defense*stat),tendencies};
}

export function evolutionActionBonus(lineage:MonsterLineage|undefined,action:string):number{
  if(!lineage||lineage.evolutionStage===0)return 0;
  const focus=Object.entries(lineage.focus).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const stage=lineage.evolutionStage;
  const match:Record<string,string[]>={
    split:["분열"],absorb:["일반 공격"],poison:["독성 압박"],mana:["광역 마법"],
    combat:["일반 공격","추격"],command:["전투 함성","지휘 명령","보스 패턴"],greed:["함정 투척","일반 공격"],
    trap:["매복 함정"],scout:["추격"],hunt:["무리 사냥","측면 습격","굴 파기 기습"],defense:["후퇴","회피 기동"],
    berserk:["광폭화"],aquatic:["측면 습격"],magic:["역할 분석","광역 마법"],speed:["급강하"],
    mental:["매혹"],charm:["매혹"],illusion:["매혹"],control:["매혹"],song:["매혹"],
    soldier:["일반 공격","연계 공격"],officer:["지휘 명령"],armor:["전투 함성"],
    strength:["대지 강타","일반 공격"],web:["거미줄"],war:["일반 공격","광폭화"],
    flame:["독성 압박"],domination:["역할 분석"],ambush:["굴 파기 기습"],size:["대지 강타"],
    territory:["영역 지배"],death:["역할 분석"]
  };
  return (focus&&match[focus]?.some(x=>action===x))?stage*10:0;
}

type MonsterPromotionChoice={name:string;focus:string};

export const monsterPromotionPools:Record<string,MonsterPromotionChoice[]>={
  Slime:[{name:"흡수체",focus:"absorb"},{name:"군체체",focus:"split"},{name:"독성체",focus:"poison"}],
  Goblin:[{name:"전투형",focus:"combat"},{name:"지휘형",focus:"command"},{name:"암습형",focus:"greed"}],
  Kobold:[{name:"공병형",focus:"trap"},{name:"전사형",focus:"combat"},{name:"정찰형",focus:"scout"}],
  Gnoll:[{name:"사냥형",focus:"hunt"},{name:"전쟁형",focus:"combat"},{name:"주술형",focus:"command"}],
  Orc:[{name:"전사형",focus:"combat"},{name:"수호형",focus:"defense"},{name:"광전형",focus:"berserk"}],
  Lizardman:[{name:"사냥형",focus:"hunt"},{name:"독술형",focus:"poison"},{name:"심해형",focus:"aquatic"}],
  Naga:[{name:"전사형",focus:"combat"},{name:"독술형",focus:"poison"},{name:"마도형",focus:"magic"}],
  Harpy:[{name:"폭풍형",focus:"speed"},{name:"전투형",focus:"combat"},{name:"정신형",focus:"mental"}],
  Uruk:[{name:"군사형",focus:"soldier"},{name:"장교형",focus:"officer"},{name:"중장형",focus:"armor"}],
  Ogre:[{name:"거구형",focus:"strength"},{name:"장갑형",focus:"defense"},{name:"광폭형",focus:"berserk"}],
  Arachne:[{name:"사냥형",focus:"hunt"},{name:"독거미형",focus:"poison"},{name:"둥지형",focus:"web"}],
  Siren:[{name:"매혹형",focus:"charm"},{name:"환영형",focus:"illusion"},{name:"지배형",focus:"control"}],
  Darkworm:[{name:"잠복형",focus:"ambush"},{name:"거대형",focus:"size"},{name:"공허형",focus:"mana"}],
  Demon:[{name:"전쟁형",focus:"war"},{name:"화염형",focus:"flame"},{name:"지배형",focus:"domination"}]
};

const promotionStages=[
  {label:"상급",hp:1.12,attack:1.08,defense:1.08},
  {label:"정예",hp:1.28,attack:1.17,defense:1.17},
  {label:"왕",hp:1.48,attack:1.30,defense:1.30},
  {label:"군단장",hp:1.72,attack:1.48,defense:1.45},
  {label:"군주",hp:2.00,attack:1.70,defense:1.65},
  {label:"초월",hp:2.35,attack:1.98,defense:1.90}
] as const;
const promotionLevels=[10,20,30,50,70,100];

const promotionRoot=(species:string,choice:string)=>{
  const roots:Record<string,Record<string,string>>={
    Slime:{"흡수체":"메가 슬라임","군체체":"슬라임 콜로니","독성체":"데스 슬라임"},
    Goblin:{"전투형":"고블린 전사","지휘형":"고블린 족장","암습형":"고블린 암살자"},
    Kobold:{"공병형":"함정 장인 코볼트","전사형":"코볼트 경비대장","정찰형":"코볼트 사냥꾼"},
    Gnoll:{"사냥형":"늑대 놀","전쟁형":"놀 전쟁군주","주술형":"놀 주술사"},
    Orc:{"전사형":"오크 챔피언","수호형":"철벽 오크","광전형":"오크 광전사"},
    Lizardman:{"사냥형":"리자드맨 전사","독술형":"맹독 리자드","심해형":"심해 리자드"},
    Naga:{"전사형":"나가 장군","독술형":"맹독의 주인","마도형":"나가 대마도사"},
    Harpy:{"폭풍형":"폭풍 하피","전투형":"하피 전사장","정신형":"매혹의 하피"},
    Uruk:{"군사형":"우르크 챔피언","장교형":"우르크 장군","중장형":"철갑군"},
    Ogre:{"거구형":"오거 왕","장갑형":"오거 요새","광폭형":"오거 파괴자"},
    Arachne:{"사냥형":"살인 거미","독거미형":"맹독 아라크네","둥지형":"둥지 여왕"},
    Siren:{"매혹형":"매혹의 여왕","환영형":"악몽 사이렌","지배형":"정신 지배자"},
    Darkworm:{"잠복형":"밤의 벌레","거대형":"고대 웜","공허형":"공허 웜"},
    Demon:{"전쟁형":"고급 악마","화염형":"화염 군주","지배형":"악마 군주"}
  };
  return roots[species]?.[choice]||species+" "+choice;
};

export function monsterPromotionInfo(monster:Monster,lineage?:MonsterLineage){
  const choices=monsterPromotionPools[monster.species]||[];
  const tier=promotionLevels.filter(level=>monster.level>=level).length;
  if(tier===0||choices.length===0)return {tier:0,name:monster.name,hp:monster.hp,maxHp:monster.maxHp,attack:monster.attack,defense:monster.defense,focus:undefined as string|undefined};
  const best=choices.slice().sort((a,b)=>(lineage?.focus[b.focus]||0)-(lineage?.focus[a.focus]||0))[0];
  const stage=promotionStages[tier-1];
  const root=promotionRoot(monster.species,best.name);
  return {tier,name:stage.label+" "+root,hp:Math.round(monster.hp*stage.hp),maxHp:Math.round(monster.maxHp*stage.hp),attack:Math.round(monster.attack*stage.attack),defense:Math.round(monster.defense*stage.defense),focus:best.focus};
}

export function applyMonsterPromotion(monster:Monster,lineage?:MonsterLineage):Monster{
  const info=monsterPromotionInfo(monster,lineage);
  if(info.tier===0)return {...monster,promotionTier:0};
  const tendencies={...monster.tendencies};
  const focusMap:Record<string,keyof Tendencies>={combat:"aggression",command:"cooperation",greed:"greed",trap:"caution",scout:"pursuit",hunt:"pursuit",berserk:"aggression",defense:"caution",poison:"focus",aquatic:"survival",magic:"focus",speed:"bravery",mental:"focus",soldier:"aggression",officer:"focus",armor:"caution",strength:"aggression",web:"caution",charm:"focus",illusion:"caution",control:"cooperation",ambush:"pursuit",size:"aggression",mana:"focus",war:"aggression",flame:"aggression",domination:"cooperation",absorb:"aggression",split:"cooperation"};
  const key=info.focus?focusMap[info.focus]:undefined;
  if(key)tendencies[key]=Math.min(100,tendencies[key]+info.tier*3);
  return {...monster,name:info.name,promotionTier:info.tier,promotionPath:[...(monster.promotionPath||[]),info.name].slice(-6),hp:info.hp,maxHp:info.maxHp,attack:info.attack,defense:info.defense,tendencies};
}

export function evolutionHint(lineage:MonsterLineage):string{
  const branches=monsterEvolutionTrees[lineage.species]||[];
  const best=branches.slice().sort((a,b)=>(lineage.focus[b.focus]||0)-(lineage.focus[a.focus]||0))[0];
  return best?`${best.focus} 계열 · 다음 진화까지 ${Math.max(0,4-(lineage.focus[best.focus]||0)).toFixed(1)}`:"아직 뚜렷한 진화 방향 없음";
}
