module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  // TypeScript files are type-checked by tsc (npm run lint). Skipping them here
  // because the CI eslint workflow does not install @typescript-eslint/parser.
  ignorePatterns: ['dist/', 'node_modules/', '*.ts', '*.tsx', '*.config.ts', '*.config.js'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
};
