import { spawnSync } from "node:child_process";

const bundleId = "dev.coreyhayward.wedplan";
const device = process.env.IOS_SIMULATOR_ID ?? "booted";
const route = process.env.IOS_LAUNCH_ROUTE ?? "/timeline";

function run(args) {
  return spawnSync("xcrun", ["simctl", ...args], {
    encoding: "utf8",
    stdio: "pipe",
  });
}

const launch = run([
  "launch",
  "--terminate-running-process",
  device,
  bundleId,
  "--route",
  route,
]);

if (launch.status !== 0) {
  process.stderr.write(launch.stderr || launch.stdout);
  throw new Error("Wed Plan could not be launched in the iOS simulator.");
}

await new Promise((resolve) => setTimeout(resolve, 2_000));

const terminate = run(["terminate", device, bundleId]);

if (terminate.status !== 0) {
  process.stderr.write(terminate.stderr || terminate.stdout);
  throw new Error("Wed Plan exited within two seconds of launch.");
}

console.log(`✓ Wed Plan remained running after launching ${route}`);
