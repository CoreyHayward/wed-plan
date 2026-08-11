import type { CapacitorConfig } from "@capacitor/cli";

function configuredServer() {
  const value = process.env.WED_PLAN_SERVER_URL?.trim();
  if (!value) return undefined;

  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("WED_PLAN_SERVER_URL must use http:// or https://");
  }

  return url.toString().replace(/\/$/, "");
}

const serverUrl = configuredServer();
const accessNavigationHostnames = ["corey-h.cloudflareaccess.com"];

const config: CapacitorConfig = {
  appId: "dev.coreyhayward.wedplan",
  appName: "Wed Plan",
  webDir: "ios-web",
  ios: {
    allowsLinkPreview: false,
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
        allowNavigation: accessNavigationHostnames,
        errorPath: "connection-error.html",
      }
    : {
        allowNavigation: accessNavigationHostnames,
        errorPath: "connection-error.html",
      },
};

export default config;
