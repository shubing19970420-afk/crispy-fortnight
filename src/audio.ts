// Original procedural sounds; no external audio assets or downloads.
export class Sound {
  enabled = true;
  private context?: AudioContext;
  private voices=new Set<OscillatorNode>();
  private lastImpact=-Infinity;
  private combo=0;
  reset(){for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();this.lastImpact=-Infinity;this.combo=0;}
  impact(kind:"wood"|"rubber"|"stone"|"leaves"|"fabric"|"person",power:number,time:number){
    if(time-this.lastImpact<.025)return;
    this.combo=time-this.lastImpact<.75?Math.min(3,this.combo+1):0;this.lastImpact=time;
    this.play(kind,power,2**(this.combo*2/12));
  }
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
    } catch {}
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.unlock();else this.reset();
    return this.enabled;
  }
  play(
    kind:
      | "portal"
      | "shot"
      | "wood"
      | "rubber"
      | "win"
      | "stone"
      | "leaves"
      | "fabric"
      | "person",
    power = 1,
    pitch = 1,
  ) {
    if (!this.enabled) return;
    this.unlock();
    const c = this.context;
    if (!c) return;
    const notes =
      kind === "win"
        ? [523, 659, 784, 1047]
        : [
            kind === "portal" ? 660 : kind === "shot"
              ? 210
              : kind === "stone"
                ? 78
                : kind === "leaves"
                  ? 560
                  : kind === "fabric"
                    ? 110
                    : kind === "person"
                      ? 420
                      : kind === "rubber"
                        ? 330
                        : 125,
          ];
    notes.forEach((base, i) => {
      const freq=base*pitch;
      const o = c.createOscillator(),
        g = c.createGain(),
        at = c.currentTime + i * 0.105;
      o.type =
        kind === "wood" || kind === "person"
          ? "triangle"
          : kind === "stone"
            ? "square"
            : "sine";
      o.frequency.setValueAtTime(freq, at);
      if (kind !== "win")
        o.frequency.exponentialRampToValueAtTime(freq * (kind==="portal"?1.8:.45), at + 0.12);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(
        0.075 * Math.max(0.18, Math.min(1,power)),
        at + 0.008,
      );
      g.gain.exponentialRampToValueAtTime(
        0.0001,
        at + (kind === "win" ? 0.3 : 0.15),
      );
      o.connect(g);
      g.connect(c.destination);
      this.voices.add(o);
      o.start(at);
      o.stop(at + 0.35);
      o.onended = () => {
        this.voices.delete(o);
        o.disconnect();
        g.disconnect();
      };
    });
  }
}
