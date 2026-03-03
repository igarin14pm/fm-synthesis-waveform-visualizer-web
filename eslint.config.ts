import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  {
    plugins: {
      "@stylistic": stylistic
    }
  },
  { 
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], 
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { globals: globals.browser } 
  },
  tseslint.configs.recommended,
  {
    rules: {
      /*
      // Possible Problems
      "no-duplicate-imports": "warn",
      "no-self-compare": "error",
      "no-template-curly-in-string": "warn",
      "no-unmodified-loop-condition": "warn",
      "no-unreachable-loop": "warn",
      // Suggestions
      "camelcase": ["warn", { "properties": "never" }],
      "class-methods-use-this": "warn",
      "curly": "error",
      "default-case-last": "error",
      "default-param-last": "warn",
      "dot-notation": ["warn", "smart"],
      "eqeqeq": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-empty": "error",
      "no-empty-functions": [
        "error", 
        { "allow": ["constructors", "privateConstructors", "protectedConstructors"] }
      ],
      "no-empty-static-block": "error",
      "no-eval": "error",
      "no-implicit-coercion": "error",
      "no-multi-assign": "error",
      "no-nested-ternary": "warn",
      "no-new": "warn",
      "no-new-func": "warn",
      "no-new-wrappers": "warn",
      "no-object-constructor": "warn",
      "no-param-reassign": "warn",
      "no-return-assign": "error",
      "no-throw-literal": "error",
      "no-unneeded-ternary": "warn",
      "no-useless-rename": "warn",
      "no-var": "error",
      "no-warning-comments": "warn",
      // TODO: 追加する
      "@stylistic/semi": ["warn", "always"]
      */
    }
  }
]);
