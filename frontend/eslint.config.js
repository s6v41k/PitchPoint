import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfig([
  { files: ['**/*.{js,mjs,jsx,vue}'] },
  globalIgnores(['**/dist/**', '**/node_modules/**']),
  { languageOptions: { globals: { ...globals.browser } } },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    rules: {
      // The multi-word rule exists to stop a component name from ever
      // colliding with a current or future native HTML element. Navbar,
      // Footer and Toast are each mounted exactly once from App.vue and
      // aren't (and won't become) real HTML tags, so they're an accepted
      // exception rather than a rename-everywhere exercise.
      'vue/multi-word-component-names': ['error', { ignores: ['Navbar', 'Footer', 'Toast'] }],
    },
  },
  // Turns off every ESLint rule that would fight Prettier over
  // formatting (spacing, quotes, line length, ...) — Prettier owns
  // formatting, ESLint owns catching actual bugs.
  skipFormatting,
])
