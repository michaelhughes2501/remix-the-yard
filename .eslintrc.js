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
  ignorePatterns: ['dist/', 'node_modules/', '*.ts', '*.tsx'],
  rules: {},
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
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
  ignorePatterns: ['dist/', 'node_modules/', '*.config.ts', '*.config.js'],
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
};
