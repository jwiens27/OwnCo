import type { Scenario } from "./types";

export function encodeScenario(scenario: Scenario): string {
  const json = JSON.stringify(scenario);
  if (typeof window !== "undefined") {
    return urlSafeBase64Encode(window.btoa(unescape(encodeURIComponent(json))));
  }
  return urlSafeBase64Encode(Buffer.from(json, "utf-8").toString("base64"));
}

export function decodeScenario(encoded: string): Scenario | null {
  try {
    const padded = urlSafeBase64Decode(encoded);
    const json =
      typeof window !== "undefined"
        ? decodeURIComponent(escape(window.atob(padded)))
        : Buffer.from(padded, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    if (!parsed.acquisitionMode) parsed.acquisitionMode = "purchase";
    return parsed as Scenario;
  } catch {
    return null;
  }
}

function urlSafeBase64Encode(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function urlSafeBase64Decode(s: string): string {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  return b64;
}
