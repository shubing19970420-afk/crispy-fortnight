// Original procedural sounds; no external audio assets or downloads.
export class Sound {
  enabled = true;
  private context?: AudioContext;
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
    } catch {}
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.unlock();
    return this.enabled;
  }
  play(
    kind:
      | "shot"
      | "wood"
      | "rubber"
      | "win"
      | "stone"
      | "leaves"
      | "fabric"
      | "person",
    power = 1,
  ) {
    if (!this.enabled) return;
    this.unlock();
    const c = this.context;
    if (!c) return;
    const notes =
      kind === "win"
        ? [523, 659, 784, 1047]
        : [
            kind === "shot"
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
    notes.forEach((freq, i) => {
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
        o.frequency.exponentialRampToValueAtTime(freq * 0.45, at + 0.12);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(
        0.06 * Math.max(0.2, power),
        at + 0.008,
      );
      g.gain.exponentialRampToValueAtTime(
        0.0001,
        at + (kind === "win" ? 0.3 : 0.15),
      );
      o.connect(g);
      g.connect(c.destination);
      o.start(at);
      o.stop(at + 0.35);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    });
  }
}
