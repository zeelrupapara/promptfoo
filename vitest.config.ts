export default {
    // Enable Vitest's TypeScript support
    typescript: {
      enable: true,
      // Use the same transform as Jest
      transform: {
        '^.+\\.(t|j)sx?$': 'ts-jest',
      },
    },
    // Enable Vitest's Jest compatibility mode
    // jestCompat: true,
    // Global settings
    globals: {
      // Enable ES modules
      esm: true,
    },
    // Setup files
    setupFiles: ['./.vitest/setEnvVars.ts'],
    // Ignore patterns
    ignore: ['examples', 'node_modules', 'dist'],
    // Extensions to treat as ESM
    extensions: ['.ts'],
  };
