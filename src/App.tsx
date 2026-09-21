          else if(now>=(prev.deadline||now)){ended=true;result="victory";}
          else if(e.length===0){
            wave+=1;
            const pool=["Goblin","Kobold","Gnoll","Orc","Uruk","Arachne","Ogre"];
            const count=Math.min(7,2+wave);
            const defenseBaseLevel=Math.max(1,...prev.units.filter(x=>x.team==="enemy").map(x=>x.level));
            const nextEnemies=Array.from({length:count},(_,i)=>{
              const waveGrade=wave>=6?"Named":wave>=4?"Elite":"Normal";
              const defenseLevel=Math.max(1,defenseBaseLevel+((i+wave)%3)-1);
              const m=scaleMonsterForSeals(createLinedMonster(pool[(i+wave+save.floor)%pool.length],defenseLevel,waveGrade,i,save.monsterLineages),save.sealCount||0);
              return asEnemy({...m,pos:8.2+i*.55},"-w"+wave);
            });