import { findOfficeRoute } from './route-hints';
import type { Level } from './levels';
self.onmessage=(e:MessageEvent<{level:Level;time:number;generation:number}>)=>{
  const {level,time,generation}=e.data;
  self.postMessage({route:findOfficeRoute(level,time),time,generation});
};
