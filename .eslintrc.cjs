module.exports = {
  "env": {
      "browser": true,
      "es2021": true
  },
  "plugins": [
    'svelte3'
  ],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3'
    }
  ],
  "extends": "eslint:recommended",
  "parserOptions": {
      "ecmaVersion": "latest",
      "sourceType": "module"
  },
  "rules": {
    "a11y-click-events-have-key-events": "off",
    "no-unused-vars": ["error", {args: "none"}],
    "no-async-promise-executor": "off",
  },
  "ignorePatterns": ["*.svg"]
}
