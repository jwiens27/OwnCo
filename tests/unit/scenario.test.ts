import { describe, expect, it } from "vitest";
import { encodeScenario, decodeScenario } from "@/lib/calculator/scenario";
import { DEFAULT_SCENARIO } from "@/lib/calculator/defaults";

describe("scenario serialization", () => {
  it("round-trips DEFAULT_SCENARIO", () => {
    const encoded = encodeScenario(DEFAULT_SCENARIO);
    const decoded = decodeScenario(encoded);
    expect(decoded).toEqual(DEFAULT_SCENARIO);
  });

  it("backward compat: legacy scenario without acquisitionMode decodes as 'purchase'", () => {
    // Simulate a pre-feature encoded scenario by stripping the field before encoding
    const { acquisitionMode: _dropped, ...legacyScenario } = DEFAULT_SCENARIO;
    const json = JSON.stringify(legacyScenario);
    const encoded = typeof Buffer !== "undefined"
      ? Buffer.from(json, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
      : btoa(encodeURIComponent(json)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const decoded = decodeScenario(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.acquisitionMode).toBe("purchase");
  });

  it("returns null on garbage input", () => {
    expect(decodeScenario("not-base64-!!!")).toBeNull();
    expect(decodeScenario("")).toBeNull();
  });

  it("URL-safe: no +, /, or = in encoded output", () => {
    const encoded = encodeScenario(DEFAULT_SCENARIO);
    expect(encoded).not.toMatch(/[+/=]/);
  });
});
