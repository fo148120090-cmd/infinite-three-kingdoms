import { useEffect, useMemo, useState } from 'react';
import { GENERALS } from './game/data/generals';
import { getGeneralImagePaths } from './game/data/generalImages';
import { getGeneralCombatPower, getGeneralEffectiveStats } from './game/systems/generalStats';
import type { Equip, General } from './game/types';

const KEY='infinite-three-kingdoms-save-v2';
type Save={level?:number;owned?:unknown;formation?:unknown;generalLevels?:unknown;stars?:unknown;equipment?:unknown};

function readSave():Save{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function mapOf(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,number>:{}}
function equipMap(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,Equip>:{}}
function getStats(g:General,save:Save){
 const levels=mapOf(save.generalLevels),stars=mapOf(save.stars),equipment=equipMap(save.equipment);
 const level=Math.max(1,Number(levels[g.id])||Number(save.level)||1);
 const star=Math.max(1,Math.min(6,Number(stars[g.id])||1));
 return getGeneralEffectiveStats(g,{level,star,equipment:equipment[g.id]});
}
const power=(g:General,save:Save)=>getGeneralCombatPower(getStats(g,save));
const fmt=(n:number)=>n.toLocaleString();

export default function GeneralFormationPanel(){
 const[open,setOpen]=useState(false),[save,setSave]=useState<Save>(readSave()),[slot,setSlot]=useState(0),[message,setMessage]=useState('');
 const refresh=()=>setSave(readSave());
 const owned=useMemo(()=>new Set(Array.isArray(save.owned)?save.owned.filter((x):x is string=>typeof x==='string'):[]),[save.owned]);
 const formation=useMemo(()=>Array.isArray(save.formation)?save.formation.filter((x):x is string=>typeof x==='string').slice(0,5):[],[save.formation]);
 const generals=useMemo(()=>new Map(GENERALS.map(g=>[g.id,g])),[]);
 const team=formation.map(id=>generals.get(id)).filter(Boolean) as General[];
 const teamPower=team.reduce((sum,g)=>sum+power(g,save),0);
 const selected=formation[slot]?generals.get(formation[slot]):undefined;
 const candidates=GENERALS.filter(g=>owned.has(g.id)&&!formation.includes(g.id));

 const selectSlot=(index:number)=>{setSlot(index);setMessage('')};
 const assign=(g:General)=>{
   const ids=[...formation];
   while(ids.length<5)ids.push('');
   ids[slot]=g.id;
   const nextFormation=ids.filter(Boolean).filter((id,index,all)=>all.indexOf(id)===index).slice(0,5);
   const next={...save,formation:nextFormation};
   localStorage.setItem(KEY,JSON.stringify(next));setSave(next);setMessage(g.name+'을(를) '+(slot+1)+'번 슬롯에 편성했습니다.');
 };
 const remove=()=>{
   if(!selected)return;
   const nextFormation=formation.filter(id=>id!==selected.id);
   const next={...save,formation:nextFormation};
   localStorage.setItem(KEY,JSON.stringify(next));setSave(next);setSlot(Math.min(slot,Math.max(0,nextFormation.length-1)));setMessage(selected.name+'을(를) 편성에서 제외했습니다.');
 };
 useEffect(()=>{if(!open)return;const t=window.setInterval(refresh,800);return()=>window.clearInterval(t)},[open]);

 return <>
  <button onClick={()=>{refresh();setMessage('');setOpen(true)}} style={{position:'fixed',right:230,bottom:18,zIndex:1200,padding:'10px 14px',borderRadius:10,border:'1px solid #4b5d79',background:'#182235',color:'#fff',fontWeight:700,cursor:'pointer',boxShadow:'0 8px 24px rgba(0,0,0,.35)'}}>⚔ 편성 관리</button>
  {open&&<div role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}} style={{position:'fixed',inset:0,zIndex:1199,background:'rgba(5,8,13,.78)',display:'flex',justifyContent:'center',alignItems:'center',padding:18}}>
   <section style={{width:'min(1080px,96vw)',maxHeight:'90vh',overflow:'auto',background:'#0d121b',border:'1px solid #324057',borderRadius:16,padding:18,color:'#fff',boxShadow:'0 20px 60px rgba(0,0,0,.45)'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:14}}>
     <div><small style={{color:'#91a0b8'}}>FORMATION MANAGEMENT · 5 SLOT PARTY</small><h2 style={{margin:'3px 0'}}>전투 편성 관리</h2><div style={{fontSize:12,color:'#a9b4c5'}}>현재 편성 {formation.length}/5 · 팀 전투력 <b>{fmt(teamPower)}</b></div></div>
     <button onClick={()=>setOpen(false)} aria-label="닫기" style={{border:0,background:'transparent',color:'#fff',fontSize:22,cursor:'pointer'}}>✕</button>
    </header>
    {message&&<div style={{padding:'9px 11px',marginBottom:12,borderRadius:9,background:'#182235',color:'#c6d4eb',fontSize:13}}>{message}</div>}
    <section style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(140px,1fr))',gap:9,marginBottom:16}}>
     {Array.from({length:5},(_,i)=>{const g=formation[i]?generals.get(formation[i]):undefined;return <button key={i} onClick={()=>selectSlot(i)} style={{textAlign:'left',padding:10,borderRadius:12,border:'1px solid '+(slot===i?'#8799b8':'#2a3345'),background:slot===i?'#1a2639':'#141923',color:'#fff',cursor:'pointer',minHeight:145}}>
       <small style={{color:'#8fa0b9'}}>SLOT {i+1}</small>{g?<><img src={getGeneralImagePaths(g).sd} alt="" style={{display:'block',width:48,height:48,objectFit:'cover',borderRadius:9,margin:'7px 0'}} onError={e=>{e.currentTarget.style.display='none'}}/><b>{g.name}</b><div style={{fontSize:11,color:'#a9b4c5',marginTop:4}}>Lv.{getStats(g,save).level} · ★{getStats(g,save).star}</div><div style={{fontSize:11,color:'#9aa6b8'}}>전투력 {fmt(power(g,save))}</div></>:<div style={{padding:'28px 0',color:'#6f7e96'}}>빈 슬롯</div>}
      </button>})}
    </section>
    <section style={{padding:12,borderRadius:12,border:'1px solid #2a3345',background:'#101722',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
       <div><b>{selected?(slot+1)+'번 슬롯 · '+selected.name:(slot+1)+'번 슬롯 · 빈 슬롯'}</b><div style={{fontSize:11,color:'#95a2b7',marginTop:3}}>{selected?'교체할 장수를 아래에서 선택하세요.':'아래 장수를 선택하면 이 슬롯에 투입됩니다.'}</div></div>
       {selected&&<button onClick={remove} style={{padding:'7px 10px',borderRadius:8,border:'1px solid #59383d',background:'#24181b',color:'#f0c2c7'}}>편성 제외</button>}
      </div>
    </section>
    <h3 style={{margin:'8px 0'}}>보유 장수 · 교체 후보</h3>
    {candidates.length===0?<p style={{color:'#9aa6b8'}}>현재 편성에 없는 보유 장수가 없습니다.</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:9}}>
      {candidates.map(g=>{const stats=getStats(g,save),candidatePower=power(g,save),projected=selected?teamPower-power(selected,save)+candidatePower:teamPower+candidatePower;const delta=projected-teamPower;return <button key={g.id} onClick={()=>assign(g)} style={{textAlign:'left',padding:12,borderRadius:10,border:'1px solid #2a3345',background:'#141923',color:'#fff',cursor:'pointer'}}>
       <div style={{display:'flex',justifyContent:'space-between',gap:8}}><b>{g.name}</b><span>Lv.{stats.level} · ★{stats.star}</span></div>
       <div style={{fontSize:11,color:'#9aa6b8',margin:'5px 0'}}>HP {stats.hp} · 공격 {stats.atk} · 방어 {stats.defense}</div>
       <div style={{fontSize:12}}>전투력 <b>{fmt(candidatePower)}</b>{selected&&<span style={{color:delta>=0?'#9ed0aa':'#d7a2a2'}}> · 교체 후 {fmt(projected)} ({delta>=0?'+':''}{fmt(delta)})</span>}</div>
       <div style={{marginTop:8,fontSize:11,color:'#91a0b8'}}>클릭하여 {slot+1}번 슬롯에 투입</div>
      </button>})}
    </div>}
   </section>
  </div>}
 </>;
}
