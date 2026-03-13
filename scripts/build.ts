import path from "path";
import cssPlugin from "bun-plugin-tailwind";


export async function main() {
  const directory = path.resolve(import.meta.dirname, "..");
  process.chdir(directory);

  const sourceFile = path.join(directory, "src/index.ts"); 

  await Bun.build({
    target: "bun",
    entrypoints: [sourceFile],
    outdir: "./dist",
    plugins: [cssPlugin],
  });

}


main();
