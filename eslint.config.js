const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslintEslintPlugin = require("@typescript-eslint/eslint-plugin");
const globals = require("globals");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        parser: tsParser,
        sourceType: "module",

        parserOptions: {
            project: "tsconfig.json",
        },

        globals: {
            ...globals.node,
            ...globals.jest,
        },
    },

    plugins: {
        "@typescript-eslint": typescriptEslintEslintPlugin,
    },

    extends: compat.extends(
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
    ),

    rules: {
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        // These should be fixed in the code/ignored if PR gets accepted
        "@typescript-eslint/no-require-imports": "warn",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-unused-expressions": "warn"
    },
}, globalIgnores(["**/*.d.ts", "src/**/*.test.ts", "src/**/files/**/*", "test/**/*"])]);
