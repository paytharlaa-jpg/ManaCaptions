import { describe, expect, it } from "vitest";
import { formatTimestamp, toSrt, toVtt } from "@/lib/captions/format";
import { creditsForDuration } from "@/lib/credits";

describe("caption timestamps", () => {
  it("formats SRT with comma milliseconds", () => {
    expect(formatTimestamp(3725.5, ",")).toBe("01:02:05,500");
  });
  it("formats VTT with dot milliseconds and header", () => {
    const vtt = toVtt([{ id: "a", start: 1, end: 2.25, text: "నమస్కారం" }]);
    expect(vtt).toBe("WEBVTT\n\n00:00:01.000 --> 00:00:02.250\nనమస్కారం\n");
  });
  it("numbers SRT cues from 1", () => {
    expect(toSrt([{ id: "a", start: 0, end: 1, text: "hi" }])).toBe("1\n00:00:00,000 --> 00:00:01,000\nhi\n");
  });
});

describe("credit cost", () => {
  it("charges 1 credit per started minute", () => {
    expect(creditsForDuration(130)).toBe(3);
    expect(creditsForDuration(60)).toBe(1);
  });
  it("charges at least 1 credit", () => {
    expect(creditsForDuration(5)).toBe(1);
  });
});
