#!/usr/bin/env bash

set -euo pipefail

build() {
  local target="$1"
  echo ">> building '$target' into dist/" >&2
  QNEZ_TARGET="$target" bunx rollup -c
}

build firefox
echo ">> packaging dist/ -> firefox.zip" >&2
rm -f firefox.zip
zip -r -q -X -9 -j firefox.zip dist

build chrome
echo ">> packaging dist/ -> chrome.crx" >&2
bunx crx3 dist -o chrome.crx

echo ">> done" >&2
