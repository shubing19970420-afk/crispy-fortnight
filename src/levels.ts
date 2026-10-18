export type Surface =
  "wood" | "stone" | "leaves" | "fabric" | "person" | "rubber";
export type Rect = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  model: "fence" | "cabinet" | "desk-leg" | "portal-post";
  surface: Surface;
  label?: string;
};
export type Circle = {
  id: string;
  x: number;
  y: number;
  r: number;
  model: "tree" | "rock" | "stump" | "chair" | "palm";
  surface: Surface;
};
export type Desk = { x: number; y: number; w: number; h: number };
export type Walker = {
  x: number;
  y: number;
  amplitude: number;
  period: number;
  r: number;
};
export type Platform = {x:number;y:number;w:number;h:number;outline?:{x:number;y:number}[]};
export type Rotor = {x:number;y:number;length:number;width:number;arms:number;omega:number;phase:number};
export type Portal = {x:number;y:number;angle:number;r:number};
export type Level = {
  rotor?: Rotor;
  portals?: [Portal,Portal];
  platforms?: Platform[];
  name: string;
  subtitle: string;
  hint: string;
  start: { x: number; y: number };
  hole: { x: number; y: number };
  obstacles: Rect[];
  circles: Circle[];
  office?: boolean;
  forest?: boolean;
  desks?: Desk[];
  walker?: Walker;
  fairway?: { x: number; y: number }[];
};
export const WIDTH = 900,
  HEIGHT = 560;
