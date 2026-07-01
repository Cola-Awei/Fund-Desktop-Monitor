# Fund Desktop Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a packaged Windows Electron `.exe` that monitors mainland China mutual fund real-time profit/loss with a compact dark desktop UI, local JSON persistence, 30-second refresh, and tray behavior.

**Architecture:** Electron main process owns app lifecycle, tray, storage, quote fetching, refresh scheduling, and IPC handlers. React renderer owns the compact dark UI, add-holding dialog, validation display, and user interactions. Shared pure TypeScript modules hold domain types, validation, JSONP parsing, and profit/loss calculations so they can be unit tested without Electron.

**Tech Stack:** Electron, React, Vite, TypeScript, Vitest, Testing Library, electron-builder, local JSON file storage.

---

## File Structure

- `package.json`: npm scripts, app metadata, dependencies, electron-builder config.
- `tsconfig.json`: root TypeScript project references.
- `tsconfig.node.json`: TypeScript config for Electron/preload/shared files.
- `tsconfig.web.json`: TypeScript config for React renderer.
- `vite.config.ts`: Vite renderer build and Vitest config.
- `index.html`: Vite renderer entry.
- `src/shared/types.ts`: domain and IPC-facing types.
- `src/shared/money.ts`: numeric formatting and sign helpers.
- `src/shared/holdings.ts`: holding validation and cost normalization.
- `src/shared/profit.ts`: current price selection and profit/loss calculation.
- `src/shared/fundQuote.ts`: JSONP quote parsing and quote normalization.
- `src/shared/ipcChannels.ts`: shared IPC channel names used by main and preload.
- `src/shared/*.test.ts`: unit tests for pure shared modules.
- `src/main/storage.ts`: local `holdings.json` read/write.
- `src/main/fundApi.ts`: HTTP fetch for fund quote endpoint.
- `src/main/portfolioService.ts`: orchestration for holdings plus quote state.
- `src/main/ipc.ts`: IPC channel registration.
- `src/main/tray.ts`: tray icon and menu.
- `src/main/main.ts`: Electron app bootstrap, window lifecycle, timer, tray wiring.
- `src/preload/preload.ts`: safe renderer API exposed through `contextBridge`.
- `src/renderer/main.tsx`: React entry.
- `src/renderer/App.tsx`: main app shell.
- `src/renderer/components/*.tsx`: focused UI components.
- `src/renderer/styles.css`: compact dark UI styles.
- `src/renderer/global.d.ts`: preload API typing for renderer.
- `assets/tray.svg`: source tray icon.
- `scripts/render-tray-icon.mjs`: converts `assets/tray.svg` to `build/icon.png`.
- `build/icon.png`: generated icon used by Electron tray and builder.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tsconfig.web.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/styles.css`
- Create: `src/preload/preload.ts`
- Create: `src/main/main.ts`

- [ ] **Step 1: Create package metadata and scripts**

Add `package.json`:

```json
{
  "name": "fund-desktop-monitor",
  "version": "0.1.0",
  "description": "Compact desktop fund real-time profit/loss monitor",
  "main": "dist-electron/main/main.js",
  "type": "module",
  "scripts": {
    "dev": "concurrently -k \"vite --host 127.0.0.1\" \"wait-on tcp:5173 && cross-env VITE_DEV_SERVER_URL=http://127.0.0.1:5173 electron .\"",
    "build": "npm run test && npm run build:renderer && npm run build:electron",
    "build:renderer": "vite build",
    "build:electron": "tsc -p tsconfig.node.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "package": "npm run build && electron-builder --win nsis"
  },
  "build": {
    "appId": "local.fund.desktop.monitor",
    "productName": "Fund Desktop Monitor",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**",
      "dist-electron/**",
      "build/icon.png",
      "package.json"
    ],
    "win": {
      "target": "nsis"
    }
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "electron-store": "^10.0.0",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitest/ui": "^2.1.8",
    "concurrently": "^9.1.0",
    "cross-env": "^7.0.3",
    "electron": "^33.2.1",
    "electron-builder": "^25.1.8",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.3",
    "vitest": "^2.1.8",
    "wait-on": "^8.0.1"
  }
}
```

- [ ] **Step 2: Add TypeScript and Vite config**

Add `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

Add `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist-electron",
    "rootDir": "src",
    "types": ["node", "vitest"]
  },
  "include": ["src/main/**/*.ts", "src/preload/**/*.ts", "src/shared/**/*.ts"]
}
```

Add `tsconfig.web.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src/renderer/**/*.ts", "src/renderer/**/*.tsx", "src/shared/**/*.ts"]
}
```

Add `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist"
  },
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: []
  }
});
```

- [ ] **Step 3: Add minimal renderer and Electron entries**

Add `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fund Desktop Monitor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/renderer/main.tsx"></script>
  </body>
</html>
```

Add `src/renderer/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Add `src/renderer/App.tsx`:

```tsx
export function App() {
  return <main className="app-shell">Fund Desktop Monitor</main>;
}
```

Add `src/renderer/styles.css`:

```css
:root {
  color-scheme: dark;
  font-family: "Segoe UI", system-ui, sans-serif;
  background: transparent;
  color: #f4f7fb;
}

body {
  margin: 0;
  min-width: 390px;
  min-height: 260px;
  background: transparent;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #202127;
}
```

Add `src/preload/preload.ts`:

```ts
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("fundApp", {
  version: "0.1.0"
});
```

Add `src/main/main.ts`:

```ts
import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 390,
    height: 300,
    resizable: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and install exits with code 0.

- [ ] **Step 5: Verify scaffold build**

Run: `npm run build`

Expected: `vitest run` reports no test files or passes, `vite build` creates `dist`, and `tsc -p tsconfig.node.json` creates `dist-electron`.

- [ ] **Step 6: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json tsconfig.web.json vite.config.ts index.html src
git commit -m "chore: scaffold electron react app"
```

## Task 2: Shared Domain Logic

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/holdings.ts`
- Create: `src/shared/holdings.test.ts`
- Create: `src/shared/profit.ts`
- Create: `src/shared/profit.test.ts`
- Create: `src/shared/money.ts`
- Create: `src/shared/money.test.ts`

- [ ] **Step 1: Write holding validation tests**

