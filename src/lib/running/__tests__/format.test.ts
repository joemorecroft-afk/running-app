import { describe, expect, it } from "vitest";
import {
  formatPaceSecPerKm,
  formatSecondsAsHMS,
  parseHMSToSeconds,
  parsePaceToSecPerKm,
} from "../format";

describe("formatSecondsAsHMS / parseHMSToSeconds round trip", () => {
  it("formats and re-parses a marathon goal time", () => {
    const seconds = 3 * 3600 + 30 * 60;
    const formatted = formatSecondsAsHMS(seconds);
    expect(formatted).toBe("3:30:00");
    expect(parseHMSToSeconds(formatted)).toBe(seconds);
  });

  it("parses H:MM without seconds", () => {
    expect(parseHMSToSeconds("3:30")).toBe(3 * 3600 + 30 * 60);
  });

  it("returns null for garbage input", () => {
    expect(parseHMSToSeconds("not a time")).toBeNull();
  });
});

describe("formatPaceSecPerKm / parsePaceToSecPerKm round trip", () => {
  it("formats and re-parses a pace", () => {
    const secPerKm = 4 * 60 + 18;
    const formatted = formatPaceSecPerKm(secPerKm);
    expect(formatted).toBe("4:18 /km");
    expect(parsePaceToSecPerKm(formatted.replace(" /km", ""))).toBe(secPerKm);
  });

  it("returns null for garbage input", () => {
    expect(parsePaceToSecPerKm("nope")).toBeNull();
  });
});
