import type { Hero, Job, Tendencies } from "./dungeonData";

export type PassiveSkill = {
  id: string;
  name: string;
  detail: string;
  maxLevel: 30;
  aiMods: Partial<Tendencies>;
  combatPerLevel: { attack?: number; defense?: number; hpPct?: number; speedPct?: number; range?: number; healPct?: number };
};

type SkillSet = { characterId: string; title: string; skills: PassiveSkill[] };

const make = (id:string,name:string,detail:string,aiMods:Partial<Tendencies>,combatPerLevel:PassiveSkill["combatPerLevel"]):PassiveSkill =>
  ({id,name,detail,aiMods,combatPerLevel,maxLevel:30});

const named:Record<string,SkillSet> = {
  kael:{characterId:"kael",title:"카엘 · 전장의 패시브",skills:[
    make("kael-war","전쟁의 본능","공격을 거듭할수록 공격 성향과 전투력이 강화됩니다.",{aggression:.7,bravery:.35},{attack:.8}),
    make("kael-iron","불굴의 전장","위기에서도 버티는 힘을 높여 생존과 HP를 강화합니다.",{survival:.6,caution:.25},{hpPct:1.0,defense:.25}),
    make("kael-hunt","끝없는 추격","약해진 적을 놓치지 않는 추격 능력을 높입니다.",{pursuit:.75,focus:.3},{speedPct:.35,attack:.2})
  ]},
  seren:{characterId:"seren",title:"세린 · 수호의 패시브",skills:[
    make("seren-wall","철벽의 맹세","전열을 지키는 힘과 보호 행동을 강화합니다.",{protect:.8,cooperation:.4},{defense:.8}),
    make("seren-heart","불굴의 방패","피해를 받아도 전선을 유지할 수 있도록 생존력을 높입니다.",{survival:.7,bravery:.25},{hpPct:1.2}),
    make("seren-link","수호 연계","동료와의 협동을 통해 방어 행동의 효율을 높입니다.",{cooperation:.75,protect:.5},{defense:.3,hpPct:.35})
  ]},
  lyra:{characterId:"lyra",title:"리라 · 명사수의 패시브",skills:[
    make("lyra-eye","백발백중","정밀 조준 능력을 높여 공격력과 집중력을 강화합니다.",{focus:.8,caution:.25},{attack:.7}),
    make("lyra-hunt","사냥꾼의 감각","약한 적을 찾아 추격하는 능력을 강화합니다.",{pursuit:.8,curiosity:.35},{speedPct:.45,attack:.2}),
    make("lyra-range","천리의 시야","전장의 거리를 읽어 사거리를 조금씩 확장합니다.",{focus:.65,caution:.45},{range:.015})
  ]},
  orion:{characterId:"orion",title:"오리온 · 비전의 패시브",skills:[
    make("orion-arcane","비전 증폭","마력의 흐름을 증폭해 지속적인 공격력을 높입니다.",{focus:.75,curiosity:.55},{attack:.85}),
    make("orion-control","마도 지배","전장을 분석하는 능력을 높여 안정적인 주문 운용을 돕습니다.",{caution:.45,focus:.75},{defense:.2,speedPct:.3}),
    make("orion-collapse","심연의 붕괴","강한 마법을 집중해 적을 압박하는 힘을 강화합니다.",{aggression:.5,focus:.85},{attack:.45,range:.01})
  ]},
  mira:{characterId:"mira",title:"미라 · 성역의 패시브",skills:[
    make("mira-grace","성역의 은총","회복 행동의 효과를 단계적으로 높입니다.",{protect:.8,cooperation:.6},{healPct:1.0}),
    make("mira-prayer","끊이지 않는 기도","긴 전투에서 버틸 수 있는 생존력과 지원 성향을 높입니다.",{survival:.65,caution:.4},{hpPct:.8,defense:.2}),
    make("mira-bond","성자의 유대","동료를 살리는 판단과 협동 능력을 강화합니다.",{cooperation:.85,protect:.65},{healPct:.55,hpPct:.25})
  ]}
};

