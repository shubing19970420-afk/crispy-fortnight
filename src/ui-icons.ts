// Original outline icons; no icon font or external artwork.
export type IconName = 'home' | 'sound' | 'muted' | 'settings' | 'close';
const paths: Record<IconName, string> = {
  home: '<path d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  sound: '<path d="M4 9h4l5-5v16l-5-5H4zM17 8c2 2 2 6 0 8M20 5c4 4 4 10 0 14"/>',
  muted: '<path d="M4 9h4l5-5v16l-5-5H4zM17 9l5 6m0-6-5 6"/>',
  settings: '<path d="m10 3 4 0 1 3 3 1 3 3-2 3 0 3-3 3-3-1-3 2-3-2-1-3-3-1 0-4 3-1 1-3 3-1z"/><circle cx="12" cy="12" r="3"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
};
export function icon(name: IconName) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}
