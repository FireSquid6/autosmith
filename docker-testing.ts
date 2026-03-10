const IMAGE = "fleet-agent:latest";
const CONTAINER_NAME = "fleet-test-container";

console.log("=== Docker Testing ===\n");

// 1. Image exists
console.log("1. image inspect...");
try {
  const result = await Bun.$`docker image inspect ${IMAGE}`.quiet();
  console.log("   OK - exit code:", result.exitCode);
} catch (e) {
  console.log("   NOT FOUND:", String(e));
}

// 2. Container inspect (expect not found)
console.log("2. container inspect (expect not found)...");
try {
  const result = await Bun.$`docker container inspect ${CONTAINER_NAME}`.quiet();
  const info = JSON.parse(result.stdout.toString());
  console.log("   EXISTS - state:", info[0]?.State?.Status);
} catch (e) {
  console.log("   NOT FOUND (expected)");
}

// 3. Container create
console.log("3. container create...");
try {
  const result = await Bun.$`docker create --name ${CONTAINER_NAME} -v /tmp:/workspace ${IMAGE}`.quiet();
  console.log("   OK - id:", result.stdout.toString().trim());
} catch (e) {
  console.error("   FAIL:", e);
}

// 4. Container start
console.log("4. container start...");
try {
  await Bun.$`docker start ${CONTAINER_NAME}`.quiet();
  console.log("   OK");
} catch (e) {
  console.error("   FAIL:", e);
}

// 5. Exec a command
console.log("5. exec command in container...");
try {
  const result = await Bun.$`docker exec ${CONTAINER_NAME} echo hello`.quiet();
  console.log("   OK - output:", result.stdout.toString().trim());
} catch (e) {
  console.error("   FAIL:", e);
}

// 6. Container stop
console.log("6. container stop...");
try {
  await Bun.$`docker stop ${CONTAINER_NAME}`.quiet();
  console.log("   OK");
} catch (e) {
  console.error("   FAIL:", e);
}

// Cleanup
console.log("\nCleaning up...");
await Bun.$`docker rm -f ${CONTAINER_NAME}`.quiet().catch(() => {});
console.log("Done.");
