#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const serverURL = process.env.WED_PLAN_SERVER_URL ?? "https://wed-plan.coreyh.uk";
const nativeConfigPath = path.join(
  repoRoot,
  "ios",
  "App",
  "App",
  "capacitor.config.json"
);
const sceneDelegatePath = path.join(
  repoRoot,
  "ios",
  "App",
  "App",
  "SceneDelegate.swift"
);

const response = await fetch(serverURL, { redirect: "manual" });
const location = response.headers.get("location");

if (!location) {
  throw new Error(`${serverURL} did not return an authentication redirect.`);
}

const redirectHost = new URL(location, serverURL).hostname;
const nativeConfig = JSON.parse(fs.readFileSync(nativeConfigPath, "utf8"));
const allowedHosts = nativeConfig.server?.allowNavigation ?? [];
const sceneDelegate = fs.readFileSync(sceneDelegatePath, "utf8");

if (/descriptor\.allowedNavigationHostnames\s*=/.test(sceneDelegate)) {
  throw new Error(
    "SceneDelegate replaces Capacitor's configured navigation allowlist."
  );
}

if (!allowedHosts.some((pattern) => doesHostMatch(redirectHost, pattern))) {
  throw new Error(
    `Cloudflare Access redirects to ${redirectHost}, but the native allowlist is ${JSON.stringify(allowedHosts)}.`
  );
}

console.log(`✓ Cloudflare Access stays in the app WebView (${redirectHost})`);

function doesHostMatch(host, pattern) {
  if (pattern === "*") return true;

  const hostParts = host.toLowerCase().split(".");
  const patternParts = pattern.toLowerCase().split(".");
  if (hostParts.length !== patternParts.length) return false;

  return patternParts.every(
    (patternPart, index) => patternPart === "*" || patternPart === hostParts[index]
  );
}
