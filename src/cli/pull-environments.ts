import { Command } from "@commander-js/extra-typings";

// All environments shipped with autosmith, matching environments/ directory names
const ENVIRONMENTS = ["base", "node", "python", "go", "rust", "java"] as const;

export const pullEnvironmentsCommand = new Command()
  .name("pull-environments")
  .description("Pull all autosmith environment Docker images")
  .action(async () => {
    console.log("Pulling autosmith environments...\n");

    const results: { name: string; success: boolean; error?: string }[] = [];

    for (const name of ENVIRONMENTS) {
      const image = `autosmith/${name}:latest`;
      process.stdout.write(`  Pulling ${image}... `);
      try {
        await Bun.$`docker pull ${image}`.quiet();
        process.stdout.write("done\n");
        results.push({ name, success: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        process.stdout.write("failed\n");
        results.push({ name, success: false, error: message });
      }
    }

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log(`\nFailed to pull ${failed.length} image(s):`);
      for (const r of failed) {
        console.log(`  autosmith/${r.name}:latest — ${r.error}`);
      }
      process.exit(1);
    } else {
      console.log(`\nAll ${ENVIRONMENTS.length} environments pulled successfully.`);
    }
  });
