import fs from "fs";
import path from "path";
import cssPlugin from "bun-plugin-tailwind";


export async function main() {
  const directory = path.resolve(import.meta.dirname, "..");
  process.chdir(directory);

  if (fs.existsSync("./dist")) {
    fs.rmSync("./dist", { recursive: true });
  }
  fs.mkdirSync("./dist");

  const sourceFile = path.join(directory, "src/index.ts"); 

  await Bun.build({
    target: "bun",
    entrypoints: [sourceFile],
    outdir: "./dist",
    sourcemap: "inline",
    plugins: [cssPlugin],
  });

}


main();
