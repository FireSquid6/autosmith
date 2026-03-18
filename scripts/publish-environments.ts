#!/usr/bin/env bun

import path from "path";

const DOCKERHUB_ORG = "autosmith";
const ENVIRONMENTS = ["base", "node", "python", "go", "rust", "java"] as const;

const root = path.resolve(import.meta.dirname, "..");
const environmentsDir = path.join(root, "environments");

async function buildAndPush(name: string): Promise<void> {
  const image = `${DOCKERHUB_ORG}/${name}:latest`;
  const contextDir = path.join(environmentsDir, name);

  process.stdout.write(`  Building ${image}... `);
  await Bun.$`docker build -t ${image} ${contextDir}`.quiet();
  process.stdout.write("built, pushing... ");

  await Bun.$`docker push ${image}`.quiet();
  process.stdout.write("done\n");
}

console.log("Publishing autosmith environments to Docker Hub...\n");

const failed: { name: string; error: string }[] = [];

for (const name of ENVIRONMENTS) {
  try {
    await buildAndPush(name);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    process.stdout.write("failed\n");
    failed.push({ name, error });
  }
}

if (failed.length > 0) {
  console.log(`\nFailed to publish ${failed.length} environment(s):`);
  for (const { name, error } of failed) {
    console.log(`  ${name}: ${error}`);
  }
  process.exit(1);
} else {
  console.log(`\nAll ${ENVIRONMENTS.length} environments published to ${DOCKERHUB_ORG}/ on Docker Hub.`);
}
