import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("preload packaging config", () => {
  it("loads a CommonJS preload file in packaged Electron", async () => {
    const mainSource = await readFile("src/main/main.ts", "utf8");
    const packageJson = await readFile("package.json", "utf8");

    expect(mainSource).toContain("../preload/preload.cjs");
    expect(packageJson).toContain("scripts/build-preload.mjs");
  });
});
