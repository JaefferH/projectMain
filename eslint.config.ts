import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Ignore generated/build files
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
    ],
  },

  // ==========================
  // Frontend (React + TypeScript)
  // ==========================
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      ...reactHooks.configs.recommended.rules,

      "react/react-in-jsx-scope": "off",

      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      "@typescript-eslint/no-explicit-any": "warn",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "react/no-unescaped-entities": "off",
    },
  },

  // ==========================
  // Legacy Express backend
  // ==========================
  {
    files: ["server/**/*.js"],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },

  prettier,
]);