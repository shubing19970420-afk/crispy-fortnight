import assert from 'node:assert/strict';
import * as T from 'three';
import {ShotFeedback} from '../src/shot-feedback';
import {Sound} from '../src/audio';
import {levels} from '../src/levels';
import {createBall,shoot,step,STEP} from '../src/physics';

for(const [index,angle,power] of [[1,-1.06,125],[3,-.41,95],[4,0,110]]){
  const root=new T.Group(),fx=new ShotFeedback(root),ball=createBall(levels[index]);
  const pool=fx.root.children.length;
  shoot(ball,Math.cos(angle)*power,Math.sin(angle)*power);
  let contacts=0,transfers=0;
  for(let i=0;i<5000&&ball.state==='moving';i++){
    const old=ball.bounces,previous=ball.teleports||0;step(ball,levels[index]);
    if(ball.bounces>old){fx.contact(ball);contacts++;}
    if((ball.teleports||0)>previous){fx.teleport(levels[index],1);transfers++;}
    fx.update(ball,STEP);
    assert.equal(fx.root.children.length,pool,'fixed pool never grows');
    for(const mesh of fx.root.children){assert.ok(mesh.position.toArray().every(Number.isFinite));assert.ok(mesh.scale.toArray().every(Number.isFinite));}
  }
  assert.equal(ball.state,'won');assert.ok(contacts>0);
  if(index===4)assert.equal(transfers,1);
  fx.update(ball,1);assert.ok(fx.root.children.every(o=>!o.visible),'all shot effects expire');
  const fresh=new ShotFeedback(new T.Group());assert.ok(fresh.root.children.every(o=>!o.visible),'fresh retry starts empty');
}

const frequencies:number[]=[],voices:{stopped:boolean}[]=[];
class FakeContext {
  currentTime=0;destination={};resume(){return Promise.resolve();}
  createOscillator(){const v={stopped:false,type:'sine',frequency:{setValueAtTime(f:number){frequencies.push(f);},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){v.stopped=true;},onended:null};voices.push(v);return v;}
  createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
}
(globalThis as unknown as {AudioContext:unknown}).AudioContext=FakeContext;
const sound=new Sound();
for(const t of [0,.2,.4,.6,.8])sound.impact('wood',.8,t);
assert.equal(frequencies.length,5);assert.ok(frequencies[0]<frequencies[1]&&frequencies[1]<frequencies[2]);assert.equal(frequencies[3],frequencies[4],'pitch capped at four steps');
sound.impact('wood',.8,.81);assert.equal(frequencies.length,5,'debounce tiny repeat contacts');
sound.reset();sound.impact('wood',.8,0);assert.equal(frequencies.at(-1),frequencies[0],'retry resets combo');
sound.toggle();const count=frequencies.length;sound.impact('stone',1,.3);sound.play('portal');assert.equal(frequencies.length,count,'mute blocks all feedback audio');assert.ok(voices.every(v=>v.stopped),'reset stops scheduled sounds');
console.log('PASS feedback: actual forest/windmill/portal wins, bounded pools, finite transforms, effect expiry, clean retry, capped audio combo, debounce and mute');
