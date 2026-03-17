#!/usr/bin/env bun

import fs from "fs";
import path from "path";
import cssPlugin from "bun-plugin-tailwind";

const directory = path.resolve(import.meta.dirname, "..");
process.chdir(directory);

if (fs.existsSync("./build")) {
  fs.rmSync("./build", { recursive: true });
}
fs.mkdirSync("./build");

const sourceFile = path.join(directory, "src/index.ts");

const targets = [
  { target: "bun-linux-x64",   outfile: "./build/autosmith-linux-x64" },
  { target: "bun-linux-arm64", outfile: "./build/autosmith-linux-arm64" },
  { target: "bun-darwin-x64",  outfile: "./build/autosmith-darwin-x64" },
  { target: "bun-darwin-arm64",  outfile: "./build/autosmith-darwin-arm64" },
  { target: "bun-windows-x64",   outfile: "./build/autosmith-windows-x64.exe" },
] as const;

for (const { target, outfile } of targets) {
  console.log(`Building ${target}...`);
  await Bun.build({
    target: "bun",
    entrypoints: [sourceFile],
    plugins: [cssPlugin],
    sourcemap: "inline",
    compile: {
      outfile,
      target,
      autoloadBunfig: true,
      autoloadTsconfig: true,
    },
  });
  console.log(`  -> ${outfile}`);
}

console.log("All builds finished.");
