import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";
import type { MenuItemConstructorOptions } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TrayOptions {
  getWindow(): Pick<BrowserWindow, "show" | "focus"> | null;
  refreshNow(): Promise<unknown>;
}

function showWindow(getWindow: TrayOptions["getWindow"]) {
  const window = getWindow();
  window?.show();
  window?.focus();
}

export function resolveTrayIconPath() {
  return app.isPackaged
    ? path.join(app.getAppPath(), "build/icon.png")
    : path.join(__dirname, "../../build/icon.png");
}

export function createTrayMenuTemplate(options: TrayOptions): MenuItemConstructorOptions[] {
  return [
    {
      label: "显示窗口",
      click: () => showWindow(options.getWindow)
    },
    {
      label: "立即刷新",
      click: () => void options.refreshNow()
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ];
}

export function createAppTray(options: TrayOptions) {
  const tray = new Tray(nativeImage.createFromPath(resolveTrayIconPath()));
  tray.setToolTip("基金实时监控");
  tray.setContextMenu(Menu.buildFromTemplate(createTrayMenuTemplate(options)));
  tray.on("click", () => showWindow(options.getWindow));
  return tray;
}
