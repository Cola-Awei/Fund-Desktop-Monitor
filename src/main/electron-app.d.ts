import "electron";

declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}

declare module "electron" {
  interface App {
    isQuitting?: boolean;
  }
}
