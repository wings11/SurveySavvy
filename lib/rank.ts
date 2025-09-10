export interface RankThreshold { level:number; min:number; name:string }

export const RANKS: RankThreshold[] = [
  { level:1, min:0, name:'Curious Novice' },
  { level:2, min:120, name:'Inquisitive Apprentice' },
  { level:3, min:360, name:'Data Disciple' },
  { level:4, min:800, name:'Survey Scholar' },
  { level:5, min:1600, name:'Methodologist' },
  { level:6, min:2800, name:'Analytic Fellow' },
  { level:7, min:4500, name:'Academic Luminary' },
  { level:8, min:15000, name:'Arch Chancellor of Inquiry' },
];

export function computeRankLevel(points:number){
  let lvl = 1;
  for(const r of RANKS){
    if(points >= r.min) lvl = r.level;
  }
  return lvl;
}
