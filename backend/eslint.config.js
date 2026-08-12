const { defineConfig, globalIgnores } = require('eslint/config')
const globals = require('globals')
const js = require('@eslint/js')
const eslintConfigPrettier = require('eslint-config-prettier')

module.exports = defineConfig([
  globalIgnores(['node_modules/**']),
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', args: 'after-used' }],
    },
  },
  // Turns off every ESLint rule that would fight Prettier over
  // formatting (spacing, quotes, line length, ...) — Prettier owns
  // formatting, ESLint owns catching actual bugs.
  eslintConfigPrettier,
])
