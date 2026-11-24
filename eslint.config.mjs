import js from "@eslint/js";
import globals from "globals";
import hooks from "eslint-plugin-react-hooks";
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      ".local-*/**",
      "server/db/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" },
      ],
    },
  },
  { files: ["server/**/*.js"], languageOptions: { sourceType: "commonjs" } },
  {
    files: ["client/src/**/*.{js,jsx}"],
    plugins: { "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
