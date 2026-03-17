#!/usr/bin/env bash


cd "$(dirname "$0")" || exit
cd ..


./scripts/build.ts

mkdir -p ~/.autosmith/bin
cp ./build/autosmith ~/.autosmith/bin


echo "Autosmith installed. Please add ~/.autosmith/bin to your shell's path." 

