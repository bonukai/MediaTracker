import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: 'build',
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*'],
    },
  },
});
