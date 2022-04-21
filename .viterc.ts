import {defineConfig} from '@micra/vite-config/library';

export default defineConfig({
  build: {
    rollupOptions: {
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
