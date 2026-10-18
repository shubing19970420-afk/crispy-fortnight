// One persistent player across menus, levels and retries.
export class Music {
  enabled = true;
  private audio = new Audio(`${import.meta.env.BASE_URL}audio/background.mp3`);
  private fade?: number;
  constructor() {
    this.audio.loop = true;
    this.audio.preload = "metadata";
    this.audio.volume = 0;
  }
  unlock() {
    if (!this.enabled || document.hidden || !this.audio.paused) return;
    this.audio.volume = 0;
    void this.audio.play().then(() => {
      if (!this.enabled || document.hidden) { this.stop(); return; }
      this.clearFade();
      const start = performance.now();
      const tick = () => {
        this.audio.volume = Math.min(.22, (performance.now() - start) / 1200 * .22);
        if (this.audio.volume < .22) this.fade = requestAnimationFrame(tick);
      };
      this.fade = requestAnimationFrame(tick);
    }).catch(() => { /* Retry on the next user interaction. */ });
  }
  toggle() { this.enabled = !this.enabled; if (this.enabled) this.unlock(); else this.stop(); }
  private clearFade() { if (this.fade !== undefined) cancelAnimationFrame(this.fade); this.fade = undefined; }
  private stop() { this.clearFade(); this.audio.pause(); }
  visibility() { if (document.hidden) this.stop(); else if (this.enabled) this.unlock(); }
  dispose() { this.stop(); this.audio.removeAttribute("src"); this.audio.load(); }
  get playing() { return !this.audio.paused && !this.audio.ended; }
}
