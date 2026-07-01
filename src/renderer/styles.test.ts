import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(join(process.cwd(), "src/renderer/styles.css"), "utf8");

describe("renderer styles", () => {
  it("keeps fund percentage colors from being overridden by the muted row text rule", () => {
    expect(styles).toContain(".fund-profit span.gain");
    expect(styles).toContain(".fund-profit span.loss");
    expect(styles).toContain(".fund-profit span.flat");
  });
});
