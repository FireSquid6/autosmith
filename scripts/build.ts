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


await Bun.build({
  target: "bun",
  entrypoints: [sourceFile],
  plugins: [cssPlugin],
  sourcemap: "inline",
  compile: {
    outfile: "./build/autosmith",
    autoloadBunfig: true,
    autoloadTsconfig: true,
  }
});

console.log("Build finished. Executable is in ./build/autosmith");
