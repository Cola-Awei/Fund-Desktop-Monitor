import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("packaging config", () => {
  it("uses relative renderer asset paths for file:// packaged Electron loads", async () => {
    const config = await readFile("vite.config.ts", "utf8");

    expect(config).toContain('base: "./"');
  });

  it("keeps the desktop widget window user-resizable", async () => {
    const main = await readFile("src/main/main.ts", "utf8");

    expect(main).toContain("resizable: true");
    expect(main).toContain("minWidth:");
    expect(main).toContain("minHeight:");
  });

  it("keeps the desktop widget above other apps and out of the taskbar", async () => {
    const main = await readFile("src/main/main.ts", "utf8");

    expect(main).toContain("alwaysOnTop: true");
    expect(main).toContain("skipTaskbar: true");
    expect(main).toContain('mainWindow.setAlwaysOnTop(true, "floating")');
  });

  it("sizes the renderer shell from the window viewport", async () => {
    const styles = await readFile("src/renderer/styles.css", "utf8");

    expect(styles).toContain("width: 100vw;");
    expect(styles).toContain("height: 100vh;");
    expect(styles).not.toContain("width: 390px;");
    expect(styles).not.toContain("height: 330px;");
  });
});
