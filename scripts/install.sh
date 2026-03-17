#!/usr/bin/env bash

cd "$(dirname "$0")" || exit
cd .. || exit

echo "Building..."
./scripts/build.sh

echo "Installing..."

mkdir -p ~/.autosmith
mkdir ~/.autosmith/install

cp -r ./dist ~/.autosmith/install

echo "Done! You'll need to add ~/.autosmith/bin to your shell's PATH to get the autosmith command"
