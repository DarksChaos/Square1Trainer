import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/**', 'public/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        history: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        requestAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Worker: 'readonly',
        self: 'readonly',
        performance: 'readonly',
        getComputedStyle: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        requestIdleCallback: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
      },
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-escape': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
];