const tree = (id: string, x: number, y: number, r = 14): Circle => ({
  id,
  x,
  y,
  r,
  model: "tree",
  surface: "leaves",
});
const rock = (id: string, x: number, y: number, r = 23): Circle => ({
  id,
  x,
  y,
  r,
  model: "rock",
  surface: "stone",
});
const desks: Desk[] = [
  { x: 200, y: 155, w: 245, h: 145 },
  { x: 610, y: 295, w: 210, h: 165 },
];
const legs: Rect[] = desks.flatMap((d, i) =>
  [0, 1].flatMap((ix) =>
    [0, 1].map((iy) => ({
      id: `desk-${i}-leg-${ix}-${iy}`,
      x: d.x + 10 + ix * (d.w - 38),
      y: d.y + 10 + iy * (d.h - 38),
      w: 18,
      h: 18,
      model: "desk-leg" as const,
      surface: "wood" as const,
    })),
  ),
);
const portalPair:[Portal,Portal]=[{x:300,y:280,angle:0,r:23},{x:650,y:150,angle:.65,r:23}];
// The tangible gate posts share the model's 9-unit footprint. The overhead
// crossbar clears the ball, while the luminous ring itself is the trigger.
const portalPosts:Rect[]=portalPair.flatMap((p,i)=>[-1,1].map(side=>{
  const offset=(p.r+10)*side;
  return {id:`portal-${i}-post-${side}`,x:p.x-Math.sin(p.angle)*offset-4.5,y:p.y+Math.cos(p.angle)*offset-4.5,w:9,h:9,model:"portal-post",surface:"rubber"};
}));
export const levels: Level[] = [
  {
    name: "就在眼前",
    subtitle: "01 / 方向与力度",
    hint: "按住白球向后拉；箭头指向出球方向，松手击球。",
    start: { x: 180, y: 280 },
    hole: { x: 650, y: 280 },
    obstacles: [],
    circles: [],
  },
  {
    name: "请走弯路",
    subtitle: "02 / 森林双折返",
    hint: "先走北侧缺口，再走南侧缺口；利用上下边墙折返。",
    forest: true,
    start: { x: 110, y: 400 },
    hole: { x: 795, y: 280 },
    fairway: [
      { x: 110, y: 400 },
      { x: 312, y: 37 },
      { x: 619, y: 523 },
      { x: 795, y: 280 },
    ],
    obstacles: [
      {
        id: "north-gate",
        x: 280,
        y: 155,
        w: 26,
        h: 377,
        model: "fence",
        surface: "wood",
      },
      {
        id: "south-gate",
        x: 560,
        y: 28,
        w: 26,
        h: 347,
        model: "fence",
        surface: "wood",
      },
    ],
    circles: [
      tree("pine-1", 90, 90, 17),
      tree("pine-2", 145, 115, 18),
      tree("pine-3", 195, 160, 17),
      tree("pine-4", 80, 225),
      tree("pine-5", 420, 75, 16),
      tree("pine-6", 445, 130, 18),
      tree("pine-7", 420, 465, 17),
      tree("pine-8", 480, 485, 16),
      tree("pine-9", 715, 85, 18),
      tree("pine-10", 780, 105, 17),
      tree("pine-11", 815, 450, 17),
      tree("pine-12", 750, 475, 16),
      rock("rock-1", 150, 230, 23),
      rock("rock-2", 390, 330, 24),
      rock("rock-3", 705, 185, 22),
      { id: "stump-1", x: 195, y: 470, r: 18, model: "stump", surface: "wood" },
      { id: "stump-2", x: 685, y: 350, r: 19, model: "stump", surface: "wood" },
    ],
  },
  {
    name: "办公室高尔夫",
    subtitle: "03 / 等同事走过，再出发",
    hint: "桌下可穿行，桌腿会反弹；同事按固定周期巡逻。",
    office: true,
    start: { x: 100, y: 430 },
    hole: { x: 785, y: 250 },
    desks,
    obstacles: [
      ...legs,
      {
        id: "cabinet-middle",
        x: 435,
        y: 285,
        w: 78,
        h: 205,
        model: "cabinet",
        surface: "wood",
      },
      {
        id: "cabinet-back",
        x: 685,
        y: 60,
        w: 135,
        h: 65,
        model: "cabinet",
        surface: "wood",
      },
      {
        id: "cabinet-left",
        x: 55,
        y: 65,
        w: 72,
        h: 130,
        model: "cabinet",
        surface: "wood",
      },
    ],
    circles: [
      {
        id: "chair-1",
        x: 330,
        y: 295,
        r: 26,
        model: "chair",
        surface: "fabric",
      },
      {
        id: "chair-2",
        x: 700,
        y: 475,
        r: 26,
        model: "chair",
        surface: "fabric",
      },
    ],
    walker: { x: 575, y: 230, amplitude: 160, period: 8, r: 20 },
  },
  {
    name: "风车捣蛋鬼", subtitle: "04 / 借风车一臂之力", hint: "观察顺时针叶片，让它把球推向旗杆。",
    start: {x:180,y:430}, hole:{x:260,y:235},
    rotor:{x:430,y:280,length:135,width:20,arms:4,omega:.5,phase:0},
    obstacles:[{id:"windmill-bank",x:65,y:300,w:210,h:22,model:"fence",surface:"wood"}],
    circles:[{id:"windmill-hub",x:430,y:280,r:21,model:"stump",surface:"wood"}],
  },
  {
    name: "不可能的一杆", subtitle: "05 / 换个方向，就有可能", hint: "借海岛挡板连续反弹，再折回球洞。",
    start:{x:110,y:280},hole:{x:740,y:390},obstacles:[...portalPosts,
      {id:"reef-east",x:810,y:190,w:16,h:280,model:"fence",surface:"rubber"},
      {id:"reef-west",x:600,y:230,w:16,h:220,model:"fence",surface:"rubber"},
      {id:"reef-south",x:600,y:475,w:226,h:16,model:"fence",surface:"rubber"},
    ],circles:[
      {id:"cliff-palm-0",x:28,y:250,r:6,model:"palm",surface:"wood"},
      {id:"cliff-palm-1",x:820,y:80,r:6,model:"palm",surface:"wood"},
      rock("shore-rock-0",340,475,8),rock("shore-rock-1",610,510,8),
    ],
    platforms:[
      {x:45,y:120,w:335,h:350,outline:[[90,115],[250,98],[345,132],[398,205],[395,365],[340,475],[150,490],[36,430],[28,250]].map(([x,y])=>({x,y}))},
      {x:540,y:65,w:315,h:440,outline:[[600,60],[730,45],[820,80],[868,160],[855,400],[790,515],[610,526],[522,400],[518,180]].map(([x,y])=>({x,y}))},
    ],
    portals:portalPair,
  },
];
