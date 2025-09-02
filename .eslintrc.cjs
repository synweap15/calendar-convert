module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true, jest: true },
  settings: { react: { version: 'detect' } },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    curly: ['error', 'all'],
    'arrow-body-style': ['error', 'always'],
    'react/react-in-jsx-scope': 'off',
    // Formatting rules are delegated to Prettier
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['**/*.test.*', '**/vitest.setup.*'],
      env: { jest: true },
      globals: { describe: 'readonly', it: 'readonly', expect: 'readonly' },
    },
  ],
};
