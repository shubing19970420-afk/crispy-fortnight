// Original generated toy-piano loop. One reusable context/buffer, no timers or downloads.
export class Music {
  enabled = false;
  private context?: AudioContext;
  private source?: AudioBufferSourceNode;
  private buffer?: AudioBuffer;
  unlock() {
    if (!this.enabled || document.hidden) return;
    try {
      const c = this.context ??= new AudioContext();
      void c.resume();
      if (this.source) return;
      if (!this.buffer) {
        const rate = 22050, duration = 16;
        this.buffer = c.createBuffer(1, rate * duration, rate);
        const data = this.buffer.getChannelData(0);
        const notes = [60,64,67,72,69,67,64,62,60,64,67,76,72,67,64,62];
        notes.forEach((note, beat)=>{
          const hz=440*2**((note-69)/12);
          for(let n=0;n<rate*1.6;n++) {
            const at=beat*rate+n;if(at>=data.length)break;
            const t=n/rate, envelope=Math.min(1,t/.025)*Math.exp(-3*t)*Math.min(1,(1.6-t)/.1);
            data[at]+=.035*envelope*(Math.sin(2*Math.PI*hz*t)+.2*Math.sin(4*Math.PI*hz*t));
          }
        });
      }
      this.source=c.createBufferSource();this.source.buffer=this.buffer;this.source.loop=true;this.source.connect(c.destination);this.source.start();
    } catch { /* Audio unavailable: visuals and physics continue. */ }
  }
  toggle() { this.enabled=!this.enabled;if(this.enabled)this.unlock();else this.stop(); }
  private stop() {this.source?.stop();this.source?.disconnect();this.source=undefined;}
  visibility() {if(document.hidden){void this.context?.suspend();}else if(this.enabled)this.unlock();}
  dispose() {this.stop();void this.context?.close();}
  get playing() {return !!this.source&&this.context?.state==='running';}
}
