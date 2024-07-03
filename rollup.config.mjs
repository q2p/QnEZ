// @ts-check

import TypeScript from "rollup-plugin-typescript2"
import EsLint from "@rollup/plugin-eslint"
import Execute from "rollup-plugin-execute"

const entries = ["popup", "background"]

export default () => {
  return entries.map((entry_point) => {
    return {
      input: `./src/${entry_point}.ts`,
      output: {
        chunkFileNames: "[name].js",
        dir: "./dist",
        format: "es",
      },
      plugins: [
        EsLint({ throwOnError: true, throwOnWarning: false, fix: true, useEslintrc: true }),
        TypeScript({ abortOnError: false }),
        Execute("sass src/styles.scss:dist/styles.css --no-source-map"),
      ],
      external: ["chrome"],
    }
  })
}
