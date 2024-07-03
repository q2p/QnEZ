// @ts-check

import TypeScript from "rollup-plugin-typescript2"
import EsLint from "@rollup/plugin-eslint"

const entries = [ "popup", "background" ]

export default () => {
  return entries.map(entry_point => {
    return {
      input: `./src/${entry_point}.ts`,
      output: {
        chunkFileNames: "[name].js",
        file: `./dist/${entry_point}.js`,
        format: "iife",
      },
      plugins: [
        EsLint({ throwOnError: true, throwOnWarning: false, fix: true, useEslintrc: true }),
        TypeScript({ abortOnError: false }),
      ],
      external: ["chrome"],
    }
  })
}
