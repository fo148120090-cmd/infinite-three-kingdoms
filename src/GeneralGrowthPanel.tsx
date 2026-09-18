import { useEffect, useMemo, useState } from 'react';
import { GENERALS } from './game/data/generals';
import type { Equip, General } from './game/types';
import { getGeneralCombatPower, getGeneralEffectiveStats } from './game/systems/generalStats';

const KEY='infinite-three-kingdoms-save-v2';
type Save={level?:number;gold?:number;materials?:number;owned?:unknown;generalLevels?:unknown;stars?:unknown;fragments?:unknown;equipment?:Record<string,Equip>};
const levelCost=(level:number)=>level*200;
const levelMaterials=(level:number)=>level*3;
const starNeed=(star:number)=>star*20;
function readSave():Save{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function mapOf(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,number>:{} }
function GrowthCard({g,level,star,fragments,equipment,onLevelUp,onStarUp,disabled}:{g:General;level:number;star:number;fragments:number;equipment?:Equip;onLevelUp:()=>void;onStarUp:()=>void;disabled:boolean}){
 const current=getGeneralEffectiveStats(g,{level,star,equipment});
 const nextLevel=level>=60?current:getGeneralEffectiveStats(g,{level:level+1,star,equipment});
 const nextStar=star>=6?current:getGeneralEffectiveStats(g,{level,star:star+1,equipment});
 const power=getGeneralCombatPower(current),levelPower=getGeneralCombatPower(nextLevel),starPower=getGeneralCombatPower(nextStar);
 const delta=(value:number,base:number)=>value>base?'+'+(value-base):'0';
 return <div style={{background:'#141923',border:'1px solid #2a3345',borderRadius:12,padding:14,display:'grid',gap:8}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><b style={{fontSize:18}}>★{star} {g.name}</b><div style={{fontSize:12,color:'#9aa6b8'}}>{g.title} · {g.role}</div></div><b>Lv.{level}</b></div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,fontSize:12}}><span>HP <b>{current.hp}</b></span><span>공격 <b>{current.atk}</b></span><span>방어 <b>{current.defense}</b></span></div>
  <div style={{padding:'8px 10px',borderRadius:9,background:'#101722',border:'1px solid #273247',display:'grid',gap:5}}>
   <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span>종합 전투력</span><b>{power.toLocaleString()}</b></div>
   <div style={{fontSize:11,color:'#9aa6b8'}}>레벨업 → {level>=60?'MAX':levelPower.toLocaleString()+' ('+delta(levelPower,power)+')'} · 성급 돌파 → {star>=6?'MAX':starPower.toLocaleString()+' ('+delta(starPower,power)+')'}</div>
  </div>
  <div style={{fontSize:12,color:'#b9c7d9'}}>조각 {fragments}/{star>=6?0:starNeed(star)}{star>=6?' · 최대 성급':''}</div>
  <div style={{display:'flex',gap:7,flexWrap:'wrap'}}><button disabled={disabled||level>=60} onClick={onLevelUp} style={{padding:'8px 10px',borderRadius:8,border:'1px solid #3a4760',background:'#202a3c',color:'#fff',cursor:disabled||level>=60?'not-allowed':'pointer'}}>{level>=60?'Lv.60 최대':`레벨업 · ${levelCost(level)}🪙 + ${levelMaterials(level)}🧱`}</button><button disabled={disabled||star>=6||fragments<starNeed(star)} onClick={onStarUp} style={{padding:'8px 10px',borderRadius:8,border:'1px solid #705b2b',background:'#30291b',color:'#fff',cursor:disabled||star>=6||fragments<starNeed(star)?'not-allowed':'pointer'}}>{star>=6?'★6 최대':`성급 돌파 · ${starNeed(star)} 조각`}</button></div>
 </div>;
}
export default function GeneralGrowthPanel(){
 const[open,setOpen]=useState(false),[save,setSave]=useState<Save>(readSave()),[message,setMessage]=useState('');
 const owned=useMemo(()=>new Set(Array.isArray(save.owned)?save.owned.filter((x):x is string=>typeof x==='string'):[]),[save.owned]);
 const levels=mapOf(save.generalLevels),stars=mapOf(save.stars),fragments=mapOf(save.fragments),accountLevel=Math.max(1,Number(save.level)||1),gold=Math.max(0,Number(save.gold)||0),materials=Math.max(0,Number(save.materials)||0),equipment=save.equipment??{};
 const generals=GENERALS.filter(g=>owned.has(g.id));
 const refresh=()=>setSave(readSave());
 const update=(id:string,nextLevel:number,nextStar:number,frag:number,costGold=0,costMat=0)=>{const next={...save,gold:gold-costGold,materials:materials-costMat,generalLevels:{...levels,[id]:nextLevel},stars:{...stars,[id]:nextStar},fragments:{...fragments,[id]:frag}};localStorage.setItem(KEY,JSON.stringify(next));setSave(next)};
 const upLevel=(g:General)=>{const level=Math.max(1,Number(levels[g.id])||accountLevel);if(level>=60)return setMessage(`${g.name}은(는) Lv.60입니다.`);const cost=levelCost(level),mat=levelMaterials(level);if(gold<cost)return setMessage(`금화 부족 · ${cost.toLocaleString()} 필요`);if(materials<mat)return setMessage(`강화 재료 부족 · ${mat}개 필요`);update(g.id,level+1,Math.max(1,Number(stars[g.id])||1),Math.max(0,Number(fragments[g.id])||0),cost,mat);setMessage(`${g.name} Lv.${level} → Lv.${level+1}`)};
 const upStar=(g:General)=>{const star=Math.max(1,Math.min(6,Number(stars[g.id])||1)),need=starNeed(star),frag=Math.max(0,Number(fragments[g.id])||0);if(star>=6)return setMessage(`${g.name}은(는) ★6입니다.`);if(frag<need)return setMessage(`${g.name} 성급 돌파에 조각 ${need-frag}개가 더 필요합니다.`);const level=Math.max(1,Number(levels[g.id])||accountLevel);update(g.id,level,star+1,frag-need);setMessage(`${g.name} ★${star} → ★${star+1} · 조각 -${need}`)};
 useEffect(()=>{if(!open)return;const t=window.setInterval(refresh,700);return()=>window.clearInterval(t)},[open]);
 return <><button onClick={()=>{refresh();setMessage('');setOpen(true)}} style={{position:'fixed',right:70,bottom:18,zIndex:1200,padding:'10px 14px',borderRadius:10,border:'1px solid #4b5d79',background:'#182235',color:'#fff',fontWeight:700,cursor:'pointer',boxShadow:'0 8px 24px rgba(0,0,0,.35)'}}>📈 장수 성장</button>{open&&<div role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}} style={{position:'fixed',inset:0,zIndex:1199,background:'rgba(5,8,13,.78)',display:'flex',justifyContent:'center',alignItems:'center',padding:18}}><section style={{width:'min(980px,96vw)',maxHeight:'88vh',overflow:'auto',background:'#0d121b',border:'1px solid #324057',borderRadius:16,padding:18,color:'#fff',boxShadow:'0 20px 60px rgba(0,0,0,.45)'}}><header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:14}}><div><small style={{color:'#91a0b8'}}>GENERAL GROWTH</small><h2 style={{margin:'3px 0'}}>장수 성장 관리</h2><div style={{fontSize:12,color:'#a9b4c5'}}>계정 Lv.{accountLevel} · 🪙 {gold.toLocaleString()} · 🧱 {materials.toLocaleString()}</div></div><button onClick={()=>setOpen(false)} aria-label="닫기" style={{border:0,background:'transparent',color:'#fff',fontSize:22,cursor:'pointer'}}>✕</button></header>{message&&<div style={{padding:'9px 11px',marginBottom:12,borderRadius:9,background:'#182235',color:'#c6d4eb',fontSize:13}}>{message}</div>}{generals.length===0?<p>보유한 장수가 없습니다.</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:10}}>{generals.map(g=><GrowthCard key={g.id} g={g} level={Math.max(1,Number(levels[g.id])||accountLevel)} star={Math.max(1,Math.min(6,Number(stars[g.id])||1))} fragments={Math.max(0,Number(fragments[g.id])||0)} equipment={equipment[g.id]} onLevelUp={()=>upLevel(g)} onStarUp={()=>upStar(g)} disabled={!owned.has(g.id)}/>)}</div>}</section></div>}</>;
}