Add `src/shared/holdings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeHoldingInput, validateFundCode } from "./holdings";

describe("validateFundCode", () => {
  it("accepts exactly six digits", () => {
    expect(validateFundCode("000001")).toBe(true);
  });

  it("rejects non-six-digit values", () => {
    expect(validateFundCode("1")).toBe(false);
    expect(validateFundCode("00001A")).toBe(false);
    expect(validateFundCode("0000001")).toBe(false);
  });
});

describe("normalizeHoldingInput", () => {
  it("uses cost price mode directly", () => {
    const result = normalizeHoldingInput({
      mode: "costPrice",
      fundCode: "000001",
      shares: "3200",
      costPrice: "1.62"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holding.fundCode).toBe("000001");
      expect(result.holding.shares).toBe(3200);
      expect(result.holding.costPrice).toBe(1.62);
    }
  });

  it("converts total amount mode into cost price", () => {
    const result = normalizeHoldingInput({
      mode: "totalAmount",
      fundCode: "000001",
      shares: "3200",
      totalAmount: "5184"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holding.costPrice).toBe(1.62);
    }
  });

  it("returns field errors for invalid input", () => {
    const result = normalizeHoldingInput({
      mode: "totalAmount",
      fundCode: "abc",
      shares: "0",
      totalAmount: ""
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fundCode).toBeTruthy();
      expect(result.errors.shares).toBeTruthy();
      expect(result.errors.totalAmount).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Write profit and formatting tests**

Add `src/shared/profit.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateHoldingProfit, summarizePortfolio } from "./profit";

