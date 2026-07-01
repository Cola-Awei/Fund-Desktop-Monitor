import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("packaging config", () => {
  it("uses relative renderer asset paths for file:// packaged Electron loads", async () => {
    const config = await readFile("vite.config.ts", "utf8");

    expect(config).toContain('base: "./"');
  });
});
