import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Dev-only config that bundles the jsdom test harnesses in scripts/. */
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    ssr: true,
    outDir: 'node_modules/.smoke',
    emptyOutDir: true,
    rollupOptions: {
      input: { smoke: 'scripts/smoke.jsx', flows: 'scripts/flows.jsx', a11y: 'scripts/a11y.jsx' },
      external: ['jsdom', 'axe-core'],
      output: { entryFileNames: '[name].js' },
    },
  },
});
