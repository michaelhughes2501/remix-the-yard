module.exports = {
  env: {
    browser: true,
    es2022: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  // TypeScript files are type-checked by tsc (npm run lint). Skipping them here
  // because the CI eslint workflow does not install @typescript-eslint/parser.
  ignorePatterns: ['dist/', 'node_modules/', '*.ts', '*.tsx', '*.config.ts', '*.config.js'],
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
};
