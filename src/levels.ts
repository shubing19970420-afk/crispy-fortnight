export type Rect = {x:number;y:number;w:number;h:number;label?:string;color?:string};
export type Level = {name:string;subtitle:string;hint:string;start:{x:number;y:number};hole:{x:number;y:number};obstacles:Rect[];office?:boolean};
export const WIDTH=900, HEIGHT=560;
export const levels:Level[]=[
 {name:'就在眼前',subtitle:'01 / 找到恰好的力量',hint:'按住白球，向后拉，再松手。力度不必太大。',start:{x:180,y:280},hole:{x:650,y:280},obstacles:[]},
 {name:'请走弯路',subtitle:'02 / 墙壁也是你的球杆',hint:'直线被挡住了。试试向右上方击球，借上边墙反弹。',start:{x:180,y:360},hole:{x:720,y:360},obstacles:[{x:420,y:230,w:60,h:280,label:'隔墙',color:'#71897d'}]},
 {name:'办公室高尔夫',subtitle:'03 / 今天的会议：一杆归洞',hint:'笔记本挡在中间。桌沿可以反弹，文具不会移动。',start:{x:150,y:390},hole:{x:740,y:340},office:true,obstacles:[{x:390,y:220,w:100,h:280,label:'IDEAS',color:'#e99b78'},{x:170,y:100,w:180,h:22,label:'铅笔',color:'#e5be58'},{x:610,y:100,w:100,h:55,label:'橡皮',color:'#b7abc9'}]}
];
