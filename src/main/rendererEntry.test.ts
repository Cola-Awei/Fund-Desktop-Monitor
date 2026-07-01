import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("renderer entry", () => {
  it("keeps source index.html pointed at the Vite React entry", async () => {
    const html = await readFile("index.html", "utf8");

    expect(html).toContain('src="/src/renderer/main.tsx"');
    expect(html).not.toContain("./assets/index-");
  });
});
