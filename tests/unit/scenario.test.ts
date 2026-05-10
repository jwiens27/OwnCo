import { describe, expect, it } from "vitest";
import { encodeScenario, decodeScenario } from "@/lib/calculator/scenario";
import { DEFAULT_SCENARIO } from "@/lib/calculator/defaults";

describe("scenario serialization", () => {
  it("round-trips DEFAULT_SCENARIO", () => {
    const encoded = encodeScenario(DEFAULT_SCENARIO);
    const decoded = decodeScenario(encoded);
    expect(decoded).toEqual(DEFAULT_SCENARIO);
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
