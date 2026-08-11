import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const screenshotDirectory = path.resolve("artifacts/simulator");
const screenshotNames = [
  "dashboard.png",
  "categories-redirect.png",
  "expense-detail.png",
  "expense-compare.png",
  "timeline.png",
  "guests.png",
  "settings.png",
];

for (const screenshotName of screenshotNames) {
  const screenshotPath = path.join(screenshotDirectory, screenshotName);
  if (!existsSync(screenshotPath)) {
    throw new Error(`Missing simulator screenshot: ${screenshotPath}`);
  }

  const result = spawnSync("tesseract", [screenshotPath, "stdout"], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.error?.code === "ENOENT") {
    throw new Error("tesseract is required to verify iOS simulator screenshots.");
  }

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    throw new Error(`Could not inspect ${screenshotName}.`);
  }

  const text = result.stdout;
  const showsAppNavigation = ["Dashboard", "Timeline", "Guests", "Settings"].some(
    (label) => text.includes(label),
  );

  if (!showsAppNavigation) {
    throw new Error(
      `${screenshotName} does not show the Wed Plan UI. OCR output:\n${text}`,
    );
  }

  console.log(`✓ ${screenshotName} shows the Wed Plan UI`);
}
