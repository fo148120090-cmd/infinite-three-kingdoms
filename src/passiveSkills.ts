import type { Hero, Job, Tendencies } from "./dungeonData";

export type PassiveSkill = {
  id: string;
  name: string;
  detail: string;
  maxLevel: 30;
  tier: 1 | 2 | 3;
  branch: string;
  requires?: { skillId: string; level: number };
  aiMods: Partial<Tendencies>;
  combatPerLevel: { attack?: number; defense?: number; hpPct?: number; speedPct?: number; range?: number; healPct?: number };
};

type SkillSet = { characterId: string; title: string; skills: PassiveSkill[] };

const make = (id:string,name:string,detail:string,aiMods:Partial<Tendencies>,combatPerLevel:PassiveSkill["combatPerLevel"],branch:string="기본",tier:1|2|3=1,requires?:{skillId:string;level:number}):PassiveSkill =>
  ({id,name,detail,aiMods,combatPerLevel,maxLevel:30,branch,tier,requires});

const named:Record<string,SkillSet> = {
  kael:{characterId:"kael",title:"카엘 · 전장의 패시브",skills:[
    make("kael-war","전쟁의 본능","공격을 거듭할수록 공격 성향과 전투력이 강화됩니다.",{aggression:.7,bravery:.35},{attack:.8},"전장",1),
    make("kael-war-2","전장의 기세","전투가 길어질수록 공격 압박을 높입니다.",{aggression:.5,bravery:.45},{attack:.55,speedPct:.15},"전장",2,{skillId:"kael-war",level:5}),
    make("kael-war-3","무쌍의 군세","압도적인 공격 기세로 전투 화력을 완성합니다.",{aggression:.65,pursuit:.3},{attack:1.0},"전장",3,{skillId:"kael-war-2",level:5}),
    make("kael-iron","불굴의 전장","위기에서도 버티는 힘을 높여 생존과 HP를 강화합니다.",{survival:.6,caution:.25},{hpPct:1.0,defense:.25},"불굴",1),
    make("kael-iron-2","강철 의지","피해를 견디며 전선을 유지하는 힘을 높입니다.",{survival:.55,bravery:.3},{hpPct:.8,defense:.4},"불굴",2,{skillId:"kael-iron",level:5}),
    make("kael-iron-3","불멸의 전사","전장의 한계까지 버티는 최종 생존력을 얻습니다.",{survival:.7,caution:.25},{hpPct:1.4,defense:.55},"불굴",3,{skillId:"kael-iron-2",level:5}),
    make("kael-hunt","끝없는 추격","약해진 적을 놓치지 않는 추격 능력을 높입니다.",{pursuit:.75,focus:.3},{speedPct:.35,attack:.2},"추격",1),
    make("kael-hunt-2","사냥꾼의 본능","적의 빈틈을 읽고 추격 속도를 높입니다.",{pursuit:.65,focus:.35},{speedPct:.5,attack:.3},"추격",2,{skillId:"kael-hunt",level:5}),
    make("kael-hunt-3","천리 추격","도망칠 틈을 주지 않는 최종 추격 능력입니다.",{pursuit:.85,focus:.35},{speedPct:.75,attack:.5},"추격",3,{skillId:"kael-hunt-2",level:5})
  ]},
  seren:{characterId:"seren",title:"세린 · 수호의 패시브",skills:[
    make("seren-wall","철벽의 맹세","전열을 지키는 힘과 보호 행동을 강화합니다.",{protect:.8,cooperation:.4},{defense:.8},"철벽",1),
    make("seren-wall-2","수호 진형","전열의 안정성과 방어력을 강화합니다.",{protect:.65,survival:.4},{defense:.55,hpPct:.35},"철벽",2,{skillId:"seren-wall",level:5}),
    make("seren-wall-3","불침의 성채","무너지지 않는 방어 진형을 완성합니다.",{protect:.9,survival:.4},{defense:1.0,hpPct:.8},"철벽",3,{skillId:"seren-wall-2",level:5}),
    make("seren-heart","불굴의 방패","피해를 받아도 전선을 유지할 수 있도록 생존력을 높입니다.",{survival:.7,bravery:.25},{hpPct:1.2},"강철",1),
    make("seren-heart-2","강철 심장","위기에서 최대 HP와 생존력을 강화합니다.",{survival:.75,caution:.3},{hpPct:1.0,defense:.3},"강철",2,{skillId:"seren-heart",level:5}),
    make("seren-heart-3","수호자의 불굴","쓰러지지 않는 최종 생존력을 얻습니다.",{survival:.9,bravery:.35},{hpPct:1.6,defense:.5},"강철",3,{skillId:"seren-heart-2",level:5}),
    make("seren-link","수호 연계","동료와의 협동을 통해 방어 행동의 효율을 높입니다.",{cooperation:.75,protect:.5},{defense:.3,hpPct:.35},"연계",1),
    make("seren-link-2","전우의 결속","동료와 함께할 때 수호 효율을 높입니다.",{cooperation:.85,protect:.45},{defense:.4,hpPct:.45},"연계",2,{skillId:"seren-link",level:5}),
    make("seren-link-3","철의 유대","아군을 지키는 협동 능력을 극대화합니다.",{cooperation:.95,protect:.55},{defense:.65,hpPct:.65},"연계",3,{skillId:"seren-link-2",level:5})
  ]},
  lyra:{characterId:"lyra",title:"리라 · 명사수의 패시브",skills:[
    make("lyra-eye","백발백중","정밀 조준 능력을 높여 공격력과 집중력을 강화합니다.",{focus:.8,caution:.25},{attack:.7},"정밀",1),
    make("lyra-eye-2","약점 포착","적의 약점을 읽어 명중 압력을 강화합니다.",{focus:.9,caution:.2},{attack:.55,range:.01},"정밀",2,{skillId:"lyra-eye",level:5}),
    make("lyra-eye-3","신궁의 경지","초정밀 사격 능력을 완성합니다.",{focus:1.0,caution:.25},{attack:1.0,range:.02},"정밀",3,{skillId:"lyra-eye-2",level:5}),
    make("lyra-hunt","사냥꾼의 감각","약한 적을 찾아 추격하는 능력을 강화합니다.",{pursuit:.8,curiosity:.35},{speedPct:.45,attack:.2},"사냥",1),
    make("lyra-hunt-2","추적자의 눈","적의 움직임을 읽고 기동력을 높입니다.",{pursuit:.9,focus:.35},{speedPct:.6,attack:.25},"사냥",2,{skillId:"lyra-hunt",level:5}),
    make("lyra-hunt-3","백야의 추적자","최상의 기동과 추격 능력을 완성합니다.",{pursuit:1.0,focus:.4},{speedPct:.9,attack:.45},"사냥",3,{skillId:"lyra-hunt-2",level:5}),
    make("lyra-range","천리의 시야","전장의 거리를 읽어 사거리를 조금씩 확장합니다.",{focus:.65,caution:.45},{range:.015},"시야",1),
    make("lyra-range-2","원거리 지배","먼 거리에서도 안정적인 공격을 유지합니다.",{focus:.8,caution:.45},{range:.025,attack:.25},"시야",2,{skillId:"lyra-range",level:5}),
    make("lyra-range-3","천리안","전장을 꿰뚫는 최종 사거리 운용을 얻습니다.",{focus:.95,caution:.5},{range:.04,attack:.4},"시야",3,{skillId:"lyra-range-2",level:5})
  ]},
  orion:{characterId:"orion",title:"오리온 · 비전의 패시브",skills:[
    make("orion-arcane","비전 증폭","마력의 흐름을 증폭해 지속적인 공격력을 높입니다.",{focus:.75,curiosity:.55},{attack:.85},"증폭",1),
    make("orion-arcane-2","과부하","마력 출력을 끌어올려 주문 화력을 높입니다.",{focus:.85,aggression:.3},{attack:.65,speedPct:.2},"증폭",2,{skillId:"orion-arcane",level:5}),
    make("orion-arcane-3","대비전 폭주","비전 에너지를 극한까지 증폭합니다.",{focus:1.0,aggression:.45},{attack:1.15},"증폭",3,{skillId:"orion-arcane-2",level:5}),
    make("orion-control","마도 지배","전장을 분석하는 능력을 높여 안정적인 주문 운용을 돕습니다.",{caution:.45,focus:.75},{defense:.2,speedPct:.3},"통제",1),
    make("orion-control-2","마력 제어","주문 안정성과 전투 지속력을 높입니다.",{caution:.6,focus:.8},{defense:.35,speedPct:.35},"통제",2,{skillId:"orion-control",level:5}),
    make("orion-control-3","현자의 영역","전장을 완전히 통제하는 마도 운용을 완성합니다.",{caution:.75,focus:.95},{defense:.55,speedPct:.55},"통제",3,{skillId:"orion-control-2",level:5}),
    make("orion-collapse","심연의 붕괴","강한 마법을 집중해 적을 압박하는 힘을 강화합니다.",{aggression:.5,focus:.85},{attack:.45,range:.01},"붕괴",1),
    make("orion-collapse-2","심연 균열","마법 공격의 압박 범위를 확장합니다.",{aggression:.65,focus:.9},{attack:.55,range:.02},"붕괴",2,{skillId:"orion-collapse",level:5}),
    make("orion-collapse-3","공허 낙하","심연의 힘을 폭발시켜 최종 화력을 얻습니다.",{aggression:.8,focus:1.0},{attack:.85,range:.035},"붕괴",3,{skillId:"orion-collapse-2",level:5})
  ]},
  mira:{characterId:"mira",title:"미라 · 성역의 패시브",skills:[
    make("mira-grace","성역의 은총","회복 행동의 효과를 단계적으로 높입니다.",{protect:.8,cooperation:.6},{healPct:1.0},"은총",1),
    make("mira-grace-2","치유의 파동","회복력이 더욱 강화되어 장기전에 강해집니다.",{protect:.85,cooperation:.7},{healPct:1.25},"은총",2,{skillId:"mira-grace",level:5}),
    make("mira-grace-3","대성역","아군을 회복하는 능력을 극한까지 끌어올립니다.",{protect:.95,cooperation:.9},{healPct:1.8,hpPct:.2},"은총",3,{skillId:"mira-grace-2",level:5}),
    make("mira-prayer","끊이지 않는 기도","긴 전투에서 버틸 수 있는 생존력과 지원 성향을 높입니다.",{survival:.65,caution:.4},{hpPct:.8,defense:.2},"기도",1),
    make("mira-prayer-2","성스러운 인내","전투 지속력을 높이고 안정적인 지원을 유지합니다.",{survival:.8,caution:.5},{hpPct:1.0,defense:.3},"기도",2,{skillId:"mira-prayer",level:5}),
    make("mira-prayer-3","영원한 기도","전투가 길어질수록 흔들리지 않는 생존 기반을 만듭니다.",{survival:.95,caution:.6},{hpPct:1.35,defense:.45},"기도",3,{skillId:"mira-prayer-2",level:5}),
    make("mira-bond","성자의 유대","동료를 살리는 판단과 협동 능력을 강화합니다.",{cooperation:.85,protect:.65},{healPct:.55,hpPct:.25},"유대",1),
    make("mira-bond-2","구원의 손길","동료 지원과 회복 효율을 높입니다.",{cooperation:.95,protect:.7},{healPct:.8,hpPct:.35},"유대",2,{skillId:"mira-bond",level:5}),
    make("mira-bond-3","성자의 기적","아군을 지키는 최종 지원 능력을 완성합니다.",{cooperation:1.0,protect:.9},{healPct:1.2,hpPct:.6},"유대",3,{skillId:"mira-bond-2",level:5})
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

function expandGenericTree(set:SkillSet):SkillSet {
  if(set.skills.length>=9)return set;
  const base=set.skills.slice(0,3);
  const skills:PassiveSkill[]=[];
  base.forEach((s,index)=>{
    const branch=["전투","생존","전문화"][index]||("분기 "+(index+1));
    const t1={...s,id:s.id+"-1",branch,tier:1,requires:undefined};
    const t2={...s,id:s.id+"-2",name:s.name+" · 강화",detail:s.detail+" 한 단계 강화됩니다.",branch,tier:2,combatPerLevel:Object.fromEntries(Object.entries(s.combatPerLevel).map(([k,v])=>[k,(v||0)*1.2])) as PassiveSkill["combatPerLevel"],requires:{skillId:t1.id,level:5}};
    const t3={...s,id:s.id+"-3",name:s.name+" · 극의",detail:s.detail+" 극한까지 끌어올립니다.",branch,tier:3,combatPerLevel:Object.fromEntries(Object.entries(s.combatPerLevel).map(([k,v])=>[k,(v||0)*1.5])) as PassiveSkill["combatPerLevel"],requires:{skillId:t2.id,level:5}};
    skills.push(t1,t2,t3);
  });
  return {...set,skills};
}
export function passiveSetFor(hero:Hero):SkillSet {
  return named[hero.id] || expandGenericTree(generic[hero.job]);
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
  if((normalized.skillPoints||0)<=0)return null;
  const skill=passiveSetFor(normalized).skills.find(s=>s.id===skillId);
  if(!skill)return null;
  const current=normalized.passiveSkills?.[skillId]||0;
  if(current>=skill.maxLevel)return null;
  if(skill.requires && (normalized.passiveSkills?.[skill.requires.skillId]||0)<skill.requires.level)return null;
  return {...normalized,skillPoints:(normalized.skillPoints||0)-1,passiveSkills:{...normalized.passiveSkills,[skillId]:current+1}};
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
