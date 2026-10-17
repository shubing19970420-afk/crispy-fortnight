// Read-only presentation grading. Existing score/progress storage is never written here.
export function starsFromRecord(seconds: unknown, completed = false): number {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return completed ? 1 : 0;
  const value = Math.round(seconds * 100) / 100;
  return value <= 3 ? 3 : value <= 5 ? 2 : 1;
}
export function carvedPlaque() {
  return `<svg class="wood-prop plaque-art" viewBox="0 0 360 132" preserveAspectRatio="none" aria-hidden="true">
  <path class="plaque-side" d="m12 16 326-7 21 22-7 88-20 12-321-7L0 104 3 32Z"/>
  <path class="plaque-bevel" d="m13 7 325-6 18 20-7 86-18 13-317-5L3 98 5 24Z"/>
  <path class="plaque-front" d="m20 12 310-5 19 18-7 75-15 12-306-4L11 94l1-66Z"/>
  <path class="plaque-upper" d="m20 12 310-5 19 18-4 54-331 4-3-55Z"/>
  <path class="plaque-highlight" d="m20 16 309-5 15 15M16 29l-1 62 9 12 302 4 10-8"/>
  <path class="plaque-seam" d="m15 84 328-4"/><path class="plaque-seam-light" d="m16 87 326-4"/>
  <g class="plaque-grain"><path d="m35 30 39-1m205-5 38 1m-284 71 46 1m168-3 48-1"/><path d="M299 45q14-7 27-1-13 5-27 1Z"/></g>
  <g class="plaque-pegs"><circle cx="25" cy="61" r="3"/><circle cx="334" cy="58" r="3"/></g></svg>`;
}
export function recordMedals(seconds: unknown, completed = false) {
  const count = starsFromRecord(seconds, completed);
  const hasTime = typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0;
  const label = `通关评价 ${count} 星，共 3 星${hasTime ? `，最佳 ${seconds.toFixed(2)} 秒` : completed ? '，已通关，暂无用时记录' : '，尚未通关'}`;
  const shape = `<path class="star-side" d="m20 5 6 11 13 2-9 10 2 13-12-6-12 6 2-13-9-10 13-2Z"/><path class="star-face" d="m20 1 6 11 13 2-9 10 2 13-12-6-12 6 2-13-9-10 13-2Z"/><path class="star-light" d="M20 1v19L1 14l13-2Zm0 19 10 4 2 13-12-6Z"/><path class="star-bevel" d="m20 20-12 17 2-13Z"/><path class="star-glint" d="m17 9 3-5 4 8"/>`;
  return `<span class="medal-rack" role="img" aria-label="${label}" title="通关一星 · 最佳用时≤5秒二星 · ≤3秒三星"><svg class="rack-base" viewBox="0 0 160 48" preserveAspectRatio="none" aria-hidden="true"><path fill="var(--ui-wood-side)" d="m4 6 147-3 9 8-4 32-149 5-7-9Z"/><path fill="var(--ui-wood-bevel)" d="m5 2 145-2 8 8-5 30-147 4-6-8Z"/><path fill="var(--ui-wood-front)" stroke="var(--ui-wood-edge)" stroke-width="2" d="m8 5 139-2 7 7-4 25-140 4-6-8Z"/></svg>${[0,1,2].map(i=>`<svg class="medal-star${i<count?' earned':''}" viewBox="0 0 40 42" aria-hidden="true">${shape}</svg>`).join('')}</span>`;
}
export function solidIcon(name: 'home'|'sound'|'muted'|'settings'|'play'|'retry') {
 const paths = {
  home:'<path d="m2 11 10-9 10 9-2 2-1-1v10h-5v-7h-4v7H5V12l-1 1Z"/>',
  sound:'<path d="M2 9h5l6-5v16l-6-5H2Zm14-3c4 3 4 9 0 12l-2-2c3-2 3-6 0-8Zm4-3c6 5 6 13 0 18l-2-2c5-4 5-10 0-14Z"/>',
  muted:'<path d="M2 9h5l6-5v16l-6-5H2Zm14-1 3 3 3-3 2 2-3 3 3 3-2 2-3-3-3 3-2-2 3-3-3-3Z"/>',
  settings:'<path fill-rule="evenodd" d="m9 1 6 0 1 4 3 1 3 3-2 4 1 3-3 4-4-1-3 3-4-2-1-4-4-2 0-5 4-2 1-4Zm3 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/>',
  play:'<path d="M6 3q0-2 2-1l14 9q2 1 0 2L8 22q-2 1-2-1Z"/>',
  retry:'<path d="M5 7a9 9 0 1 1-1 11l3-2a6 6 0 1 0 1-7l4 3H2V2Z"/>',
 };
 return `<svg class="solid-prop-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${paths[name]}</svg>`;
}
export function toyFace(content: string) { return `<span class="prop-face">${content}</span>`; }
export function powerSegments() { return Array.from({length:10},(_,i)=>`<span class="power-segment" style="--segment:var(--ui-meter-${i})"></span>`).join(''); }
