// @ts-check

import { readFileSync } from "node:fs"
import TypeScript from "rollup-plugin-typescript2"
import EsLint from "@rollup/plugin-eslint"
import Sass from "rollup-plugin-sass"

const entries = ["popup", "background"]

const manifest_source = process.env.QNEZ_TARGET === "firefox" ?
  "src/manifest_firefox.json" :
  "src/manifest_chrome.json"

export default () => entries.map((entry_point, index) => {
  const plugins = [
    EsLint({ throwOnError: true, throwOnWarning: false, fix: true, useEslintrc: true, include: ["**/*.ts"] }),
    TypeScript({ abortOnError: false }),
    Sass({ api: "modern", output: "dist/styles.css" }),
  ]
  if (index === 0) {
    plugins.push({
      name: "copy-file",
      buildStart() {
        this.addWatchFile(manifest_source)
      },
      generateBundle() {
        this.emitFile({ type: "asset", fileName: "manifest.json", source: readFileSync(manifest_source, "utf8") })
      },
    })
  }
  return {
    input: `./src/${entry_point}.ts`,
    output: {
      chunkFileNames: "[name].js",
      dir: "./dist",
      format: "es",
    },
    plugins,
    external: ["chrome"],
  }
})