describe("calculateHoldingProfit", () => {
  it("uses intraday estimate before latest net value", () => {
    const result = calculateHoldingProfit(
      { fundCode: "000001", shares: 1000, costPrice: 1.5, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" },
      { fundCode: "000001", name: "Fund A", dwjz: 1.52, gsz: 1.56, gszzl: 1.2, gztime: "2026-07-01 10:33", jzrq: "2026-06-30" }
    );
    expect(result.currentPrice).toBe(1.56);
    expect(result.profitLoss).toBeCloseTo(60);
  });

  it("falls back to latest net value when estimate is missing", () => {
    const result = calculateHoldingProfit(
      { fundCode: "000001", shares: 1000, costPrice: 1.5, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" },
      { fundCode: "000001", name: "Fund A", dwjz: 1.52, gsz: null, gszzl: null, gztime: "", jzrq: "2026-06-30" }
    );
    expect(result.currentPrice).toBe(1.52);
    expect(result.profitLoss).toBeCloseTo(20);
  });
});

describe("summarizePortfolio", () => {
  it("sums profit/loss values", () => {
    expect(summarizePortfolio([{ profitLoss: 10 }, { profitLoss: -3.5 }])).toEqual({ totalProfitLoss: 6.5 });
  });
});
```

Add `src/shared/money.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatAmount, signClass } from "./money";

describe("formatAmount", () => {
  it("formats signed amounts with two decimals", () => {
    expect(formatAmount(128.456)).toBe("+128.46");
    expect(formatAmount(-18.7)).toBe("-18.70");
  });
});

describe("signClass", () => {
  it("maps signs to UI classes", () => {
    expect(signClass(1)).toBe("gain");
    expect(signClass(-1)).toBe("loss");
    expect(signClass(0)).toBe("flat");
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- --run src/shared/holdings.test.ts src/shared/profit.test.ts src/shared/money.test.ts`

Expected: tests fail because shared modules do not exist.

- [ ] **Step 4: Implement shared types and holding normalization**

Add `src/shared/types.ts`:

```ts
export type CostInputMode = "costPrice" | "totalAmount";

export interface Holding {
  fundCode: string;
  shares: number;
  costPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingInput {
  mode: CostInputMode;
  fundCode: string;
  shares: string;
  costPrice?: string;
  totalAmount?: string;
}

export interface HoldingInputErrors {
  fundCode?: string;
  shares?: string;
  costPrice?: string;
  totalAmount?: string;
}

export type NormalizeHoldingResult =
  | { ok: true; holding: Holding }
  | { ok: false; errors: HoldingInputErrors };

export interface FundQuote {
  fundCode: string;
  name: string;
  jzrq: string;
  dwjz: number | null;
  gsz: number | null;
  gszzl: number | null;
  gztime: string;
}

export interface HoldingQuoteState {
  holding: Holding;
  quote: FundQuote | null;
  status: "idle" | "loading" | "fresh" | "stale" | "error";
  error?: string;
  lastUpdatedAt?: string;
}

export interface HoldingProfitView {
  holding: Holding;
  quote: FundQuote | null;
  currentPrice: number | null;
  profitLoss: number | null;
  status: HoldingQuoteState["status"];
  error?: string;
}

export interface PortfolioSnapshot {
  holdings: HoldingProfitView[];
  totalProfitLoss: number;
  latestEstimateTime: string | null;
  isRefreshing: boolean;
}
```

Add `src/shared/holdings.ts`:

```ts
import type { Holding, HoldingInput, HoldingInputErrors, NormalizeHoldingResult } from "./types";

export function validateFundCode(fundCode: string) {
  return /^\d{6}$/.test(fundCode.trim());
}

function parsePositiveNumber(value: string | undefined) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function normalizeHoldingInput(input: HoldingInput, now = new Date()): NormalizeHoldingResult {
  const fundCode = input.fundCode.trim();
  const shares = parsePositiveNumber(input.shares);
  const errors: HoldingInputErrors = {};

  if (!validateFundCode(fundCode)) errors.fundCode = "Fund code must be exactly 6 digits.";
  if (shares === null) errors.shares = "Holding shares must be greater than 0.";

  let costPrice: number | null = null;
  if (input.mode === "costPrice") {
    costPrice = parsePositiveNumber(input.costPrice);
    if (costPrice === null) errors.costPrice = "Cost unit price must be greater than 0.";
  } else {
    const totalAmount = parsePositiveNumber(input.totalAmount);
    if (totalAmount === null) errors.totalAmount = "Total invested amount must be greater than 0.";
    if (shares !== null && totalAmount !== null) costPrice = totalAmount / shares;
  }

  if (Object.keys(errors).length > 0 || shares === null || costPrice === null) {
    return { ok: false, errors };
  }

  const timestamp = now.toISOString();
  const holding: Holding = {
    fundCode,
    shares,
    costPrice,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return { ok: true, holding };
}
```

- [ ] **Step 5: Implement profit and formatting modules**

Add `src/shared/profit.ts`:

```ts
import type { FundQuote, Holding, HoldingProfitView } from "./types";

export function getCurrentPrice(quote: FundQuote | null) {
  if (!quote) return null;
  if (typeof quote.gsz === "number" && Number.isFinite(quote.gsz)) return quote.gsz;
  if (typeof quote.dwjz === "number" && Number.isFinite(quote.dwjz)) return quote.dwjz;
  return null;
}

export function calculateHoldingProfit(holding: Holding, quote: FundQuote | null): HoldingProfitView {
  const currentPrice = getCurrentPrice(quote);
  return {
    holding,
    quote,
    currentPrice,
    profitLoss: currentPrice === null ? null : (currentPrice - holding.costPrice) * holding.shares,
    status: quote ? "fresh" : "idle"
  };
}

export function summarizePortfolio(items: Array<{ profitLoss: number | null }>) {
  return {
    totalProfitLoss: items.reduce((sum, item) => sum + (item.profitLoss ?? 0), 0)
  };
}
```

Add `src/shared/money.ts`:

```ts
export function formatAmount(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";
  const abs = Math.abs(value).toFixed(2);
  if (value > 0) return `+${abs}`;
  if (value < 0) return `-${abs}`;
  return "0.00";
}

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";
  return value.toFixed(4);
}

export function signClass(value: number | null | undefined): "gain" | "loss" | "flat" {
  if (!value) return "flat";
  return value > 0 ? "gain" : "loss";
}
```

- [ ] **Step 6: Run shared tests**

Run: `npm test -- --run src/shared/holdings.test.ts src/shared/profit.test.ts src/shared/money.test.ts`

Expected: all shared tests pass.

- [ ] **Step 7: Commit shared domain logic**

```bash
git add src/shared
git commit -m "feat: add fund holding domain logic"
```

## Task 3: Fund Quote Parser And API

**Files:**
- Create: `src/shared/fundQuote.ts`
- Create: `src/shared/fundQuote.test.ts`
- Create: `src/main/fundApi.ts`
- Create: `src/main/fundApi.test.ts`

- [ ] **Step 1: Write JSONP parser tests**

Add `src/shared/fundQuote.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseFundQuoteJsonp } from "./fundQuote";

describe("parseFundQuoteJsonp", () => {
  it("parses fundgz JSONP into normalized numeric fields", () => {
    const quote = parseFundQuoteJsonp('jsonpgz({"fundcode":"000001","name":"Fund A","jzrq":"2026-06-30","dwjz":"1.6370","gsz":"1.6547","gszzl":"1.08","gztime":"2026-07-01 10:33"});');
    expect(quote).toEqual({
      fundCode: "000001",
      name: "Fund A",
      jzrq: "2026-06-30",
      dwjz: 1.637,
      gsz: 1.6547,
      gszzl: 1.08,
      gztime: "2026-07-01 10:33"
    });
  });

  it("throws on malformed responses", () => {
    expect(() => parseFundQuoteJsonp("not-jsonp")).toThrow("Invalid fund quote response");
  });
});
```

- [ ] **Step 2: Write API URL test**

Add `src/main/fundApi.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildFundQuoteUrl } from "./fundApi";

describe("buildFundQuoteUrl", () => {
  it("builds fundgz endpoint with cache busting", () => {
    expect(buildFundQuoteUrl("000001", 123)).toBe("https://fundgz.1234567.com.cn/js/000001.js?rt=123");
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- --run src/shared/fundQuote.test.ts src/main/fundApi.test.ts`

Expected: tests fail because quote modules do not exist.

- [ ] **Step 4: Implement JSONP parser**

Add `src/shared/fundQuote.ts`:

```ts
import type { FundQuote } from "./types";

function parseNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parseFundQuoteJsonp(responseText: string): FundQuote {
  const match = responseText.match(/^jsonpgz\((.*)\);?$/s);
  if (!match) throw new Error("Invalid fund quote response");

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(match[1]);
  } catch {
    throw new Error("Invalid fund quote response");
  }

  const fundCode = String(raw.fundcode ?? "");
  const name = String(raw.name ?? "");
  if (!/^\d{6}$/.test(fundCode) || !name) {
    throw new Error("Invalid fund quote response");
  }

  return {
    fundCode,
    name,
    jzrq: String(raw.jzrq ?? ""),
    dwjz: parseNullableNumber(raw.dwjz),
    gsz: parseNullableNumber(raw.gsz),
    gszzl: parseNullableNumber(raw.gszzl),
    gztime: String(raw.gztime ?? "")
  };
}
```

- [ ] **Step 5: Implement fund API client**

Add `src/main/fundApi.ts`:

```ts
import { parseFundQuoteJsonp } from "../shared/fundQuote";
import type { FundQuote } from "../shared/types";

export function buildFundQuoteUrl(fundCode: string, now = Date.now()) {
  return `https://fundgz.1234567.com.cn/js/${fundCode}.js?rt=${now}`;
}

export async function fetchFundQuote(fundCode: string): Promise<FundQuote> {
  const response = await fetch(buildFundQuoteUrl(fundCode));
  if (!response.ok) {
    throw new Error(`Fund quote request failed with status ${response.status}`);
  }
  return parseFundQuoteJsonp(await response.text());
}
```

- [ ] **Step 6: Run parser and API tests**

Run: `npm test -- --run src/shared/fundQuote.test.ts src/main/fundApi.test.ts`

Expected: all tests pass.

- [ ] **Step 7: Smoke test the live endpoint**

Run: `node -e "fetch('https://fundgz.1234567.com.cn/js/000001.js?rt=' + Date.now()).then(r => r.text()).then(t => console.log(t.slice(0, 80)))"`

Expected: output starts with `jsonpgz({`.

- [ ] **Step 8: Commit quote parsing and API**

```bash
git add src/shared/fundQuote.ts src/shared/fundQuote.test.ts src/main/fundApi.ts src/main/fundApi.test.ts
git commit -m "feat: add fund quote parser"
```

## Task 4: Local Storage And Portfolio Service

**Files:**
- Create: `src/main/storage.ts`
- Create: `src/main/storage.test.ts`
- Create: `src/main/portfolioService.ts`
- Create: `src/main/portfolioService.test.ts`

- [ ] **Step 1: Write storage tests**

Add `src/main/storage.test.ts`:

```ts
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HoldingStore } from "./storage";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "fund-store-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("HoldingStore", () => {
  it("returns an empty list when no file exists", async () => {
    const store = new HoldingStore(dir);
    await expect(store.load()).resolves.toEqual([]);
  });

  it("saves and loads holdings", async () => {
    const store = new HoldingStore(dir);
    const holding = { fundCode: "000001", shares: 100, costPrice: 1.5, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" };
    await store.save([holding]);
    await expect(store.load()).resolves.toEqual([holding]);
  });

  it("backs up corrupt storage and returns an empty list", async () => {
    await writeFile(path.join(dir, "holdings.json"), "{bad json", "utf8");
    const store = new HoldingStore(dir);
    await expect(store.load()).resolves.toEqual([]);
    const files = await readFile(path.join(dir, "holdings.json.corrupt"), "utf8");
    expect(files).toBe("{bad json");
  });
});
```

- [ ] **Step 2: Write portfolio service tests**

Add `src/main/portfolioService.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { PortfolioService } from "./portfolioService";
import type { FundQuote, Holding } from "../shared/types";

const holding: Holding = {
  fundCode: "000001",
  shares: 1000,
  costPrice: 1.5,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z"
};

const quote: FundQuote = {
  fundCode: "000001",
  name: "Fund A",
  jzrq: "2026-06-30",
  dwjz: 1.52,
  gsz: 1.56,
  gszzl: 1.2,
  gztime: "2026-07-01 10:33"
};

describe("PortfolioService", () => {
  it("adds holdings and refreshes quotes", async () => {
    const service = new PortfolioService({
      load: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined)
    }, vi.fn().mockResolvedValue(quote));

    await service.load();
    await service.addHolding(holding);
    const snapshot = await service.refreshAll();

    expect(snapshot.holdings[0].profitLoss).toBeCloseTo(60);
    expect(snapshot.totalProfitLoss).toBeCloseTo(60);
    expect(snapshot.latestEstimateTime).toBe("2026-07-01 10:33");
  });

  it("marks a holding as error without dropping it", async () => {
    const service = new PortfolioService({
      load: vi.fn().mockResolvedValue([holding]),
      save: vi.fn().mockResolvedValue(undefined)
    }, vi.fn().mockRejectedValue(new Error("network down")));

    await service.load();
    const snapshot = await service.refreshAll();

    expect(snapshot.holdings[0].status).toBe("error");
    expect(snapshot.holdings[0].error).toBe("network down");
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- --run src/main/storage.test.ts src/main/portfolioService.test.ts`

Expected: tests fail because modules do not exist.

- [ ] **Step 4: Implement JSON storage**

Add `src/main/storage.ts`:

```ts
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Holding } from "../shared/types";

export interface HoldingStorage {
  load(): Promise<Holding[]>;
  save(holdings: Holding[]): Promise<void>;
}

export class HoldingStore implements HoldingStorage {
  private readonly filePath: string;

  constructor(private readonly userDataPath: string) {
    this.filePath = path.join(userDataPath, "holdings.json");
  }

  async load(): Promise<Holding[]> {
    try {
      const content = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return [];
      await rename(this.filePath, path.join(this.userDataPath, "holdings.json.corrupt")).catch(() => undefined);
      return [];
    }
  }

  async save(holdings: Holding[]) {
    await mkdir(this.userDataPath, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(holdings, null, 2), "utf8");
  }
}
```

- [ ] **Step 5: Implement portfolio service**

Add `src/main/portfolioService.ts`:

```ts
import { calculateHoldingProfit, summarizePortfolio } from "../shared/profit";
import type { FundQuote, Holding, HoldingProfitView, PortfolioSnapshot } from "../shared/types";
import type { HoldingStorage } from "./storage";

type QuoteFetcher = (fundCode: string) => Promise<FundQuote>;

export class PortfolioService {
  private holdings: Holding[] = [];
  private quoteByCode = new Map<string, FundQuote>();
  private errorByCode = new Map<string, string>();
  private refreshing = false;

  constructor(private readonly storage: HoldingStorage, private readonly fetchQuote: QuoteFetcher) {}

  async load() {
    this.holdings = await this.storage.load();
    return this.snapshot();
  }

  async addHolding(holding: Holding) {
    const existingIndex = this.holdings.findIndex((item) => item.fundCode === holding.fundCode);
    if (existingIndex >= 0) {
      this.holdings[existingIndex] = { ...holding, createdAt: this.holdings[existingIndex].createdAt };
    } else {
      this.holdings.push(holding);
    }
    await this.storage.save(this.holdings);
    return this.snapshot();
  }

  async removeHolding(fundCode: string) {
    this.holdings = this.holdings.filter((holding) => holding.fundCode !== fundCode);
    this.quoteByCode.delete(fundCode);
    this.errorByCode.delete(fundCode);
    await this.storage.save(this.holdings);
    return this.snapshot();
  }

  async refreshAll() {
    this.refreshing = true;
    await Promise.all(this.holdings.map(async (holding) => {
      try {
        const quote = await this.fetchQuote(holding.fundCode);
        this.quoteByCode.set(holding.fundCode, quote);
        this.errorByCode.delete(holding.fundCode);
      } catch (error) {
        this.errorByCode.set(holding.fundCode, error instanceof Error ? error.message : "Refresh failed");
      }
    }));
    this.refreshing = false;
    return this.snapshot();
  }

  snapshot(): PortfolioSnapshot {
    const items: HoldingProfitView[] = this.holdings.map((holding) => {
      const quote = this.quoteByCode.get(holding.fundCode) ?? null;
      const calculated = calculateHoldingProfit(holding, quote);
      const error = this.errorByCode.get(holding.fundCode);
      return {
        ...calculated,
        status: error ? "error" : quote ? "fresh" : "idle",
        error
      };
    });

    const { totalProfitLoss } = summarizePortfolio(items);
    const latestEstimateTime = items.map((item) => item.quote?.gztime).filter(Boolean).sort().at(-1) ?? null;

    return {
      holdings: items,
      totalProfitLoss,
      latestEstimateTime,
      isRefreshing: this.refreshing
    };
  }
}
```

- [ ] **Step 6: Run storage and service tests**

Run: `npm test -- --run src/main/storage.test.ts src/main/portfolioService.test.ts`

Expected: all tests pass.

- [ ] **Step 7: Commit storage and service**

```bash
git add src/main/storage.ts src/main/storage.test.ts src/main/portfolioService.ts src/main/portfolioService.test.ts
git commit -m "feat: add portfolio storage service"
```

## Task 5: IPC And Preload API

**Files:**
- Create: `src/main/ipc.ts`
- Create: `src/shared/ipcChannels.ts`
- Modify: `src/main/main.ts`
- Modify: `src/preload/preload.ts`
- Create: `src/renderer/global.d.ts`

- [ ] **Step 1: Add preload API types**

Add `src/renderer/global.d.ts`:

```ts
import type { Holding, HoldingInput, NormalizeHoldingResult, PortfolioSnapshot } from "../shared/types";

export {};

declare global {
  interface Window {
    fundApp: {
      getSnapshot(): Promise<PortfolioSnapshot>;
      addHolding(input: HoldingInput): Promise<NormalizeHoldingResult | { ok: true; snapshot: PortfolioSnapshot }>;
      removeHolding(fundCode: string): Promise<PortfolioSnapshot>;
      refreshNow(): Promise<PortfolioSnapshot>;
      minimize(): Promise<void>;
      closeToTray(): Promise<void>;
      onSnapshotUpdated(callback: (snapshot: PortfolioSnapshot) => void): () => void;
    };
  }
}
```

- [ ] **Step 2: Implement IPC handlers**

Add `src/shared/ipcChannels.ts`:

```ts
export const CHANNELS = {
  getSnapshot: "portfolio:getSnapshot",
  addHolding: "portfolio:addHolding",
  removeHolding: "portfolio:removeHolding",
  refreshNow: "portfolio:refreshNow",
  minimize: "window:minimize",
  closeToTray: "window:closeToTray",
  snapshotUpdated: "portfolio:snapshotUpdated"
} as const;
```

Add `src/main/ipc.ts`:

```ts
import { BrowserWindow, ipcMain } from "electron";
import { normalizeHoldingInput } from "../shared/holdings";
import { CHANNELS } from "../shared/ipcChannels";
import type { PortfolioService } from "./portfolioService";

export function broadcastSnapshot(window: BrowserWindow | null, snapshot: unknown) {
  window?.webContents.send(CHANNELS.snapshotUpdated, snapshot);
}

export function registerIpc(service: PortfolioService, getWindow: () => BrowserWindow | null) {
  ipcMain.handle(CHANNELS.getSnapshot, () => service.snapshot());
  ipcMain.handle(CHANNELS.addHolding, async (_event, input) => {
    const normalized = normalizeHoldingInput(input);
    if (!normalized.ok) return normalized;
    const snapshot = await service.addHolding(normalized.holding);
    return { ok: true, snapshot };
  });
  ipcMain.handle(CHANNELS.removeHolding, (_event, fundCode: string) => service.removeHolding(fundCode));
  ipcMain.handle(CHANNELS.refreshNow, async () => {
    const snapshot = await service.refreshAll();
    broadcastSnapshot(getWindow(), snapshot);
    return snapshot;
  });
  ipcMain.handle(CHANNELS.minimize, () => getWindow()?.minimize());
  ipcMain.handle(CHANNELS.closeToTray, () => getWindow()?.hide());
}
```

- [ ] **Step 3: Implement preload bridge**

Replace `src/preload/preload.ts`:

```ts
import { contextBridge, ipcRenderer } from "electron";
import { CHANNELS } from "../shared/ipcChannels";
import type { HoldingInput, PortfolioSnapshot } from "../shared/types";

contextBridge.exposeInMainWorld("fundApp", {
  getSnapshot: () => ipcRenderer.invoke(CHANNELS.getSnapshot),
  addHolding: (input: HoldingInput) => ipcRenderer.invoke(CHANNELS.addHolding, input),
  removeHolding: (fundCode: string) => ipcRenderer.invoke(CHANNELS.removeHolding, fundCode),
  refreshNow: () => ipcRenderer.invoke(CHANNELS.refreshNow),
  minimize: () => ipcRenderer.invoke(CHANNELS.minimize),
  closeToTray: () => ipcRenderer.invoke(CHANNELS.closeToTray),
  onSnapshotUpdated: (callback: (snapshot: PortfolioSnapshot) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: PortfolioSnapshot) => callback(snapshot);
    ipcRenderer.on(CHANNELS.snapshotUpdated, listener);
    return () => ipcRenderer.removeListener(CHANNELS.snapshotUpdated, listener);
  }
});
```

- [ ] **Step 4: Wire service into main process**

Replace `src/main/main.ts` with:

```ts
import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchFundQuote } from "./fundApi";
import { broadcastSnapshot, registerIpc } from "./ipc";
import { PortfolioService } from "./portfolioService";
import { HoldingStore } from "./storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let refreshTimer: NodeJS.Timeout | null = null;
let service: PortfolioService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 390,
    height: 330,
    resizable: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) void mainWindow.loadURL(devUrl);
  else void mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
}

async function refreshAndBroadcast() {
  const snapshot = await service.refreshAll();
  broadcastSnapshot(mainWindow, snapshot);
}

app.whenReady().then(async () => {
  service = new PortfolioService(new HoldingStore(app.getPath("userData")), fetchFundQuote);
  registerIpc(service, () => mainWindow);
  createWindow();
  await service.load();
  await refreshAndBroadcast();
  refreshTimer = setInterval(() => void refreshAndBroadcast(), 30_000);
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (refreshTimer) clearInterval(refreshTimer);
});

app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
});
```

- [ ] **Step 5: Add Electron app flag typing**

Create `src/main/electron-app.d.ts`:

```ts
import "electron";

declare module "electron" {
  interface App {
    isQuitting?: boolean;
  }
}
```

- [ ] **Step 6: Run TypeScript build**

Run: `npm run build:electron`

Expected: TypeScript compiles without errors.

- [ ] **Step 7: Commit IPC and preload API**

```bash
git add src/shared/ipcChannels.ts src/main/ipc.ts src/main/main.ts src/main/electron-app.d.ts src/preload/preload.ts src/renderer/global.d.ts
git commit -m "feat: connect portfolio ipc api"
```

## Task 6: Compact Dark React UI

**Files:**
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/styles.css`
- Create: `src/renderer/components/AddHoldingDialog.tsx`
- Create: `src/renderer/components/FundRow.tsx`
- Create: `src/renderer/components/SummaryPanel.tsx`
- Create: `src/renderer/App.test.tsx`

- [ ] **Step 1: Write UI smoke test**

Add `src/renderer/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  window.fundApp = {
    getSnapshot: vi.fn().mockResolvedValue({ holdings: [], totalProfitLoss: 0, latestEstimateTime: null, isRefreshing: false }),
    addHolding: vi.fn(),
    removeHolding: vi.fn(),
    refreshNow: vi.fn(),
    minimize: vi.fn(),
    closeToTray: vi.fn(),
    onSnapshotUpdated: vi.fn().mockReturnValue(() => undefined)
  };
});

describe("App", () => {
  it("renders the monitor title and add controls", async () => {
    render(<App />);
    expect(await screen.findByText("基金实时监控")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("基金代码，如 000001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run UI test to verify failure**

Run: `npm test -- --run src/renderer/App.test.tsx`

Expected: test fails because the current UI only renders placeholder text.

- [ ] **Step 3: Implement summary panel**

Add `src/renderer/components/SummaryPanel.tsx`:

```tsx
import { formatAmount, signClass } from "../../shared/money";

interface SummaryPanelProps {
  totalProfitLoss: number;
  holdingCount: number;
  latestEstimateTime: string | null;
}

export function SummaryPanel({ totalProfitLoss, holdingCount, latestEstimateTime }: SummaryPanelProps) {
  return (
    <section className="summary-panel">
      <span>总实时盈亏</span>
      <div className="summary-line">
        <strong className={signClass(totalProfitLoss)}>{formatAmount(totalProfitLoss)}</strong>
        <small>持仓 {holdingCount} 只 · {latestEstimateTime ? `估值 ${latestEstimateTime.slice(11, 16)}` : "等待刷新"}</small>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement fund row**

Add `src/renderer/components/FundRow.tsx`:

```tsx
import { formatAmount, formatPrice, signClass } from "../../shared/money";
import type { HoldingProfitView } from "../../shared/types";

interface FundRowProps {
  item: HoldingProfitView;
  onRemove(fundCode: string): void;
}

export function FundRow({ item, onRemove }: FundRowProps) {
  const name = item.quote?.name ?? "等待刷新";
  return (
    <article className={`fund-row ${item.status === "error" ? "is-error" : ""}`}>
      <div className="fund-main">
        <strong>{name}</strong>
        <span>
          {item.holding.fundCode} · 估值 {formatPrice(item.currentPrice)} · 成本 {formatPrice(item.holding.costPrice)}
        </span>
        {item.error ? <em>{item.error}</em> : null}
      </div>
      <div className="fund-profit">
        <strong className={signClass(item.profitLoss)}>{formatAmount(item.profitLoss)}</strong>
        <span>{item.quote?.gszzl === null || item.quote?.gszzl === undefined ? "--" : `${formatAmount(item.quote.gszzl)}%`}</span>
      </div>
      <button className="row-remove" aria-label={`删除 ${item.holding.fundCode}`} onClick={() => onRemove(item.holding.fundCode)}>×</button>
    </article>
  );
}
```

- [ ] **Step 5: Implement add holding dialog**

Add `src/renderer/components/AddHoldingDialog.tsx`:

```tsx
import { useState } from "react";
import type { CostInputMode, HoldingInputErrors } from "../../shared/types";

interface AddHoldingDialogProps {
  initialFundCode: string;
  onSubmit(input: { mode: CostInputMode; fundCode: string; shares: string; costPrice?: string; totalAmount?: string }): Promise<HoldingInputErrors | null>;
  onClose(): void;
}

export function AddHoldingDialog({ initialFundCode, onSubmit, onClose }: AddHoldingDialogProps) {
  const [mode, setMode] = useState<CostInputMode>("costPrice");
  const [fundCode, setFundCode] = useState(initialFundCode);
  const [shares, setShares] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [errors, setErrors] = useState<HoldingInputErrors>({});

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = await onSubmit({ mode, fundCode, shares, costPrice, totalAmount });
    if (nextErrors) setErrors(nextErrors);
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <form className="dialog" onSubmit={submit}>
        <div className="dialog-title">
          <strong>添加持仓</strong>
          <button type="button" aria-label="关闭" onClick={onClose}>×</button>
        </div>
        <div className="mode-switch">
          <button type="button" className={mode === "costPrice" ? "active" : ""} onClick={() => setMode("costPrice")}>成本单价</button>
          <button type="button" className={mode === "totalAmount" ? "active" : ""} onClick={() => setMode("totalAmount")}>总投入金额</button>
        </div>
        <label>基金代码<input value={fundCode} onChange={(event) => setFundCode(event.target.value)} /></label>
        {errors.fundCode ? <p className="field-error">{errors.fundCode}</p> : null}
        <label>持有份额<input value={shares} onChange={(event) => setShares(event.target.value)} /></label>
        {errors.shares ? <p className="field-error">{errors.shares}</p> : null}
        {mode === "costPrice" ? (
          <>
            <label>持仓成本单价<input value={costPrice} onChange={(event) => setCostPrice(event.target.value)} /></label>
            {errors.costPrice ? <p className="field-error">{errors.costPrice}</p> : null}
          </>
        ) : (
          <>
            <label>总投入金额<input value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} /></label>
            {errors.totalAmount ? <p className="field-error">{errors.totalAmount}</p> : null}
          </>
        )}
        <button className="primary-action" type="submit">保存</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Implement app shell**

Replace `src/renderer/App.tsx`:

```tsx
import { Minus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { HoldingInputErrors, PortfolioSnapshot } from "../shared/types";
import { AddHoldingDialog } from "./components/AddHoldingDialog";
import { FundRow } from "./components/FundRow";
import { SummaryPanel } from "./components/SummaryPanel";

const emptySnapshot: PortfolioSnapshot = {
  holdings: [],
  totalProfitLoss: 0,
  latestEstimateTime: null,
  isRefreshing: false
};

export function App() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot>(emptySnapshot);
  const [fundCode, setFundCode] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    void window.fundApp.getSnapshot().then(setSnapshot);
    return window.fundApp.onSnapshotUpdated(setSnapshot);
  }, []);

  async function refreshNow() {
    setSnapshot(await window.fundApp.refreshNow());
  }

  async function removeHolding(code: string) {
    setSnapshot(await window.fundApp.removeHolding(code));
  }

  async function submitHolding(input: Parameters<typeof window.fundApp.addHolding>[0]): Promise<HoldingInputErrors | null> {
    const result = await window.fundApp.addHolding(input);
    if ("snapshot" in result) {
      setSnapshot(result.snapshot);
      setDialogOpen(false);
      setFundCode("");
      void refreshNow();
      return null;
    }
    return result.errors;
  }

  return (
    <main className="window-shell">
      <header className="titlebar">
        <div className="brand"><span className="status-dot" />基金实时监控</div>
        <div className="title-actions">
          <button aria-label="刷新" onClick={refreshNow}><RefreshCw size={14} /></button>
          <button aria-label="最小化" onClick={() => window.fundApp.minimize()}><Minus size={14} /></button>
        </div>
      </header>
      <section className="content">
        <SummaryPanel totalProfitLoss={snapshot.totalProfitLoss} holdingCount={snapshot.holdings.length} latestEstimateTime={snapshot.latestEstimateTime} />
        <section className="fund-list">
          {snapshot.holdings.length === 0 ? <p className="empty-state">暂无持仓，请添加基金代码。</p> : snapshot.holdings.map((item) => (
            <FundRow key={item.holding.fundCode} item={item} onRemove={removeHolding} />
          ))}
        </section>
        <form className="add-row" onSubmit={(event) => { event.preventDefault(); setDialogOpen(true); }}>
          <input placeholder="基金代码，如 000001" value={fundCode} onChange={(event) => setFundCode(event.target.value)} />
          <button type="submit">添加</button>
        </form>
      </section>
      <footer>自动刷新 · 30s · {snapshot.latestEstimateTime ? `最近 ${snapshot.latestEstimateTime.slice(11, 16)}` : "等待刷新"}</footer>
      {dialogOpen ? <AddHoldingDialog initialFundCode={fundCode} onSubmit={submitHolding} onClose={() => setDialogOpen(false)} /> : null}
    </main>
  );
}
```

- [ ] **Step 7: Implement compact dark styles**

Replace `src/renderer/styles.css` with styles matching the reference:

```css
:root {
  color-scheme: dark;
  font-family: "Segoe UI", system-ui, sans-serif;
  background: transparent;
  color: #f4f7fb;
  font-variant-numeric: tabular-nums;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-width: 390px;
  min-height: 330px;
  background: transparent;
  overflow: hidden;
}

button, input {
  font: inherit;
}

button {
  cursor: pointer;
}

.window-shell {
  width: 390px;
  min-height: 330px;
  overflow: hidden;
  border-radius: 14px;
  background: #202127;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 45px rgba(20, 24, 32, 0.26);
}

.titlebar {
  height: 52px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  -webkit-app-region: drag;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ff4958;
  box-shadow: 0 0 12px rgba(255, 73, 88, 0.78);
}

.title-actions {
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.title-actions button {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  background: #2a2b31;
  color: #aeb4c0;
}

.content {
  padding: 14px 16px 10px;
}

.summary-panel {
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: #28292f;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.summary-panel > span {
  display: block;
  color: #858b96;
  font-size: 11px;
  margin-bottom: 4px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.summary-line strong {
  font-size: 26px;
  font-weight: 760;
}

.summary-line small {
  color: #7f8792;
  font-size: 11px;
}

.fund-list {
  display: grid;
  gap: 8px;
  min-height: 94px;
}

.fund-row {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 22px;
  gap: 8px;
  align-items: center;
  min-height: 56px;
  padding: 9px 8px 9px 10px;
  border-radius: 8px;
  background: #28292f;
  border: 1px solid rgba(255, 255, 255, 0.055);
}

.fund-main {
  min-width: 0;
}

.fund-main strong,
.fund-main span,
.fund-main em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fund-main strong {
  font-size: 13px;
}

.fund-main span,
.fund-main em,
.fund-profit span {
  margin-top: 3px;
  color: #868d99;
  font-size: 11px;
  font-style: normal;
}

.fund-profit {
  text-align: right;
}

.fund-profit strong {
  display: block;
  font-size: 13px;
}

.row-remove {
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #7f8792;
}

.add-row {
  display: grid;
  grid-template-columns: 1fr 66px;
  gap: 10px;
  margin-top: 14px;
}

.add-row input {
  height: 34px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #2b2c32;
  color: #f4f7fb;
  padding: 0 11px;
  font-size: 12px;
  outline: none;
}

.add-row button,
.primary-action {
  height: 34px;
  border: 0;
  border-radius: 7px;
  background: #244372;
  color: #d8e9ff;
  font-size: 12px;
  font-weight: 700;
}

footer {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606671;
  font-size: 10px;
}

.gain { color: #ff5968; }
.loss { color: #31d0aa; }
.flat { color: #f4f7fb; }

.empty-state {
  display: grid;
  place-items: center;
  min-height: 94px;
  margin: 0;
  color: #7f8792;
  font-size: 12px;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.58);
}

.dialog {
  width: 340px;
  display: grid;
  gap: 9px;
  padding: 14px;
  border-radius: 12px;
  background: #202127;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-title,
.mode-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-title button {
  border: 0;
  background: transparent;
  color: #858b96;
  font-size: 18px;
}

.mode-switch {
  gap: 6px;
  padding: 4px;
  border-radius: 8px;
  background: #2a2b31;
}

.mode-switch button {
  flex: 1;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #9098a4;
  font-size: 11px;
}

.mode-switch button.active {
  background: #244372;
  color: #d8e9ff;
  font-weight: 700;
}

.dialog label {
  display: grid;
  gap: 5px;
  color: #8d95a0;
  font-size: 11px;
}

.dialog input {
  height: 32px;
  padding: 0 9px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #2b2c32;
  color: #f4f7fb;
}

.field-error {
  margin: -3px 0 0;
  color: #ff6b78;
  font-size: 11px;
}
```

- [ ] **Step 8: Run UI test**

Run: `npm test -- --run src/renderer/App.test.tsx`

Expected: UI smoke test passes.

- [ ] **Step 9: Run full test suite**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 10: Commit UI**

```bash
git add src/renderer
git commit -m "feat: build compact fund monitor ui"
```

## Task 7: Tray Icon And App Lifecycle

**Files:**
- Create: `assets/tray.svg`
- Create: `scripts/render-tray-icon.mjs`
- Modify: `package.json`
- Create: `src/main/tray.ts`
- Modify: `src/main/main.ts`

- [ ] **Step 1: Add tray icon source and renderer**

Add `assets/tray.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="56" fill="#202127"/>
  <circle cx="64" cy="66" r="16" fill="#ff4958"/>
  <path d="M54 166h36l28-62 28 88 30-56h30" fill="none" stroke="#d8e9ff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

Add `scripts/render-tray-icon.mjs`:

```js
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const input = path.resolve("assets/tray.svg");
const output = path.resolve("build/icon.png");
await mkdir(path.dirname(output), { recursive: true });
const svg = await readFile(input);
await sharp(svg).resize(256, 256).png().toFile(output);
await writeFile(path.resolve("build/README.md"), "Generated icon assets for packaging.\n");
```

- [ ] **Step 2: Add sharp and icon script**

Modify `package.json`:

```json
{
  "scripts": {
    "build:icon": "node scripts/render-tray-icon.mjs",
    "build": "npm run build:icon && npm run test && npm run build:renderer && npm run build:electron"
  },
  "devDependencies": {
    "sharp": "^0.33.5"
  }
}
```

Keep all existing scripts and dependencies; only add the new script and dependency.

- [ ] **Step 3: Install new dependency**

Run: `npm install`

Expected: `sharp` is added to `package-lock.json`.

- [ ] **Step 4: Implement tray module**

Add `src/main/tray.ts`:

```ts
import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createAppTray(options: {
  getWindow(): BrowserWindow | null;
  refreshNow(): Promise<void>;
}) {
  const iconPath = app.isPackaged
    ? path.join(app.getAppPath(), "build/icon.png")
    : path.join(__dirname, "../../build/icon.png");
  const tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip("基金实时监控");
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: "显示窗口",
      click: () => {
        const window = options.getWindow();
        window?.show();
        window?.focus();
      }
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
  ]));
  tray.on("click", () => {
    const window = options.getWindow();
    window?.show();
    window?.focus();
  });
  return tray;
}
```

- [ ] **Step 5: Wire tray into main process**

Modify `src/main/main.ts`:

```ts
import type { Tray } from "electron";
import { createAppTray } from "./tray";

let appTray: Tray | null = null;

// Inside app.whenReady(), after createWindow():
appTray = createAppTray({
  getWindow: () => mainWindow,
  refreshNow: refreshAndBroadcast
});
```

Ensure `appTray` is module-level so it is not garbage-collected.

- [ ] **Step 6: Build icon and app**

Run: `npm run build`

Expected: `build/icon.png` exists and full build passes.

- [ ] **Step 7: Run app manually in dev**

Run: `npm run dev`

Expected: compact window opens, close hides to tray, tray menu includes show, refresh, and exit. Stop the app via tray exit after verification.

- [ ] **Step 8: Commit tray behavior**

```bash
git add assets scripts build package.json package-lock.json src/main/tray.ts src/main/main.ts
git commit -m "feat: add tray lifecycle"
```

## Task 8: Packaging And Final Verification

**Files:**
- Modify: `package.json` if builder file paths need adjustment.
- Create: `docs/superpowers/verification/2026-07-01-fund-desktop-monitor.md`

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: all unit and UI tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: Vite and TypeScript builds complete, with `dist/`, `dist-electron/`, and `build/icon.png`.

- [ ] **Step 3: Package Windows installer**

Run: `npm run package`

Expected: `release/` contains a Windows installer or unpacked app generated by electron-builder.

- [ ] **Step 4: Launch packaged app**

Run the generated `.exe` from `release/`.

Expected: app opens without requiring `start.bat`; the window uses the compact dark UI.

- [ ] **Step 5: Verify core workflows manually**

Use a test holding:

```text
fundCode: 000001
shares: 1000
costPrice: 1.5
```

Verify:

- Add via cost unit price mode succeeds.
- Remove the holding.
- Add via total invested amount mode with shares `1000` and total amount `1500` succeeds.
- The row refreshes with live quote data.
- Total real-time profit/loss appears.
- The main screen does not show estimated market value.
- Manual refresh works.
- Close hides to tray.
- Tray show restores the window.
- Tray exit quits the app.

- [ ] **Step 6: Record verification**

Add `docs/superpowers/verification/2026-07-01-fund-desktop-monitor.md`:

```md
# Fund Desktop Monitor Verification

Date: 2026-07-01

## Automated

- `npm test`: PASS
- `npm run build`: PASS
- `npm run package`: PASS

## Manual

- Packaged `.exe` launched without `start.bat`: PASS
- Add holding by cost unit price: PASS
- Add holding by total invested amount: PASS
- 30-second refresh observed: PASS
- Manual refresh: PASS
- Main screen excludes estimated market value: PASS
- Close to tray: PASS
- Tray show: PASS
- Tray exit: PASS

## Notes

- Public fund endpoint used: `https://fundgz.1234567.com.cn/js/000001.js`
```

- [ ] **Step 7: Commit packaging verification**

```bash
git add package.json package-lock.json docs/superpowers/verification/2026-07-01-fund-desktop-monitor.md
git commit -m "chore: verify packaged desktop app"
```

## Self-Review

- Spec coverage:
  - `.exe` packaging: Task 8.
  - No separate backend or `start.bat`: Tasks 1, 5, and 8.
  - Compact dark reference UI: Task 6.
  - 30-second refresh: Task 5.
  - Two add modes: Tasks 2 and 6.
  - Public fund endpoint parsing: Task 3.
  - Local JSON persistence: Task 4.
  - Tray close/show/exit behavior: Task 7.
  - Main screen excludes estimated market value: Task 6 and Task 8 verification.
- Placeholder scan: no TBD markers or deferred implementation steps are present.
- Type consistency: `Holding`, `FundQuote`, `PortfolioSnapshot`, `HoldingInput`, `NormalizeHoldingResult`, and IPC channel names are defined before use and reused consistently across tasks.
