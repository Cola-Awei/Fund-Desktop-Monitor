import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HoldingStore } from "./storage.js";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "fund-store-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("HoldingStore", () => {
  it("returns an empty list when no file exists", async () => {
    const store = new HoldingStore(dir);
    await expect(store.load()).resolves.toEqual([]);
  });

  it("saves and loads holdings", async () => {
    const store = new HoldingStore(dir);
    const holding = {
      fundCode: "000001",
      shares: 100,
      costPrice: 1.5,
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    };
    await store.save([holding]);
    await expect(store.load()).resolves.toEqual([holding]);
  });

  it("backs up corrupt storage and returns an empty list", async () => {
    await writeFile(path.join(dir, "holdings.json"), "{bad json", "utf8");
    const store = new HoldingStore(dir);
    await expect(store.load()).resolves.toEqual([]);
    const files = await readFile(path.join(dir, "holdings.json.corrupt"), "utf8");
    expect(files).toBe("{bad json");
  });
});
