#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ipaPath = path.join(repoRoot, "artifacts", "WedPlan-unsigned.ipa");

if (!fs.existsSync(ipaPath)) {
  throw new Error(`Missing ${ipaPath}; run npm run ios:ipa first.`);
}

const extractionDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "wed-plan-ios-verify-")
);

try {
  run("/usr/bin/ditto", ["-x", "-k", ipaPath, extractionDirectory]);
  const appPath = path.join(extractionDirectory, "Payload", "Wed Plan.app");
  const infoPlist = path.join(appPath, "Info.plist");

  assertExists(appPath);
  assertExists(infoPlist);
  assertExists(path.join(appPath, "Wed Plan"));
  assertExists(path.join(appPath, "public", "index.html"));
  assertExists(path.join(appPath, "public", "connection-error.html"));
  const capacitorConfigPath = path.join(appPath, "capacitor.config.json");
  assertExists(capacitorConfigPath);

  const capacitorConfig = JSON.parse(fs.readFileSync(capacitorConfigPath, "utf8"));
  if (capacitorConfig.ios?.contentInset !== "automatic") {
    throw new Error("The iOS WebView must automatically respect device safe areas.");
  }
  if (capacitorConfig.backgroundColor || capacitorConfig.ios?.backgroundColor) {
    throw new Error(
      "A fixed Capacitor background color would break light/dark safe-area matching."
    );
  }

  const bundleIdentifier = plistValue(infoPlist, "CFBundleIdentifier");
  const displayName = plistValue(infoPlist, "CFBundleDisplayName");
  const minimumVersion = plistValue(infoPlist, "MinimumOSVersion");

  if (bundleIdentifier !== "dev.coreyhayward.wedplan") {
    throw new Error(`Unexpected bundle identifier: ${bundleIdentifier}`);
  }
  if (displayName !== "Wed Plan") {
    throw new Error(`Unexpected display name: ${displayName}`);
  }

  console.log(`✓ IPA bundle: ${displayName} (${bundleIdentifier})`);
  console.log(`✓ Minimum iOS: ${minimumVersion}`);
  console.log("✓ Connection and error pages are bundled");
  console.log("✓ Safe areas use automatic insets and a dynamic native background");

  const serverURL = process.env.WED_PLAN_SERVER_URL?.replace(/\/$/, "");
  if (serverURL) {
    await verifyServer(serverURL);
  } else {
    console.log("ℹ Set WED_PLAN_SERVER_URL to include live route/API verification.");
  }
} finally {
  fs.rmSync(extractionDirectory, { recursive: true, force: true });
}

function run(executable, args) {
  const result = spawnSync(executable, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || `${executable} failed`);
  }
  return result.stdout.trim();
}

function assertExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing expected IPA entry: ${filePath}`);
  }
}

function plistValue(plistPath, key) {
  return run("/usr/bin/plutil", ["-extract", key, "raw", "-o", "-", plistPath]);
}

async function verifyServer(serverURL) {
  const categories = await getJson(`${serverURL}/api/categories`);
  if (!Array.isArray(categories) || categories.length === 0) {
    throw new Error("Route verification needs at least one seeded expense.");
  }

  const categoryId = categories[0].id;
  const routes = [
    "/",
    "/categories",
    `/categories/${categoryId}`,
    `/categories/${categoryId}/compare`,
    "/timeline",
    "/guests",
    "/settings",
  ];

  for (const route of routes) {
    await expectOK(`${serverURL}${route}`);
  }

  const apiRoutes = [
    "/api/dashboard",
    "/api/categories",
    `/api/categories/${categoryId}`,
    `/api/categories/${categoryId}/vendors`,
    "/api/groups",
    "/api/timeline",
    "/api/guests",
    "/api/households",
    "/api/settings",
    "/api/guests/export",
  ];

  for (const route of apiRoutes) {
    await expectOK(`${serverURL}${route}`);
  }

  console.log(`✓ ${routes.length} user-facing routes responded successfully`);
  console.log(`✓ ${apiRoutes.length} read/export API routes responded successfully`);
}

async function expectOK(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  return response.json();
}
