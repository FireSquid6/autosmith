#!/usr/bin/env bun

import fs from "fs";
import path from "path";
import cssPlugin from "bun-plugin-tailwind";

const directory = path.resolve(import.meta.dirname, "..");
process.chdir(directory);

if (fs.existsSync("./dist")) {
  fs.rmSync("./dist", { recursive: true });
}
fs.mkdirSync("./dist");

const htmlFile = path.join(directory, "src/index.html"); 


await Bun.build({
  target: "bun",
  entrypoints: [htmlFile],
  plugins: [cssPlugin],
  sourcemap: "inline",
  outdir: "./dist",
});

console.log("Web bundle created in ./dist");
