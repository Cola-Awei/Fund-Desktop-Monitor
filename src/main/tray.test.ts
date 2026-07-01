import { describe, expect, it, vi } from "vitest";

const appMock = {
  getAppPath: vi.fn(() => "C:\\Program Files\\Fund Desktop Monitor\\resources\\app.asar"),
  isPackaged: false,
  isQuitting: false,
  quit: vi.fn()
};

const traySetToolTip = vi.fn();
const traySetContextMenu = vi.fn();
const trayOn = vi.fn();
const createFromPath = vi.fn((iconPath: string) => ({ iconPath }));
const buildFromTemplate = vi.fn((template: unknown[]) => ({ template }));

vi.mock("electron", () => ({
  app: appMock,
  nativeImage: { createFromPath },
  Menu: { buildFromTemplate },
  Tray: vi.fn().mockImplementation((icon) => ({
    icon,
    setToolTip: traySetToolTip,
    setContextMenu: traySetContextMenu,
    on: trayOn
  }))
}));

describe("tray helpers", () => {
  it("resolves development and packaged icon paths", async () => {
    const { resolveTrayIconPath } = await import("./tray.js");

    appMock.isPackaged = false;
    expect(resolveTrayIconPath()).toMatch(/build[\\/]icon\.png$/);

    appMock.isPackaged = true;
    expect(resolveTrayIconPath()).toBe(
      "C:\\Program Files\\Fund Desktop Monitor\\resources\\app.asar\\build\\icon.png",
    );
  });

  it("builds tray menu actions for show, refresh, and exit", async () => {
    const { createTrayMenuTemplate } = await import("./tray.js");
    const show = vi.fn();
    const focus = vi.fn();
    const refreshNow = vi.fn().mockResolvedValue(undefined);

    const template = createTrayMenuTemplate({
      getWindow: () => ({ show, focus }),
      refreshNow
    });

    expect(template.map((item) => item.label ?? item.type)).toEqual([
      "显示窗口",
      "立即刷新",
      "separator",
      "退出"
    ]);

    template[0].click?.({} as Electron.MenuItem, undefined, {} as Electron.KeyboardEvent);
    expect(show).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);

    template[1].click?.({} as Electron.MenuItem, undefined, {} as Electron.KeyboardEvent);
    expect(refreshNow).toHaveBeenCalledTimes(1);

    template[3].click?.({} as Electron.MenuItem, undefined, {} as Electron.KeyboardEvent);
    expect(appMock.isQuitting).toBe(true);
    expect(appMock.quit).toHaveBeenCalledTimes(1);
  });

  it("creates a tray that restores the window on click", async () => {
    const { createAppTray } = await import("./tray.js");
    const show = vi.fn();
    const focus = vi.fn();

    createAppTray({
      getWindow: () => ({ show, focus }),
      refreshNow: vi.fn().mockResolvedValue(undefined)
    });

    expect(createFromPath).toHaveBeenCalledWith(expect.stringMatching(/build[\\/]icon\.png$/));
    expect(traySetToolTip).toHaveBeenCalledWith("基金实时监控");
    expect(buildFromTemplate).toHaveBeenCalled();
    expect(traySetContextMenu).toHaveBeenCalled();
    expect(trayOn).toHaveBeenCalledWith("click", expect.any(Function));

    const clickHandler = trayOn.mock.calls.find(([event]) => event === "click")?.[1];
    clickHandler();

    expect(show).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
  });
});
