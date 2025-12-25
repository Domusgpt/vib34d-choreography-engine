import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { readdirSync } from 'fs';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const examplesDir = resolve(rootDir, 'examples');

const exampleInputs = readdirSync(examplesDir)
  .filter((entry) => entry.toLowerCase().endsWith('.html'))
  .reduce((inputs, entry) => {
    const name = entry.replace(/\.html$/i, '');
    inputs[`examples-${name.toLowerCase()}`] = resolve(examplesDir, entry);
    return inputs;
  }, {});

export default defineConfig({
  base: '/',
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        ...exampleInputs,
      },
    },
  },
});
