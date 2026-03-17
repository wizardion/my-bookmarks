import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/*.json", "**/node_modules"]), {
    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.browser,
            ...globals.es2022,
            chrome: "readonly",
        },

        ecmaVersion: 2022,
        sourceType: "module",
    },
}, {
    files: ["src/**/*.ts"],

    extends: fixupConfigRules(compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    )),

    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
    },

    languageOptions: {
        globals: {
            KeyUsage: "readonly",
            EventListener: "readonly",
            AddEventListenerOptions: "readonly",
            IDBTransactionMode: "readonly",
            NodeJS: "readonly",
            CustomElementConstructor: "readonly",
            HTMLCollectionOf: "readonly",
            WakeLockSentinel: "readonly",
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",
    },

    rules: {
        "no-bitwise": "error",

        camelcase: ["error", {
            properties: "never",
        }],

        curly: "error",
        eqeqeq: "error",
        "wrap-iife": ["error", "any"],

        indent: ["error", 2, {
            SwitchCase: 1,
        }],

        "@typescript-eslint/no-use-before-define": "error",
        "no-caller": "error",

        quotes: ["error", "single", {
            allowTemplateLiterals: true,
        }],

        semi: ["error", "always"],
        "no-undef": "error",
        strict: ["error", "safe"],
        "no-duplicate-imports": "error",
        "eol-last": "error",
        "no-trailing-spaces": "error",
        "object-curly-newline": ["error"],

        "max-len": ["error", {
            code: 88,
        }],

        "space-before-blocks": "error",
        "keyword-spacing": "error",
        "arrow-spacing": "error",
        "no-multiple-empty-lines": "error",
        "object-curly-spacing": ["error", "always"],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "error",

        "lines-between-class-members": ["error", "always", {
            exceptAfterSingleLine: true,
        }],

        "import/no-duplicates": "off",
        "space-infix-ops": "warn",
        "comma-spacing": "error",
        "key-spacing": "error",
        "padded-blocks": ["error", "never"],

        "padding-line-between-statements": ["error", {
            blankLine: "always",
            prev: "*",
            next: "return",
        }, {
                blankLine: "always",
                prev: "*",
                next: "block-like",
            }, {
                blankLine: "always",
                prev: ["block-like", "const", "let", "var"],
                next: "*",
            }, {
                blankLine: "any",
                prev: ["const", "let", "var"],
                next: ["const", "let", "var"],
            }],

        "new-cap": ["error", {
            capIsNewExceptions: [
                "Attribute",
                "Component",
                "ContentChild",
                "ContentChildren",
                "Directive",
                "Host",
                "HostBinding",
                "HostListener",
                "Inject",
                "Injectable",
                "Input",
                "NgModule",
                "Optional",
                "Output",
                "Pipe",
                "Self",
                "SkipSelf",
                "ViewChild",
                "ViewChildren",
            ],
        }],

        "@typescript-eslint/member-ordering": ["error", {
            classes: [
                "static-field",
                "decorated-field",
                "public-field",
                "public-readonly-field",
                "protected-field",
                "protected-readonly-field",
                "private-field",
                "private-readonly-field",
                "constructor",
                "decorated-method",
                "protected-instance-method",
                "public-method",
                "protected-method",
                "private-method",
            ],
        }],
    },
}]);