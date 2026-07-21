import { describe, expect, it } from "vitest";
import { parseFundMobileQuoteResponse, parseFundQuoteJsonp } from "./fundQuote.js";

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

describe("parseFundMobileQuoteResponse", () => {
  it("parses Eastmoney mobile quote JSON when real-time estimates are unavailable", () => {
    const quote = parseFundMobileQuoteResponse(
      "021528",
      JSON.stringify({
        Datas: [
          {
            FCODE: "021528",
            SHORTNAME: "财通成长优选混合C",
            PDATE: "2026-07-20",
            NAV: "3.8050",
            NAVCHGRT: "-9.04",
            GSZ: null,
            GSZZL: null,
            GZTIME: null,
          },
        ],
        ErrCode: 0,
        Success: true,
        Expansion: {
          GZTIME: "2026-07-21",
          FSRQ: "2026-07-20",
        },
      }),
    );

    expect(quote).toEqual({
      fundCode: "021528",
      name: "财通成长优选混合C",
      jzrq: "2026-07-20",
      dwjz: 3.805,
      gsz: null,
      gszzl: null,
      gztime: "2026-07-21 15:00",
    });
  });

  it("uses mobile real-time estimate fields when they are present", () => {
    const quote = parseFundMobileQuoteResponse(
      "026211",
      JSON.stringify({
        Datas: [
          {
            FCODE: "026211",
            SHORTNAME: "平安科技精选混合发起式C",
            PDATE: "2026-07-20",
            NAV: "1.5399",
            GSZ: "1.5460",
            GSZZL: "0.40",
            GZTIME: "2026-07-21 10:42",
          },
        ],
        ErrCode: 0,
        Success: true,
      }),
    );

    expect(quote).toMatchObject({
      fundCode: "026211",
      name: "平安科技精选混合发起式C",
      dwjz: 1.5399,
      gsz: 1.546,
      gszzl: 0.4,
      gztime: "2026-07-21 10:42",
    });
  });

  it("throws when the requested fund code is missing", () => {
    expect(() =>
      parseFundMobileQuoteResponse(
        "021528",
        JSON.stringify({
          Datas: [{ FCODE: "026211", SHORTNAME: "Fund B" }],
          ErrCode: 0,
          Success: true,
        }),
      ),
    ).toThrow("Invalid fund quote response");
  });
});
