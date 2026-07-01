import { describe, expect, it } from "vitest";
import { parseFundQuoteJsonp } from "./fundQuote.js";

function quoteJsonp(fields: Record<string, unknown>) {
  return `jsonpgz(${JSON.stringify(fields)});`;
}

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

  it("throws when fundcode is not a six-digit string", () => {
    for (const fundcode of [["000001"], { value: "000001" }, 1]) {
      expect(() =>
        parseFundQuoteJsonp(quoteJsonp({ fundcode, name: "Fund A" })),
      ).toThrow("Invalid fund quote response");
    }
  });

  it("throws when name is not a non-empty string", () => {
    for (const name of [["Fund A"], { value: "Fund A" }, 123, ""]) {
      expect(() =>
        parseFundQuoteJsonp(quoteJsonp({ fundcode: "000001", name })),
      ).toThrow("Invalid fund quote response");
    }
  });

  it("does not coerce array, boolean, or object numeric payloads", () => {
    const quote = parseFundQuoteJsonp(
      quoteJsonp({
        fundcode: "000001",
        name: "Fund A",
        dwjz: [],
        gsz: false,
        gszzl: ["1.2"],
      }),
    );

    expect(quote.dwjz).toBeNull();
    expect(quote.gsz).toBeNull();
    expect(quote.gszzl).toBeNull();
  });

  it("does not coerce object numeric payloads", () => {
    const quote = parseFundQuoteJsonp(
      quoteJsonp({
        fundcode: "000001",
        name: "Fund A",
        dwjz: { value: 1.2 },
      }),
    );

    expect(quote.dwjz).toBeNull();
  });

  it("trims numeric strings and treats blank numeric strings as null", () => {
    const quote = parseFundQuoteJsonp(
      quoteJsonp({
        fundcode: "000001",
        name: "Fund A",
        dwjz: " 1.6370 ",
        gsz: "   ",
        gszzl: 1.08,
      }),
    );

    expect(quote.dwjz).toBe(1.637);
    expect(quote.gsz).toBeNull();
    expect(quote.gszzl).toBe(1.08);
  });

  it("trims surrounding response whitespace", () => {
    const quote = parseFundQuoteJsonp(
      `\n ${quoteJsonp({ fundcode: "000001", name: "Fund A" })} \t`,
    );

    expect(quote.fundCode).toBe("000001");
  });
});
