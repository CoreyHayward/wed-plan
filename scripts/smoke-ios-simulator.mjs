#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const serverURL = (process.env.WED_PLAN_SERVER_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);
const appPath = path.join(
  repoRoot,
  "build",
  "ios-simulator",
  "Build",
  "Products",
  "Debug-iphonesimulator",
  "Wed Plan.app"
);
const screenshotDirectory = path.join(repoRoot, "artifacts", "simulator");
const bundleIdentifier = "dev.coreyhayward.wedplan";

if (!fs.existsSync(appPath)) {
  throw new Error("Missing simulator app; run npm run ios:simulator first.");
}

const categoriesResponse = await fetch(`${serverURL}/api/categories`);
if (!categoriesResponse.ok) {
  throw new Error(`Wed Plan server is not reachable at ${serverURL}.`);
}
const categories = await categoriesResponse.json();
if (!Array.isArray(categories) || categories.length === 0) {
  throw new Error("Simulator smoke verification needs at least one seeded expense.");
}

const categoryId = categories[0].id;
const routes = [
  ["dashboard", "/", "Budget Overview"],
  ["categories-redirect", "/categories", "Budget Overview"],
  ["expense-detail", `/categories/${categoryId}`, "Add Option"],
  [
    "expense-compare",
    `/categories/${categoryId}/compare`,
    "Need at least 2 options",
  ],
  ["timeline", "/timeline", "Timeline"],
  ["guests", "/guests", "Guest List"],
  ["settings", "/settings", "Settings"],
];

fs.mkdirSync(screenshotDirectory, { recursive: true });
const simulator = selectSimulator();

if (simulator.state !== "Booted") {
  run("xcrun", ["simctl", "boot", simulator.udid]);
}
run("xcrun", ["simctl", "bootstatus", simulator.udid, "-b"]);
run("xcrun", ["simctl", "install", simulator.udid, appPath]);

capture("tesseract", ["--version"]);

for (const [name, route, expectedText] of routes) {
  run("xcrun", [
    "simctl",
    "launch",
    "--terminate-running-process",
    simulator.udid,
    bundleIdentifier,
    "--route",
    route,
  ]);
  await captureVerifiedScreenshot(name, route, expectedText);
}

console.log(`Simulator screenshots: ${screenshotDirectory}`);

function selectSimulator() {
  const requestedUDID = process.env.IOS_SIMULATOR_UDID;
  const listing = JSON.parse(capture("xcrun", ["simctl", "list", "devices", "available", "-j"]));
  const devices = Object.values(listing.devices).flat();

  if (requestedUDID) {
    const requested = devices.find((device) => device.udid === requestedUDID);
    if (!requested) throw new Error(`Simulator ${requestedUDID} is not available.`);
    return requested;
  }

  const preferred = devices.find((device) => device.name === "iPhone 17 Pro");
  const fallback = devices.find((device) => device.name.startsWith("iPhone"));
  const selected = preferred || fallback;
  if (!selected) throw new Error("No available iPhone Simulator was found.");
  return selected;
}

function run(executable, args) {
  const result = spawnSync(executable, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${executable} exited with status ${result.status}`);
  }
}

function capture(executable, args) {
  const result = spawnSync(executable, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || `${executable} exited with status ${result.status}`);
  }
  return result.stdout;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function captureVerifiedScreenshot(name, route, expectedText) {
  const screenshotPath = path.join(screenshotDirectory, `${name}.png`);
  let detectedText = "";

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await wait(attempt === 1 ? 2500 : 1500);
    run("xcrun", ["simctl", "io", simulator.udid, "screenshot", screenshotPath]);
    detectedText = capture("tesseract", [screenshotPath, "stdout"]);

    if (detectedText.includes(expectedText)) {
      console.log(`✓ ${route} (${expectedText})`);
      return;
    }
  }

  throw new Error(
    `${route} did not render \"${expectedText}\" in the simulator. OCR output:\n${detectedText}`,
  );
}
