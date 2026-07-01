import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("fundApp", {
  version: "0.1.0"
});
