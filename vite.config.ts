import { defineConfig } from 'vite';

// In-memory level navigation needs no server rewrites. Relative asset URLs work
// both at / and at GitHub Pages' /crispy-fortnight/ project prefix.
export default defineConfig({ base: './' });
