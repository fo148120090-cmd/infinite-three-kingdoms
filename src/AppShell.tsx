import { useEffect, useRef, useState } from 'react';
import App from './App';
import BattleEngine from './BattleEngine';
import GeneralStatusModal from './GeneralStatusModal';
import GeneralGrowthPanel from './GeneralGrowthPanel';
import EquipmentPanel from './EquipmentPanel';
import './battle-engine.css';
import './general-status.css';
import { getTowerFloorRule } from './game/systems/towerRules';

const KEY='infinite-three-kingdoms-save-v2';

type SaveShape={
  floor?:number;
  gold?:number;
  gems?:number;
  level?:number;
  materials?:number;
  owned?:unknown;
  formation?:unknown;
  equipment?:unknown;
  stars?:unknown;
  fragments?:unknown;
  tsSkins?:unknown;
};

function readSave():SaveShape{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}

function migrateSave(){
  try{
    const raw=readSave();
    if(!raw || typeof raw!=='object')return;
    const num=(v:unknown,fallback:number,min=0)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,v):fallback;
    const owned=Array.isArray(raw.owned)?Array.from(new Set(raw.owned.filter((v):v is string=>typeof v==='string'))):[];
    const formation=Array.isArray(raw.formation)?Array.from(new Set(raw.formation.filter((v):v is string=>typeof v==='string'&&owned.includes(v)))).slice(0,5):[];
    const map=(v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
    const normalized={...raw,floor:Math.floor(num(raw.floor,1,1)),gold:Math.floor(num(raw.gold,5000)),gems:Math.floor(num(raw.gems,300)),level:Math.floor(num(raw.level,1,1)),materials:Math.floor(num(raw.materials,120)),owned,formation,equipment:map(raw.equipment),stars:map(raw.stars),fragments:map(raw.fragments),tsSkins:map(raw.tsSkins)};
    localStorage.setItem(KEY,JSON.stringify(normalized));
  }catch{}
}

function Settings(){
 const[open,setOpen]=useState(false),[save,setSave]=useState(readSave),refresh=()=>setSave(readSave());
 const reset=()=>{if(!window.confirm('게임 진행 데이터를 초기화할까요?'))return;localStorage.removeItem(KEY);window.location.reload()};
 useEffect(()=>{migrateSave();refresh();const timer=window.setInterval(refresh,1000);return()=>window.clearInterval(timer)},[]);
 const owned=Array.isArray(save.owned)?save.owned:[],formation=Array.isArray(save.formation)?save.formation:[],eq=save.equipment&&typeof save.equipment==='object'?Object.values(save.equipment) as Array<{level?:number}>:[],avg=eq.length?Math.round(eq.reduce((a,e)=>a+(e.level||0),0)/eq.length):0;
 return <><button className="tower-settings" aria-label="게임 설정" onClick={()=>{refresh();setOpen(true)}}>⚙️</button>{open&&<div className="tower-settings-modal" role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}><div className="tower-settings-panel"><h2>⚙️ 게임 설정</h2><div className="tower-settings-grid"><div className="tower-settings-stat"><small>천탑 진행</small><b>{save.floor||1}층</b></div><div className="tower-settings-stat"><small>계정 레벨</small><b>Lv.{save.level||1}</b></div><div className="tower-settings-stat"><small>보유 장수</small><b>{owned.length}명</b></div><div className="tower-settings-stat"><small>현재 편성</small><b>{formation.length}/5명</b></div><div className="tower-settings-stat"><small>보옥</small><b>💎 {save.gems||0}</b></div><div className="tower-settings-stat"><small>금화</small><b>🪙 {save.gold||0}</b></div><div className="tower-settings-stat"><small>강화 재료</small><b>{save.materials||0}</b></div><div className="tower-settings-stat"><small>장비 평균</small><b>+{avg}</b></div></div><p className="tower-settings-note">수동 턴제 전투 · 10×10 전장 · 랜덤 지형 · 삼국지 장수 vs 판타지 몬스터<br/>자동전투와 궁극기는 사용하지 않습니다.</p><button className="tower-settings-reset" onClick={reset}>게임 데이터 초기화</button><button className="tower-settings-close" onClick={()=>setOpen(false)}>닫기</button></div></div>}</>;
}

function TowerRewardNotice(){
 const initialFloor=Math.max(1,Math.floor(Number(readSave().floor)||1));
 const seenFloor=useRef(initialFloor);
 const[reward,setReward]=useState<{floor:number;gold:number;gems:number;materials:number;boss:boolean}|null>(null);
 useEffect(()=>{const check=()=>{const next=Math.max(1,Math.floor(Number(readSave().floor)||1));if(next<=seenFloor.current){seenFloor.current=next;return}const cleared=seenFloor.current;seenFloor.current=next;const rule=getTowerFloorRule(cleared);setReward({floor:cleared,gold:rule.reward.gold,gems:rule.reward.gems,materials:rule.reward.materials,boss:rule.kind==='boss'});};const timer=window.setInterval(check,400);return()=>window.clearInterval(timer)},[]);
 if(!reward)return null;
 return <div className="tower-reward-modal" role="dialog" aria-modal="true" aria-labelledby="tower-reward-title"><div className="tower-reward-panel"><div className="tower-reward-icon">🏆</div><small>천탑 클리어</small><h2 id="tower-reward-title">{reward.floor}층 돌파!</h2>{reward.boss&&<div className="tower-reward-boss">BOSS FLOOR CLEAR</div>}<p>획득한 보상을 확인하세요.</p><div className="tower-reward-grid"><div><b>🪙 {reward.gold.toLocaleString()}</b><span>금화</span></div><div><b>💎 {reward.gems}</b><span>보옥</span></div><div><b>🔨 {reward.materials}</b><span>강화 재료</span></div></div><button className="tower-reward-close" onClick={()=>setReward(null)}>확인</button></div></div>;
}

function BattleEngineBridge(){
 const[active,setActive]=useState(false);
 useEffect(()=>{const detect=()=>setActive(Boolean(document.querySelector('.battle-layout')));const observer=new MutationObserver(detect);observer.observe(document.body,{childList:true,subtree:true});const timer=window.setInterval(detect,400);detect();return()=>{observer.disconnect();window.clearInterval(timer)}},[]);
 return active?<div className="be-overlay"><BattleEngine/></div>:null;
}
export default function AppShell(){return <><App/><BattleEngineBridge/><Settings/><TowerRewardNotice/><GeneralStatusModal/><GeneralGrowthPanel/><EquipmentPanel/></>}
