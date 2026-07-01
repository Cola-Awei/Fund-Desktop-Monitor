import { contextBridge, ipcRenderer } from "electron";
import { CHANNELS } from "../shared/ipcChannels.js";
import type { HoldingInput, PortfolioSnapshot } from "../shared/types.js";

contextBridge.exposeInMainWorld("fundApp", {
  getSnapshot: () => ipcRenderer.invoke(CHANNELS.getSnapshot),
  addHolding: (input: HoldingInput) => ipcRenderer.invoke(CHANNELS.addHolding, input),
  getFundStockHoldings: (fundCode: string) => ipcRenderer.invoke(CHANNELS.getFundStockHoldings, fundCode),
  removeHolding: (fundCode: string) => ipcRenderer.invoke(CHANNELS.removeHolding, fundCode),
  refreshNow: () => ipcRenderer.invoke(CHANNELS.refreshNow),
  minimize: () => ipcRenderer.invoke(CHANNELS.minimize),
  closeToTray: () => ipcRenderer.invoke(CHANNELS.closeToTray),
  onSnapshotUpdated: (callback: (snapshot: PortfolioSnapshot) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: PortfolioSnapshot) => callback(snapshot);
    ipcRenderer.on(CHANNELS.snapshotUpdated, listener);
    return () => ipcRenderer.removeListener(CHANNELS.snapshotUpdated, listener);
  },
});
