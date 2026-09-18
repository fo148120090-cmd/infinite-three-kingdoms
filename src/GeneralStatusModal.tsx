import { useEffect, useMemo, useState } from 'react';
import { GENERALS } from './game/data/generals';
import type { General } from './game/types';
import { getGeneralImagePaths } from './game/data/generalImages';
import './general-status.css';

const KEY = 'infinite-three-kingdoms-save-v2';
type SaveData = { level?: number; gold?: number; materials?: number; generalLevels?: unknown; owned?: unknown; stars?: unknown; fragments?: unknown; equipment?: unknown; tsSkins?: unknown };
type EquipState = { level?: number; rarity?: number; equipped?: boolean; optionA?: number; optionB?: number };

const talentById: Record<string,string> = {
  'liu-bei':'인덕의 기치: 아군 전체의 전투 지속력을 높이는 지휘형 재능',
  'guan-yu':'청룡의 기세: 강한 단일 대상 공격과 압박에 특화',
  'zhang-fei':'만인지적: 높은 생존력과 전방 제압 능력을 발휘',
  'zhao-yun':'칠진의 용: 기동력을 활용한 돌파와 연속 전투에 특화',
  'zhuge-liang':'와룡의 책략: 원거리·광역 스킬 운용에 특화',
  'cao-cao':'위무의 명령: 적 전력을 약화시키는 지휘 능력에 특화',
  'xiahou-dun':'독안의 결의: 근접 교전에서 안정적인 피해 압박',
  'sun-quan':'강동의 수호: 회복과 방어를 함께 운용하는 지원 재능',
  'lu-bu':'천하무쌍: 압도적인 공격력과 돌파 능력을 극대화',
  'diao-chan':'폐월의 매혹: 적 행동을 봉쇄하고 전장을 교란',
};
const biographyById: Record<string,string> = {
  'liu-bei':'백성을 먼저 생각한 군주. 관우와 장비와의 의형제 결의를 바탕으로 천하의 인재를 모은다.',
  'guan-yu':'청룡언월도를 휘두르는 충의의 무장. 의리를 위해 물러서지 않는 전장의 상징이다.',
  'zhang-fei':'장판교에서 이름을 떨친 맹장. 압도적인 기세와 호통으로 적의 진형을 무너뜨린다.',
  'zhao-yun':'상산의 용이라 불린 기병. 빠른 기동으로 적진을 가르며 아군을 구해낸다.',
  'zhuge-liang':'와룡이라 불린 군사. 치밀한 책략과 원거리 술법으로 전장의 흐름을 바꾼다.',
  'cao-cao':'난세의 패자. 냉철한 판단과 강력한 통솔력으로 위의 기반을 세운다.',
  'xiahou-dun':'독안의 맹장. 부상을 두려워하지 않는 강인함으로 전선을 지킨다.',
  'sun-quan':'강동의 호랑이. 수세와 반격을 조율하며 오의 기반을 지켜낸다.',
  'lu-bu':'천하무쌍의 무장. 누구보다 강력한 일격과 돌파력으로 적의 전열을 압도한다.',
  'diao-chan':'경국지색의 책략가. 아름다움과 매혹을 무기로 적의 판단을 흐리게 한다.',
};
const roleSkill: Record<string,string> = { 지원:'아군 강화 / 회복 / 방어 보조', 전사:'근접 단일 공격 / 돌파', 수호:'전방 버티기 / 제압 / 방어', 기병:'고기동 돌파 / 추격', 책사:'원거리 / 광역 / 제어' };
const roleIcon: Record<string,string> = { 지원:'🛡️', 전사:'⚔️', 수호:'🧱', 기병:'🐎', 책사:'📜' };
const factionIcon: Record<string,string> = { Shu:'蜀', Wei:'魏', Wu:'吳', Warlords:'群' };
const optionName = (v:number|undefined) => ['공격력','최대HP','치명타','스킬 위력'][v ?? 0] ?? '없음';
const optionValue = (v:number|undefined,l:number) => (v??0)===0?`+${l*2}`:(v??0)===1?`+${l*5}`:(v??0)===2?`+${Math.floor(l/2)}%`:`+${l}`;
const generalLevelCost = (level:number) => level * 200;
const generalLevelMaterials = (level:number) => level * 3;
function readSave():SaveData{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function portraitData(g:General, _ts:boolean){
  return getGeneralImagePaths(g).portrait;
}

export default function GeneralStatusModal(){
  const [open,setOpen]=useState(false),[selectedId,setSelectedId]=useState(GENERALS[0].id),[save,setSave]=useState<SaveData>(readSave()),[tab,setTab]=useState<'status'|'story'|'skin'>('status'),[message,setMessage]=useState('');
  const selected=GENERALS.find(g=>g.id===selectedId)??GENERALS[0];
  const owned=useMemo(()=>new Set(Array.isArray(save.owned)?save.owned.filter((x):x is string=>typeof x==='string'):[]),[save.owned]);
  const starsMap=(save.stars&&typeof save.stars==='object'?save.stars:{}) as Record<string,number>;
  const generalLevelsMap=(save.generalLevels&&typeof save.generalLevels==='object'?save.generalLevels:{}) as Record<string,number>;
  const fragmentsMap=(save.fragments&&typeof save.fragments==='object'?save.fragments:{}) as Record<string,number>;
  const equipmentMap=(save.equipment&&typeof save.equipment==='object'?save.equipment:{}) as Record<string,EquipState>;
  const skinMap=(save.tsSkins&&typeof save.tsSkins==='object'?save.tsSkins:{}) as Record<string,boolean>;
  const star=Math.max(1,Math.min(6,Number(starsMap[selected.id])||1)), level=Math.max(1,Number(generalLevelsMap[selected.id])||Number(save.level)||1), levelOwned=Number(generalLevelsMap[selected.id])||0;
  const equipment=equipmentMap[selected.id]??{level:0,rarity:1,equipped:true,optionA:0,optionB:1};
  const equipLevel=equipment.equipped===false?0:Math.max(0,Number(equipment.level)||0), mult=1+0.05*(star-1);
  const hp=Math.floor((selected.hp+(level-1)*12+equipLevel*10+((equipment.optionA===1||equipment.optionB===1)?equipLevel*5:0))*mult);
  const atk=Math.floor((selected.atk+(level-1)*3+equipLevel*4+((equipment.optionA===0||equipment.optionB===0)?equipLevel*2:0))*mult);
  const defense=Math.floor((selected.defense+(level-1)*1.5+equipLevel*2+((equipment.optionA===1||equipment.optionB===1)?Math.floor(equipLevel*.8):0))*mult);
  const critChance=equipment.equipped===false?0:(equipment.optionA===2?Math.floor(equipLevel/2):equipment.optionB===2?Math.floor(equipLevel/2):0);
  const skillPower=selected.skillPower+(equipment.equipped===false?0:(equipment.optionA===3?equipLevel:equipment.optionB===3?equipLevel:0));
  const tsUnlocked=Boolean(skinMap[selected.id]), refresh=()=>setSave(readSave());
  const levelUp=()=>{
    if(!owned.has(selected.id))return setMessage('먼저 장수를 영입해야 합니다.');
    const target=Math.max(1,level),gold=Number(save.level)||1;
    const cost=generalLevelCost(target),materials=generalLevelMaterials(target);
    if(target>=60)return setMessage('장수 레벨은 Lv.60이 최대입니다.');
    const currentGold=Number((save as any).gold)||0,currentMaterials=Number((save as any).materials)||0;
    if(currentGold<cost)return setMessage(`금화 부족 · ${cost.toLocaleString()} 필요`);
    if(currentMaterials<materials)return setMessage(`강화 재료 부족 · ${materials}개 필요`);
    const next={...save,gold:currentGold-cost,materials:currentMaterials-materials,generalLevels:{...generalLevelsMap,[selected.id]:target+1}};
    localStorage.setItem(KEY,JSON.stringify(next));setSave(next);setMessage(`${selected.name} Lv.${target} → Lv.${target+1} · 금화 -${cost.toLocaleString()} · 재료 -${materials}`);
    void gold;
  };
  const enhance=()=>{
    if(!owned.has(selected.id))return setMessage('먼저 장수를 영입해야 합니다.');
    const currentLevel=Math.max(0,Number(equipment.level)||0);
    if(currentLevel>=20)return setMessage('전용장비는 +20이 최대입니다.');
    const cost=(currentLevel+1)*5,currentMaterials=Math.max(0,Number(save.materials)||0),currentGold=Math.max(0,Number(save.gold)||0);
    if(currentMaterials<cost)return setMessage(`강화 재료 부족 · ${cost}개 필요`);
    const nextEquipment={...equipment,level:currentLevel+1,rarity:currentLevel+1>=15?5:currentLevel+1>=10?4:currentLevel+1>=5?3:currentLevel+1>=3?2:1,equipped:equipment.equipped!==false};
    const next={...save,gold:currentGold,materials:currentMaterials-cost,equipment:{...equipmentMap,[selected.id]:nextEquipment}};
    localStorage.setItem(KEY,JSON.stringify(next));setSave(next);setMessage(`${selected.name} 전용장비 +${currentLevel} → +${currentLevel+1} · 재료 -${cost}`);
  };
  const toggleEquipment=()=>{
    if(!owned.has(selected.id))return setMessage('먼저 장수를 영입해야 합니다.');
    const nextEquipment={...equipment,equipped:equipment.equipped===false};
    const next={...save,equipment:{...equipmentMap,[selected.id]:nextEquipment}};
    localStorage.setItem(KEY,JSON.stringify(next));setSave(next);setMessage(`${selected.name} 전용장비 ${nextEquipment.equipped?'장착':'해제'}`);
  };
  useEffect(()=>{const t=window.setInterval(()=>{if(open)refresh()},700);return()=>window.clearInterval(t)},[open]);
  return <>
    <button className="general-status-launcher" onClick={()=>{refresh();setMessage('');setOpen(true)}}>⚔ 장수 상태</button>
    {open&&<div className="general-status-backdrop" role="dialog" aria-modal="true" aria-label="장수 상태창" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
      <section className="general-status-panel">
        <header className="general-status-header"><div><small>GENERAL ARCHIVE · CHARACTER PROFILE</small><h2>장수 상태창</h2></div><button onClick={()=>setOpen(false)} aria-label="닫기">✕</button></header>
        <div className="general-status-body">
          <aside className="general-status-list"><h3>장수 목록</h3>{GENERALS.map(g=><button key={g.id} className={`${g.id===selected.id?'active':''} ${owned.has(g.id)?'':'locked'}`} onClick={()=>{setSelectedId(g.id);setTab('status');setMessage('')}}><span className="general-status-mini">{factionIcon[g.faction]}</span><span><b>{g.name}</b><small>{roleIcon[g.role]} {g.role} · ★{Math.max(1,Number(starsMap[g.id])||1)} · Lv.{Math.max(1,Number(generalLevelsMap[g.id])||Number(save.level)||1)}</small></span></button>)}</aside>
          <main className="general-status-main">
            <div className="general-status-hero"><div className="general-portrait-wrap"><img src={portraitData(selected,tab==='skin'&&tsUnlocked)} alt={`${selected.name} 초상화`}/><div className="general-star-row">{'★'.repeat(star)}<span>{'★'.repeat(6-star)}</span></div></div><div className="general-status-summary"><div className="general-name-line"><div><span className="general-faction-badge">{factionIcon[selected.faction]} {selected.faction}</span><h1>{tab==='skin'&&tsUnlocked?selected.tsName:selected.name}</h1><p>{tab==='skin'&&tsUnlocked?selected.tsTitle:selected.title}</p></div><strong>Lv.{level}</strong></div><div className="general-tags"><span>{roleIcon[selected.role]} {selected.role}</span><span>장비 +{equipLevel}</span><span>{owned.has(selected.id)?'보유':'미영입'}</span></div><p className="general-one-line">{roleSkill[selected.role]}</p>{message&&<p style={{margin:'10px 0 0',color:'#b9c7df',fontSize:13}}>{message}</p>}</div></div>
            <nav className="general-status-tabs"><button className={tab==='status'?'active':''} onClick={()=>setTab('status')}>스탯·특기·재능</button><button className={tab==='story'?'active':''} onClick={()=>setTab('story')}>열전</button><button className={tab==='skin'?'active':''} onClick={()=>setTab('skin')}>스킨</button></nav>
            {tab==='status'&&<div className="general-status-grid"><section><h3>전투 스탯</h3><div className="stat-grid"><span>HP</span><b>{hp}</b><span>공격력</span><b>{atk}</b><span>방어력</span><b>{defense}</b><span>사거리</span><b>{selected.range}</b><span>이동력</span><b>{selected.move}</b><span>치명타</span><b>{critChance}%</b><span>스킬 위력</span><b>{skillPower||'지원형'}</b><span>등급</span><b>★{star}</b></div></section><section><h3>특기</h3><p>{roleSkill[selected.role]}</p><p>{selected.faction==='Shu'?'촉한 계열의 결속과 지원 전술':selected.faction==='Wei'?'위 계열의 통솔과 제압 전술':selected.faction==='Wu'?'오 계열의 수비와 기동 전술':'군웅 계열의 독자적인 돌파 전술'}</p></section><section><h3>재능</h3><p>{talentById[selected.id]}</p></section><section><h3>스킬</h3><div className="skill-card"><b>✦ {selected.skill}</b><span>스킬 위력 {skillPower||'지원형'}</span><small>{roleSkill[selected.role]}</small></div></section><section><h3>성장</h3><p>장수 레벨 <b>Lv.{level}</b> {levelOwned===0&&<span>(계정 레벨 적용)</span>} · ★{star}</p><p>다음 레벨 비용: <b>{level>=60?'MAX':`${generalLevelCost(level)} 금화 · ${generalLevelMaterials(level)} 재료`}</b></p><button disabled={!owned.has(selected.id)||level>=60} onClick={levelUp} style={{marginTop:8,padding:'8px 12px',borderRadius:8,border:'1px solid #3a4760',background:level>=60?'#252a33':'#202a3c',color:'#fff',cursor:level>=60?'not-allowed':'pointer'}}>{level>=60?'최대 레벨':'장수 레벨업'}</button><p>필요 조각: <b>{star>=6?'최대 성급':`${fragmentsMap[selected.id]||0} / ${star*20}`}</b></p></section><section><h3>전용장비</h3><p>{selected.equipment} · {equipment.equipped===false?'미장착':'장착'} · +{equipLevel}</p><p>{optionName(equipment.optionA)} {optionValue(equipment.optionA,equipLevel)} / {optionName(equipment.optionB)} {optionValue(equipment.optionB,equipLevel)}</p><p style={{fontSize:12,color:'#9aa6b8'}}>다음 강화: {equipLevel>=20?'MAX':`${(equipLevel+1)*5} 강화 재료`}</p><div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:7}}><button onClick={enhance} disabled={!owned.has(selected.id)||equipLevel>=20} style={{padding:'8px 11px',borderRadius:8,border:'1px solid #3a4760',background:'#202a3c',color:'#fff',cursor:equipLevel>=20?'not-allowed':'pointer'}}>{equipLevel>=20?'장비 MAX':`장비 강화`}</button><button onClick={toggleEquipment} disabled={!owned.has(selected.id)} style={{padding:'8px 11px',borderRadius:8,border:'1px solid #4a5b72',background:'#182235',color:'#fff'}}>{equipment.equipped===false?'장착':'장비 해제'}</button></div></section></div>}
            {tab==='story'&&<article className="general-story"><h3>{selected.name} 열전</h3><p>{biographyById[selected.id]}</p><blockquote>“난세의 기록은 살아 있는 자의 선택으로 다시 쓰인다.”</blockquote><div className="story-meta"><span>세력 · {selected.faction}</span><span>역할 · {selected.role}</span><span>초기 등급 · ★{selected.grade}</span></div></article>}
            {tab==='skin'&&<div className="general-skin-view"><div className="skin-card-main"><div><span>TS SKIN</span><h3>{selected.tsName}</h3><p>{selected.tsTitle}</p><b>{tsUnlocked?'해금됨':'잠김'}</b></div><div className="skin-preview"><img src={portraitData(selected,tsUnlocked)} alt={`${selected.tsName} 스킨 이미지`}/></div></div><p className="skin-note">TS 스킨은 동일 장수의 별도 외형/연출을 사용하며 전투력 차이는 최소화하는 방향입니다.</p></div>}
          </main>
        </div>
      </section>
    </div>}
  </>;
}
