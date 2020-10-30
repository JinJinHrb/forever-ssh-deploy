module.exports = {
    env: {
      browser: false,
      commonjs: true,
      es6: true,
      node: true
    },
    extends: [
    //   'airbnb-base',
      'eslint:recommended'
    ],
    rules: {
      'no-console': 0,
      'no-debugger': 0,
    },
    globals: {
      Atomics: 'readonly',
      SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
      ecmaVersion: 2018,
    }
    //, overrides: [
    //   {
    //     "files": ["src/**"],
    //     rules: {
    //       'no-console': 0,
    //       'no-unused-vars': 1,
    //       'no-debugger': 1,
    //       'no-undef': 1,
    //       'no-constant-condition': 1
    //     },
    //   }
    // ],
  };
  