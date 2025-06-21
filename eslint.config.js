import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: ['dist', 'node_modules']
  },
  // Configuration pour les fichiers Node.js (vite.config.js)
  {
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        __dirname: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules
    }
  },
  // Configuration pour les scripts background
  {
    files: ['src/background/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        chrome: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        btoa: 'readonly',
        FileReader: 'readonly',
        createImageBitmap: 'readonly',
        OffscreenCanvas: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        alert: 'readonly',
        requestAnimationFrame: 'readonly',
        CustomEvent: 'readonly',
        document: 'readonly',
        window: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-empty': 'warn',
      'no-console': 'off'
    }
  },
  // Configuration pour les content scripts
  {
    files: ['src/content/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        chrome: 'readonly',
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        getComputedStyle: 'readonly',
        Image: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        CustomEvent: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-empty': 'warn',
      'no-console': 'off'
    }
  },
  // Configuration pour les fichiers React (front)
  {
    files: ['src/front/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        chrome: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        alert: 'readonly',
        Image: 'readonly',
        URL: 'readonly',
        CustomEvent: 'readonly'
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'warn',
      'no-empty': 'warn',
      'no-console': 'off',
      'react-hooks/exhaustive-deps': 'warn'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
]
