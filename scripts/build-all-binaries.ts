#!/usr/bin/env bun

import path from "path";
import { $ } from "bun";

const directory = path.resolve(import.meta.dirname, "..");
process.chdir(directory);


export interface BuildSetting {
  target: string;
}


await $`bun run scripts/bundle.ts`;
await $`rm -rf ./out`;
await $`mkdir -p ./out`;

export async function build(setting: BuildSetting) {
  console.log("----------------------------------------");
  console.log(`Building for: ${setting.target}`);
  console.log("----------------------------------------")

  await $`cp -r ./dist ./out/${setting.target}`;
  await $`rm ./out/${setting.target}/index.js`;
  await $`bun build ./dist/index.js --compile --target=${setting.target} --outfile ./out/${setting.target}/autosmith`;
  await $`cd ./out/${setting.target} && zip ../${setting.target}.zip ./*`;
  await $`rm -rf ./out/${setting.target}`;
}


const buildSettings: BuildSetting[] = [
  {
    target: "bun-linux-x64"
  },
  {
    target: "bun-linux-arm64"
  },
  {
    target: "bun-darwin-x64"
  },
  {
    target: "bun-darwin-arm64"
  },
]


for (const setting of buildSettings) {
  await build(setting);
}
