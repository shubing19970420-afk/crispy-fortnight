// Original responsive prop artwork. No reference-image crops or external assets.
export function woodProp() {
  return `<svg class="wood-prop" viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden="true">
  <path fill="#976541" d="M11 12 304 9 319 24 316 105 300 119 13 115 0 101 2 28Z"/>
  <path fill="#bf8658" d="m9 8 294-6 17 15-5 82-14 14-290-5L0 94 1 22Z"/>
  <path fill="#e2b180" d="m14 3 285-3 16 15-5 79-13 10-281-5L5 87 6 18Z"/>
  <path fill="#d8a16b" d="m13 49 299-3-2 48-13 10-281-5L5 87 6 51Z"/>
  <path d="m14 7 283-3 13 13M10 20 9 85l9 10 277 5 10-9" fill="none" stroke="#f4c998" stroke-width="3"/>
  <path d="m8 51 302-4" stroke="#ac754d" stroke-width="2"/><path d="m9 54 300-4" stroke="#edbd88" stroke-width="2"/>
  <g fill="none" stroke="#ad784f" stroke-width="1.4" opacity=".36"><path d="m26 24 46-1m178-4 34 1M22 76l38 1m190 4 36-2M80 87l33-1M187 14l34 1"/><path d="M256 31c16-8 31-8 40-1-13 6-26 7-40 1Zm11 0q13-4 20 0"/><path d="M27 64q20-7 38 0-20 5-38 0Z"/></g>
  <g fill="#ac7952" stroke="#f1c595" stroke-width="1"><circle cx="20" cy="37" r="3"/><circle cx="297" cy="69" r="3"/></g></svg>`;
}
export function difficultyStars(count: number) {
  const star=`<svg viewBox="0 0 40 42" aria-hidden="true"><path fill="#bc7e32" d="m20 4 5.7 12 13 2-9.4 9.5 2.2 13L20 34.6 8.5 40.5l2.2-13L1.3 18l13-2Z"/><path fill="#f3bd47" d="m20 1 5.7 12 13 2-9.4 9.5 2.2 13L20 31.6 8.5 37.5l2.2-13L1.3 15l13-2Z"/><path fill="#ffe797" d="M20 1v20L1.3 15l13-2Zm0 20 9.3 3.5 2.2 13L20 31.6Z"/><path fill="#ffda6b" d="M20 21 8.5 37.5l2.2-13Z"/><path d="m17 10 3-6 4 9" fill="none" stroke="#fff1bd" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  return `<span class="difficulty" role="img" aria-label="难度 ${count} 星">${star.repeat(count)}</span>`;
}
export function bulbProp() {
 return `<svg class="bulb-prop" viewBox="0 0 80 100" aria-hidden="true"><ellipse cx="42" cy="91" rx="23" ry="6" fill="#355c4d" opacity=".17"/><path d="m28 73 27-1 5 15-4 7H25l-4-7Z" fill="#a8754f"/><path d="m27 72 26-1 3 13H24Z" fill="#d8a16b"/><path d="M27 47C8 27 22 6 40 6s32 21 14 41l-6 15H33Z" fill="#e7ab38" stroke="#fff0a9" stroke-width="3"/><path d="M29 43C15 27 26 11 39 10c16 0 26 17 12 33l-6 13H35Z" fill="#ffe383"/><path d="M32 16c-7 3-9 10-7 17" fill="none" stroke="#fff9d3" stroke-width="5" stroke-linecap="round"/><path d="m36 55-4-20 8 5 8-5-5 20" fill="none" stroke="#dc942c" stroke-width="3" stroke-linecap="round"/><path d="M32 60h17v7l-4 6H36l-4-6Z" fill="#a88d5c"/><path d="m33 62 15-2m-14 8 13-2" stroke="#e9d6a1" stroke-width="3"/><g class="bulb-rays" stroke="#ffe487" stroke-width="4" stroke-linecap="round"><path d="M8 23 2 20M72 23l6-3M14 7 9 2M66 7l5-5M40 0v-5"/></g></svg>`;
}
