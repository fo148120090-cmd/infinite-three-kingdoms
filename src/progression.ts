export type ProgressionState = {
  level: Record<string, number>;
  stars: Record<string, number>;
  shards: Record<string, number>;
  equipmentLevel: Record<string, number>;
  summonCount: number;
};

export const levelCost = (level:number) => level * 300;
export const equipmentCost = (level:number) => (level + 1) * 500;
export const levelHpBonus = (level:number) => Math.max(0, level - 1) * 10;
export const levelAtkBonus = (level:number) => Math.max(0, level - 1) * 3;
export const equipmentAtkBonus = (level:number) => level * 4;

export function addDuplicateShards(shards:Record<string,number>, generalId:string, amount:number){
  return {...shards,[generalId]:(shards[generalId]||0)+amount};
}

export function promoteStars(stars:Record<string,number>, shards:Record<string,number>, generalId:string){
  const current=stars[generalId]||3;
  if(current>=6 || (shards[generalId]||0)<50) return {stars,shards,success:false};
  return {
    stars:{...stars,[generalId]:current+1},
    shards:{...shards,[generalId]:(shards[generalId]||0)-50},
    success:true,
  };
}
