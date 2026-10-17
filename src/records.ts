export type Victory = { seconds:number; best:number; kind:'first'|'record'|'success' };
export function victory(seconds:number, previous:unknown):Victory {
  const now=Math.round(seconds*100)/100;
  const old=typeof previous==='number' && Number.isFinite(previous) && previous>0 ? Math.round(previous*100)/100 : null;
  return {seconds:now,best:old===null?now:Math.min(now,old),kind:old===null?'first':now<old?'record':'success'};
}
export function readScores(raw:string|null):Record<string,number> {
  try { const v=JSON.parse(raw||'{}'); if(!v || typeof v!=='object' || Array.isArray(v)) return {}; const scores:Record<string,number>={};
    for(const key of ['0','1','2','3','4']) if(typeof v?.[key]==='number' && Number.isFinite(v[key]) && v[key]>0) scores[key]=v[key];
    return scores;
  } catch {return {};}
}
