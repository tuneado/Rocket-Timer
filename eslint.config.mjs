import js from '@eslint/js';

// Marks names used in JSX as used, so no-unused-vars only reports real unused code:
// components (<Toolbar />, <Foo.Bar />) and the Preact pragma (h, and Fragment for <>).
// Same idea as eslint-plugin-react's jsx-uses-vars / jsx-uses-react, without the dependency.
const jsxUsage = {
  rules: {
    'uses-vars': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        const mark = (name, node) => context.sourceCode.markVariableAsUsed(name, node);
        return {
          JSXOpeningElement(node) {
            mark('h', node);
            let name = node.name;
            while (name.type === 'JSXMemberExpression') name = name.object;
            if (name.type === 'JSXIdentifier') mark(name.name, node);
          },
          JSXOpeningFragment(node) {
            mark('h', node);
            mark('Fragment', node);
          },
        };
      },
    },
  },
};

export default [
  js.configs.recommended,
  {
    files: ['src/main/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        // Node.js
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        global: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-constant-condition': 'warn',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-case-declarations': 'warn',
      'eqeqeq': ['warn', 'smart'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-empty': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['src/renderer/**/*.jsx'],
    plugins: { jsx: jsxUsage },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Browser
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        HTMLElement: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Image: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        MediaStream: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLVideoElement: 'readonly',
        performance: 'readonly',
        WebSocket: 'readonly',
        Audio: 'readonly',
        URLSearchParams: 'readonly',
        getComputedStyle: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        customElements: 'readonly',
      },
    },
    rules: {
      'jsx/uses-vars': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-constant-condition': 'warn',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'eqeqeq': ['warn', 'smart'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['src/renderer/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser APIs
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        HTMLElement: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Image: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        MediaStream: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLVideoElement: 'readonly',
        performance: 'readonly',
        WebSocket: 'readonly',
        Audio: 'readonly',
        URLSearchParams: 'readonly',
        getComputedStyle: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        customElements: 'readonly',
        // Project runtime globals (loaded via script tags / preload)
        LayoutRegistry: 'readonly',
        LayoutEditorState: 'readonly',
        CanvasPreview: 'readonly',
        UnifiedCanvasRenderer: 'readonly',
        appState: 'readonly',
        logger: 'readonly',
        ipcRenderer: 'readonly',
        statusBar: 'readonly',
        // UMD / Node interop (some renderer files use module.exports)
        module: 'readonly',
        process: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-constant-condition': 'warn',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-case-declarations': 'warn',
      'no-prototype-builtins': 'warn',
      'no-empty': 'warn',
      'eqeqeq': ['warn', 'smart'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'prefer-const': 'warn',
    },
  },
  {
    // Shared core: plain ES modules with no Electron, Node or DOM globals (the
    // display folder below adds browser APIs), so the same code runs on desktop
    // and in other shells (e.g. iOS)
    files: ['src/core/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'eqeqeq': ['warn', 'smart'],
      'no-eval': 'error',
      'prefer-const': 'warn',
      // Keep the core free of Electron and of app-shell code: what it needs from
      // the shell goes through platform.js or constructor options
      'no-restricted-imports': ['error', {
        paths: [{ name: 'electron', message: 'src/core must not depend on Electron; use src/core/platform.js.' }],
        patterns: [{
          group: ['**/main/**', '**/preload/**', '**/renderer/**'],
          message: 'src/core must not import app-shell code; pass it in through src/core/platform.js or options.',
        }],
      }],
      'no-restricted-properties': ['error',
        { object: 'window', property: 'electron', message: 'src/core must not use the preload bridge; use src/core/platform.js.' },
        { object: 'globalThis', property: 'electron', message: 'src/core must not use the preload bridge; use src/core/platform.js.' },
      ],
    },
  },
  {
    // Core display code (canvas renderer, layouts, display state): runs in a web
    // page or web view on every platform, so standard browser APIs are allowed
    files: ['src/core/display/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        getComputedStyle: 'readonly',
        Image: 'readonly',
      },
    },
    rules: {
      'no-constant-condition': 'warn',
      'no-case-declarations': 'warn',
      'no-prototype-builtins': 'warn',
      'no-empty': 'warn',
    },
  },
  {
    files: ['src/preload/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
    },
  },
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'src/renderer/dist/**',
      'coverage/**',
    ],
  },
];