const generic:Record<Job,SkillSet> = {
  Warrior:{characterId:"generic-warrior",title:"전사 · 패시브",skills:[
    make("warrior-might","전투 본능","공격력과 공격 성향을 높입니다.",{aggression:.6,bravery:.3},{attack:.75}),
    make("warrior-endure","전장 생존","전투 지속력을 높입니다.",{survival:.55,caution:.2},{hpPct:.9,defense:.2}),
    make("warrior-pursuit","추격 본능","추격과 기동 능력을 높입니다.",{pursuit:.7,focus:.25},{speedPct:.3,attack:.15})
  ]},
  Guardian:{characterId:"generic-guardian",title:"수호자 · 패시브",skills:[
    make("guardian-wall","철벽 수호","방어력과 보호 성향을 높입니다.",{protect:.75,survival:.35},{defense:.75}),
    make("guardian-heart","강철 심장","최대 HP와 생존 성향을 높입니다.",{survival:.7,bravery:.25},{hpPct:1.1}),
    make("guardian-link","수호 연계","협동 전투 능력을 높입니다.",{cooperation:.7,protect:.55},{defense:.25,hpPct:.3})
  ]},
  Archer:{characterId:"generic-archer",title:"궁수 · 패시브",skills:[
    make("archer-eye","정밀 조준","공격력과 집중력을 높입니다.",{focus:.75,caution:.3},{attack:.65}),
    make("archer-hunt","사냥 감각","추격과 기동 능력을 높입니다.",{pursuit:.75,curiosity:.3},{speedPct:.4,attack:.15}),
    make("archer-range","확장 시야","사거리를 단계적으로 늘립니다.",{focus:.6,caution:.4},{range:.015})
  ]},
  Mage:{characterId:"generic-mage",title:"마법사 · 패시브",skills:[
    make("mage-power","마력 증폭","주문 화력을 높입니다.",{focus:.7,aggression:.35},{attack:.8}),
    make("mage-control","주문 통제","안정적인 주문 운용을 강화합니다.",{focus:.7,caution:.4},{defense:.15,speedPct:.25}),
    make("mage-arcane","비전 탐구","마법 이해도와 사거리 운용을 높입니다.",{curiosity:.75,focus:.65},{attack:.35,range:.01})
  ]},
  Cleric:{characterId:"generic-cleric",title:"성직자 · 패시브",skills:[
    make("cleric-grace","치유의 은총","회복량을 단계적으로 높입니다.",{protect:.75,cooperation:.55},{healPct:1.0}),
    make("cleric-prayer","성역의 기도","생존력과 지원 성향을 높입니다.",{survival:.65,caution:.45},{hpPct:.75,defense:.15}),
    make("cleric-bond","유대의 성가","동료와의 협동 및 회복 능력을 높입니다.",{cooperation:.8,protect:.65},{healPct:.5,hpPct:.2})
  ]}
};

export function passiveSetFor(hero:Hero):SkillSet {
  return named[hero.id] || generic[hero.job];
}

export function passiveLevels(hero:Hero):Record<string,number> {
  return hero.passiveSkills || {};
}

export function passiveSpentPoints(hero:Hero):number {
  return Object.values(passiveLevels(hero)).reduce((n,v)=>n+Math.max(0,Math.floor(Number(v)||0)),0);
}

export function normalizePassiveData(hero:Hero):Hero {
  const set=passiveSetFor(hero);
  const levels={...hero.passiveSkills};
  for(const s of set.skills) levels[s.id]=Math.max(0,Math.min(s.maxLevel,Math.floor(Number(levels[s.id])||0)));
  const spent=Object.values(levels).reduce((n,v)=>n+v,0);
  const total=hero.skillPoints===undefined ? Math.max(0,Math.max(0,hero.level-1)-spent) : Math.max(0,Math.floor(hero.skillPoints));
  return {...hero,passiveSkills:levels,skillPoints:total};
}

export function upgradePassive(hero:Hero,skillId:string):Hero|null {
  const normalized=normalizePassiveData(hero);
  if(normalized.skillPoints<=0)return null;
  const skill=passiveSetFor(normalized).skills.find(s=>s.id===skillId);
  if(!skill)return null;
  const current=normalized.passiveSkills?.[skillId]||0;
  if(current>=skill.maxLevel)return null;
  return {...normalized,skillPoints:normalized.skillPoints-1,passiveSkills:{...normalized.passiveSkills,[skillId]:current+1}};
}

export function passiveAiBonus(hero:Hero):Partial<Tendencies> {
  const set=passiveSetFor(hero);
  const out:Partial<Tendencies>={};
  for(const skill of set.skills){
    const lv=hero.passiveSkills?.[skill.id]||0;
    for(const [k,v] of Object.entries(skill.aiMods)) out[k as keyof Tendencies]=(out[k as keyof Tendencies]||0)+(v||0)*lv;
  }
  return out;
}

export function passiveCombatBonus(hero:Hero):{attack:number;defense:number;hpPct:number;speedPct:number;range:number;healPct:number} {
  const set=passiveSetFor(hero);
  const out={attack:0,defense:0,hpPct:0,speedPct:0,range:0,healPct:0};
  for(const skill of set.skills){
    const lv=hero.passiveSkills?.[skill.id]||0;
    for(const [k,v] of Object.entries(skill.combatPerLevel)) out[k as keyof typeof out]+=(v||0)*lv;
  }
  return out;
}
