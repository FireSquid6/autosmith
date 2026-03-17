#!/usr/bin/env bash

cd "$(dirname "$0")" || exit
cd .. || exit

echo "Bundling..."
bun run scripts/bundle.ts

echo "Building binary..."
bun build ./dist/index.js --compile --outfile ./dist/autosmith

echo "Binary created at: dist/autosmith"
