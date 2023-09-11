module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  plugins: ["svelte3", "@typescript-eslint"],
  overrides: [
    {
      files: ["*.svelte"],
      processor: "svelte3/svelte3",
    },
  ],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
    extraFileExtensions: [".svelte"],
  },
  settings: {
    "svelte3/typescript": require("typescript"),
  },
  rules: {
    "a11y-click-events-have-key-events": "off",
    "a11y-autofocus": "off",

    "no-unused-vars": "off",
    "no-useless-escape": "off",
    "no-async-promise-executor": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-extra-semi": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {args: "none", destructuredArrayIgnorePattern: "^_d?$"},
    ],
  },
  ignorePatterns: ["*.svg"],
}
