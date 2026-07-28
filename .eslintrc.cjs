module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
  },
  "extends": "love",
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "sourceType": "module",
    "project": true,
    "ecmaVersion": "latest",
    "tsconfigRootDir": __dirname,
  },
  "plugins": [
    "eslint-plugin-import",
    "@typescript-eslint",
    "@stylistic/eslint-plugin-js",
    "@stylistic/eslint-plugin-ts",
  ],
  "rules": {
    "no-labels": "off",
    "no-unmodified-loop-condition": "off",
    "no-multi-spaces": "off",
    "@stylistic/js/no-multi-spaces": ["error", { "exceptions": { "VariableDeclarator": true, "Property": true } }],
    "import/no-self-import": "error",
    "import/no-namespace": "error",
    "import/no-absolute-path": "error",
    "import/no-amd": "error",
    "import/no-duplicates": "error",
    "import/no-named-default": "error",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/lines-between-class-members": "off",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/no-mixed-enums": "error",

    "@typescript-eslint/promise-function-async": "off",

    "@typescript-eslint/strict-boolean-expressions": "error",

    "@stylistic/js/arrow-spacing": ["error", { "before": true, "after": true }],
    "@stylistic/js/arrow-parens": ["error", "always"],

    "space-before-function-paren": "off",
    "@typescript-eslint/space-before-function-paren": ["error", {
      "anonymous": "never",
      "named": "never",
      "asyncArrow": "always",
    }],

    "@typescript-eslint/naming-convention": ["error", {
      "selector": "default",
      "format": ["snake_case"],
      "leadingUnderscore": "allow",
      "trailingUnderscore": "forbid",
    },{
      "selector": "enumMember",
      "format": ["UPPER_CASE"],
    },{
      "selector": "objectLiteralProperty",
      "format": ["camelCase", "snake_case"],
    },{
      "selector": ["import", "typeLike"],
      "format": ["StrictPascalCase"],
    }],

    "no-import-assign": "error",
    "no-control-regex": "off",

    "sort-imports": "off",
    "import/order": ["error", {
      "newlines-between": "never",
    }],

    "@typescript-eslint/consistent-type-definitions": ["error", "type"],

    "comma-dangle": "off",
    "@typescript-eslint/comma-dangle": ["error", "always-multiline"],

    "@typescript-eslint/consistent-type-assertions": ["error", {
      "assertionStyle": "angle-bracket",
      "objectLiteralTypeAssertions": "allow-as-parameter"
    }],

    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "never"],

    "@typescript-eslint/member-delimiter-style": "off",
    "@stylistic/ts/member-delimiter-style": ["error", {
      multiline: { delimiter: "none", requireLast: false },
      singleline: { delimiter: "semi", requireLast: false },
      multilineDetection: "brackets",
    }],

    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/explicit-function-return-type": "error",

    "dot-notation": "off",
    "@typescript-eslint/dot-notation": "error",

    "generator-star-spacing": ["error", {
      "before": false,
      "after": true,
      "anonymous": "neither",
      "method": { "before": false, "after": true }
    }],

    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", {
      "args": "all",
      "argsIgnorePattern": "^_",
      "caughtErrors": "all",
      "caughtErrorsIgnorePattern": "^_",
      "destructuredArrayIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "ignoreRestSiblings": true,
    }],
    "no-inner-declarations": "off",
    "eqeqeq": ["error", "always"],
    "comma-style": ["error", "last"],
    "no-constructor-return": ["error"],
    "eol-last": ["error", "always"],
    "quotes": "off",
    "@typescript-eslint/quotes": "off",
    "@stylistic/ts/quotes": ["error", "double"],
    "indent": "off",
    "@stylistic/ts/indent": ["error", 2, {
      "SwitchCase": 1,
      "VariableDeclarator": "first",
      "MemberExpression": 1,
    }],
    "no-tabs": ["error"],
    "space-in-parens": ["error", "never"],
    "space-infix-ops": ["error"],
    "keyword-spacing": ["error", { "before": true, "after": true }],
    "key-spacing": ["error", {
      "beforeColon": false,
      "afterColon": true,
      "mode": "minimum",
    }],
    "space-unary-ops": ["error", { "words": true, "nonwords": false }],
    "no-multiple-empty-lines": ["error", { "max": 1, "maxBOF": 0, "maxEOF": 0}],
    "no-trailing-spaces": "error",
    "no-constant-condition": ["error", { "checkLoops": false }],
    "padded-blocks": ["error", "never"],
    "operator-linebreak": ["error", "after"],
    "unicode-bom": ["error", "never"],
    "semi": ["error", "never"],
    "semi-spacing": ["error", { "before": false, "after": true }],
    "semi-style": ["error", "last"],
    "spaced-comment": ["error", "always", { "markers": ["/"] }],
    "prefer-numeric-literals": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-useless-call": "error",
    "prefer-spread": "error",
    "block-spacing": ["error", "always"],
    "space-before-blocks": ["error", "always"],
    "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
    "switch-colon-spacing": ["error", { "before": false, "after": true }],
    "@typescript-eslint/type-annotation-spacing": ["error", { "before": false, "after": true, "overrides": { "arrow": { "before": true, "after": true } } }],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/prefer-literal-enum-member": "off",
    "@typescript-eslint/no-misused-promises": ["error", {
      "checksVoidReturn": false
    }],
    "@typescript-eslint/prefer-optional-chain": "off",
    "@typescript-eslint/triple-slash-reference": "error",
    "no-array-constructor": "off",
    "@typescript-eslint/no-array-constructor": "error",
    "@typescript-eslint/no-confusing-void-expression": ["error", { "ignoreArrowShorthand": true }],
    "@typescript-eslint/no-invalid-void-type": "off",
    "@typescript-eslint/no-extra-non-null-assertion": "error",
    "@typescript-eslint/no-for-in-array": "error",
    "no-implied-eval": "off",
    "@typescript-eslint/no-implied-eval": "error",
    "@typescript-eslint/no-inferrable-types": "error",
    "@typescript-eslint/prefer-find": "error",
  },
}
