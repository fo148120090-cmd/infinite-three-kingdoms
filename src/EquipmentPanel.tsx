import { useEffect, useMemo, useState } from 'react';
import { GENERALS } from './game/data/generals';
import type { General } from './game/types';

const KEY='infinite-three-kingdoms-save-v2';
type Equip={level?:number;rarity?:number;equipped?:boolean;optionA?:number;optionB?:number};
type Save={gold?:number;materials?:number;owned?:unknown;equipment?:unknown};
const optionName=(v:number|undefined)=>['공격력','최대HP','치명타','스킬 위력'][v??0]??'없음';
const rarityName=(v:number|undefined)=>['','일반','고급','희귀','영웅','전설'][Math.max(1,Math.min(5,Number(v)||1))];
const rarityFor=(level:number)=>level>=15?5:level>=10?4:level>=5?3:level>=3?2:1;
const levelCost=(level:number)=>level*250;
const levelMaterials=(level:number)=>level*2;
const optionValue=(kind:number,level:number)=>kind===0?level*2:kind===1?level*5:kind===2?Math.floor(level/2):level;
function readSave():Save{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function asMap(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,Equip>:{} }
function EquipmentCard({g,e,onEnhance,onToggle,disabled}:{g:General;e:Equip;onEnhance:()=>void;onToggle:()=>void;disabled:boolean}){
 const level=Math.max(0,Number(e.level)||0),rarity=Math.max(1,Math.min(5,Number(e.rarity)||rarityFor(level))),optionA=Number.isInteger(e.optionA)?Number(e.optionA):0,optionB=Number.isInteger(e.optionB)?Number(e.optionB):1;
 const nextLevel=level+1,cost=levelCost(nextLevel),materials=levelMaterials(nextLevel);
 return <div style={{background:'#141923',border:'1px solid #2a3345',borderRadius:12,padding:14,display:'grid',gap:8}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><b style={{fontSize:17}}>{g.equipment}</b><div style={{fontSize:12,color:'#a9b4c5'}}>{g.name} 전용 · {rarityName(rarity)} · +{level}</div></div><button onClick={onToggle} disabled={disabled} style={{padding:'6px 9px',borderRadius:8,border:'1px solid #3a4760',background:e.equipped===false?'#271d1d':'#1d2b22',color:'#fff',cursor:disabled?'not-allowed':'pointer'}}>{e.equipped===false?'미장착':'장착 중'}</button></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,fontSize:12}}><span>옵션 A <b>{optionName(optionA)} +{optionValue(optionA,level)}</b></span><span>옵션 B <b>{optionName(optionB)} +{optionValue(optionB,level)}</b></span></div><button onClick={onEnhance} disabled={disabled||level>=20} style={{padding:'9px 11px',borderRadius:8,border:'1px solid #705b2b',background:level>=20?'#27231c':'#30291b',color:'#fff',fontWeight:700,cursor:disabled||level>=20?'not-allowed':'pointer'}}>{level>=20?'장비 Lv.20 최대':`강화 +${level} → +${nextLevel} · ${cost.toLocaleString()}🪙 + ${materials}🧱`}</button></div>;
}
export default function EquipmentPanel(){
 const[open,setOpen]=useState(false),[save,setSave]=useState<Save>(readSave()),[message,setMessage]=useState('');
 const owned=useMemo(()=>new Set(Array.isArray(save.owned)?save.owned.filter((x):x is string=>typeof x==='string'):[]),[save.owned]);
 const equipment=asMap(save.equipment),gold=Math.max(0,Number(save.gold)||0),materials=Math.max(0,Number(save.materials)||0),generals=GENERALS.filter(g=>owned.has(g.id));
 const refresh=()=>setSave(readSave());
 const equipOf=(g:General):Equip=>equipment[g.id]??{level:0,rarity:1,equipped:true,optionA:0,optionB:1};
 const enhance=(g:General)=>{const e=equipOf(g),level=Math.max(0,Number(e.level)||0);if(level>=20)return setMessage(`${g.name} 전용장비는 Lv.20입니다.`);const cost=levelCost(level+1),mat=levelMaterials(level+1);if(gold<cost)return setMessage(`금화 부족 · ${cost.toLocaleString()} 필요`);if(materials<mat)return setMessage(`강화 재료 부족 · ${mat}개 필요`);const nextLevel=level+1,next={...save,gold:gold-cost,materials:materials-mat,equipment:{...equipment,[g.id]:{...e,level:nextLevel,rarity:rarityFor(nextLevel),equipped:e.equipped!==false,optionA:Number.isInteger(e.optionA)?e.optionA:0,optionB:Number.isInteger(e.optionB)?e.optionB:1}}};localStorage.setItem(KEY,JSON.stringify(next));setSave(next);setMessage(`${g.name} ${g.equipment} +${level} → +${nextLevel}`)};
 const toggle=(g:General)=>{const e=equipOf(g),next={...save,equipment:{...equipment,[g.id]:{...e,equipped:e.equipped===false}}};localStorage.setItem(KEY,JSON.stringify(next));setSave(next);setMessage(`${g.name} 전용장비 ${e.equipped===false?'장착':'해제'}`)};
 useEffect(()=>{if(!open)return;const t=window.setInterval(refresh,700);return()=>window.clearInterval(t)},[open]);
 return <><button onClick={()=>{refresh();setMessage('');setOpen(true)}} style={{position:'fixed',right:188,bottom:18,zIndex:1200,padding:'10px 14px',borderRadius:10,border:'1px solid #705b2b',background:'#2a2417',color:'#fff',fontWeight:700,cursor:'pointer',boxShadow:'0 8px 24px rgba(0,0,0,.35)'}}>🔨 장비 강화</button>{open&&<div role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}} style={{position:'fixed',inset:0,zIndex:1199,background:'rgba(5,8,13,.78)',display:'flex',justifyContent:'center',alignItems:'center',padding:18}}><section style={{width:'min(980px,96vw)',maxHeight:'88vh',overflow:'auto',background:'#0d121b',border:'1px solid #324057',borderRadius:16,padding:18,color:'#fff',boxShadow:'0 20px 60px rgba(0,0,0,.45)'}}><header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:14}}><div><small style={{color:'#c4a75d'}}>EQUIPMENT FORGE</small><h2 style={{margin:'3px 0'}}>장비 강화</h2><div style={{fontSize:12,color:'#a9b4c5'}}>🪙 {gold.toLocaleString()} · 🧱 {materials.toLocaleString()} · 강화 최대 +20</div></div><button onClick={()=>setOpen(false)} aria-label="닫기" style={{border:0,background:'transparent',color:'#fff',fontSize:22,cursor:'pointer'}}>✕</button></header>{message&&<div style={{padding:'9px 11px',marginBottom:12,borderRadius:9,background:'#182235',color:'#c6d4eb',fontSize:13}}>{message}</div>}{generals.length===0?<p>보유한 장수가 없습니다.</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:10}}>{generals.map(g=><EquipmentCard key={g.id} g={g} e={equipOf(g)} onEnhance={()=>enhance(g)} onToggle={()=>toggle(g)} disabled={!owned.has(g.id)}/>)}</div>}</section></div>}</>;
}
