#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const command = process.argv[2];
const supportedCommands = new Set(["sync", "simulator", "ipa"]);

if (!supportedCommands.has(command)) {
  console.error("Usage: node scripts/ios.mjs <sync|simulator|ipa>");
  process.exit(1);
}

if (process.platform !== "darwin") {
  console.error("iOS builds require macOS with Xcode installed.");
  process.exit(1);
}

const buildEnvironment = { ...process.env };
const hasServerURLOverride = Object.hasOwn(process.env, "WED_PLAN_SERVER_URL");
if (command === "simulator" && !hasServerURLOverride) {
  buildEnvironment.WED_PLAN_SERVER_URL = "http://127.0.0.1:3000";
}

if (buildEnvironment.WED_PLAN_SERVER_URL) {
  validateServerURL(buildEnvironment.WED_PLAN_SERVER_URL);
  console.log(`Wed Plan server: ${buildEnvironment.WED_PLAN_SERVER_URL}`);
} else {
  console.log("No build-time server URL set; the app will open its connection screen.");
}

syncCapacitor();

if (command === "simulator") {
  buildSimulator();
} else if (command === "ipa") {
  buildUnsignedIPA();
}

function validateServerURL(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("WED_PLAN_SERVER_URL must use http:// or https://");
  }
}

function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd: repoRoot,
    env: buildEnvironment,
    stdio: "inherit",
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${executable} exited with status ${result.status}`);
  }
}

function syncCapacitor() {
  run("npx", ["cap", "sync", "ios"]);
}

function xcodeBuild({ configuration, sdk, destination, derivedDataPath }) {
  fs.rmSync(derivedDataPath, { recursive: true, force: true });

  run("xcodebuild", [
    "-project",
    path.join(repoRoot, "ios", "App", "App.xcodeproj"),
    "-scheme",
    "App",
    "-configuration",
    configuration,
    "-sdk",
    sdk,
    "-destination",
    destination,
    "-derivedDataPath",
    derivedDataPath,
    "CODE_SIGNING_ALLOWED=NO",
    "CODE_SIGNING_REQUIRED=NO",
    "CODE_SIGN_IDENTITY=",
    "build",
  ]);

  const productsDirectory = path.join(
    derivedDataPath,
    "Build",
    "Products",
    `${configuration}-${sdk}`
  );
  const appName = fs
    .readdirSync(productsDirectory)
    .find((entry) => entry.endsWith(".app"));

  if (!appName) {
    throw new Error(`No .app bundle found in ${productsDirectory}`);
  }

  return path.join(productsDirectory, appName);
}

function buildSimulator() {
  const appPath = xcodeBuild({
    configuration: "Debug",
    sdk: "iphonesimulator",
    destination: "generic/platform=iOS Simulator",
    derivedDataPath: path.join(repoRoot, "build", "ios-simulator"),
  });

  console.log(`Simulator app: ${appPath}`);
}

function buildUnsignedIPA() {
  const appPath = xcodeBuild({
    configuration: "Release",
    sdk: "iphoneos",
    destination: "generic/platform=iOS",
    derivedDataPath: path.join(repoRoot, "build", "ios-device"),
  });

  const stagingDirectory = path.join(repoRoot, "build", "ipa-staging");
  const payloadDirectory = path.join(stagingDirectory, "Payload");
  const stagedApp = path.join(payloadDirectory, "Wed Plan.app");
  const artifactsDirectory = path.join(repoRoot, "artifacts");
  const ipaPath = path.join(artifactsDirectory, "WedPlan-unsigned.ipa");

  fs.rmSync(stagingDirectory, { recursive: true, force: true });
  fs.rmSync(ipaPath, { force: true });
  fs.mkdirSync(payloadDirectory, { recursive: true });
  fs.mkdirSync(artifactsDirectory, { recursive: true });

  run("/usr/bin/ditto", [appPath, stagedApp]);
  run("/usr/bin/zip", ["-qry", ipaPath, "Payload"], {
    cwd: stagingDirectory,
  });
  run("/usr/bin/unzip", ["-t", ipaPath]);
  run("/usr/bin/plutil", ["-lint", path.join(stagedApp, "Info.plist")]);

  const stat = fs.statSync(ipaPath);
  console.log(`Unsigned IPA: ${ipaPath} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}
