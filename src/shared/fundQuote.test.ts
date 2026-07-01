import { describe, expect, it } from "vitest";
import { parseFundQuoteJsonp } from "./fundQuote.js";

describe("parseFundQuoteJsonp", () => {
  it("parses fundgz JSONP into normalized numeric fields", () => {
    const quote = parseFundQuoteJsonp(
      'jsonpgz({"fundcode":"000001","name":"Fund A","jzrq":"2026-06-30","dwjz":"1.6370","gsz":"1.6547","gszzl":"1.08","gztime":"2026-07-01 10:33"});',
    );

    expect(quote).toEqual({
      fundCode: "000001",
      name: "Fund A",
      jzrq: "2026-06-30",
      dwjz: 1.637,
      gsz: 1.6547,
      gszzl: 1.08,
      gztime: "2026-07-01 10:33",
    });
  });

  it("throws on malformed responses", () => {
    expect(() => parseFundQuoteJsonp("not-jsonp")).toThrow(
      "Invalid fund quote response",
    );
  });

  it("throws on null payloads", () => {
    expect(() => parseFundQuoteJsonp("jsonpgz(null);")).toThrow(
      "Invalid fund quote response",
    );
  });
});
