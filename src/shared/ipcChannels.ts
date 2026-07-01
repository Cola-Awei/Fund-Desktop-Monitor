export const CHANNELS = {
  getSnapshot: "portfolio:getSnapshot",
  addHolding: "portfolio:addHolding",
  getFundStockHoldings: "portfolio:getFundStockHoldings",
  removeHolding: "portfolio:removeHolding",
  refreshNow: "portfolio:refreshNow",
  minimize: "window:minimize",
  closeToTray: "window:closeToTray",
  snapshotUpdated: "portfolio:snapshotUpdated",
} as const;
