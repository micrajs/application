import {cwd} from '@micra/vite-config/utilities/cwd';
import {defineConfig} from '@micra/vite-config/library';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: cwd('index.ts'),
        sync: cwd('sync.ts'),
      },
      external: [
        '@micra/configuration',
        '@micra/environment',
        '@micra/error',
        '@micra/event-emitter',
        '@micra/service-container',
      ],
    },
  },
});
