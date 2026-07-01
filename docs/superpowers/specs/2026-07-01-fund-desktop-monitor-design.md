# Fund Desktop Monitor Design

## Summary

Build a Windows desktop fund monitor as a single Electron application. The user launches it by double-clicking the packaged `.exe`; no separate backend service, script, or `start.bat` is required.

The app monitors China mainland public mutual funds identified by 6-digit fund codes. It refreshes fund estimate data every 30 seconds, calculates real-time profit/loss from the user's holding quantity and cost basis, and continues refreshing from the system tray after the window is closed.

## Goals

- Package the app as a Windows `.exe`.
- Start the full app from the `.exe` without a separate backend process.
- Use a compact dark desktop window inspired by the user's reference image.
- Refresh fund estimate data every 30 seconds.
- Support adding holdings with either cost unit price or total invested amount.
- Persist holdings locally so data survives restarts.
- Keep running from the tray when the user closes the window.

## Non-Goals

- Do not build a separate backend service.
- Do not require `start.bat` or any manual service startup.
- Do not show estimated market value on the main screen.
- Do not support non-mainland mutual fund instruments in the first version.
- Do not add historical profit charts, SQLite storage, account sync, or cloud backup in the first version.

## Technology

- Desktop shell: Electron.
- UI: React with Vite.
- Packaging: electron-builder for Windows `.exe`.
- Local storage: JSON file in Electron's user data directory.
- Main-renderer boundary: Electron preload APIs with IPC; the renderer must not access Node APIs directly.

## Visual Design

The main window follows the user's preferred reference style:

- Compact floating panel, approximately 390 px wide.
- Deep gray/black background.
- Rounded outer window corners.
- Header with a red status dot, a Chinese title meaning "fund real-time monitor", and compact icon buttons for refresh and minimize.
- Main content prioritizes total real-time profit/loss and the fund list.
- Bottom status text shows automatic refresh cadence and last update time.
- No visible setup instructions, backend warnings, or `start.bat` messaging.

The color system should remain restrained and readable:

- Background: deep neutral gray/black.
- Surfaces: slightly lighter dark gray.
- Borders: low-contrast gray.
- Primary action: muted blue button.
- Profit: red.
- Loss: green.
- Text: high-contrast off-white for primary text and muted gray for secondary text.

Numbers should use tabular figures to prevent layout shift during refreshes.

## Main Window

The main window contains:

- Header:
  - Status dot.
  - Chinese app title meaning "fund real-time monitor".
  - Manual refresh button.
  - Minimize button.
- Summary:
  - Total real-time profit/loss label.
  - Total profit/loss amount.
  - Small metadata such as holding count and latest estimate time.
- Holding list:
  - Fund name.
  - Fund code.
  - Current estimate or latest net value.
  - Cost unit price.
  - Per-fund real-time profit/loss.
  - Estimate percentage change.
- Add row:
  - Fund code input.
  - Add button.
- Footer:
  - Automatic refresh cadence, fixed at 30 seconds, plus latest update time.

The main screen must not show estimated market value.

## Add Holding Flow

The user enters a 6-digit fund code in the main input and clicks the add button.

The app opens a compact add/edit holding dialog. The dialog supports two mutually exclusive cost input modes:

1. Cost unit price mode:
   - Fund code.
   - Holding shares.
   - Holding cost unit price.

2. Total invested amount mode:
   - Fund code.
   - Holding shares.
   - Total invested amount.

Internally both modes normalize to:

- `fundCode`
- `shares`
- `costPrice`

When total invested amount is used:

```text
costPrice = totalInvestedAmount / shares
```

Validation rules:

- Fund code must be exactly 6 digits.
- Shares must be greater than 0.
- Cost unit price must be greater than 0 when using cost unit price mode.
- Total invested amount must be greater than 0 when using total invested amount mode.
- The app should show inline validation errors near the relevant field.

## Data Source

The first version uses a public fund estimate endpoint for mainland mutual fund codes:

```text
https://fundgz.1234567.com.cn/js/{fundCode}.js
```

The response includes fund code, fund name, latest net value date, latest unit net value, intraday estimate, estimate change percentage, and estimate time.

The app should parse the JSONP response in the Electron main process, not in the renderer.

## Refresh Behavior

- Refresh all holdings immediately after app startup.
- Refresh all holdings every 30 seconds while the app is running.
- Manual refresh triggers the same refresh path.
- Closing the window hides it to the tray; the 30-second refresh loop continues.
- Choosing the tray exit command stops the refresh loop and exits the app.

If a refresh fails for a fund:

- Keep the last successful value for that fund if available.
- Mark that fund row as stale or failed.
- Do not stop refreshing other holdings.
- Retry on the next scheduled refresh.

## Profit/Loss Calculation

For each holding, choose the current price in this order:

1. Intraday estimate (`gsz`) when present and numeric.
2. Latest unit net value (`dwjz`) when the intraday estimate is unavailable.

Per-fund real-time profit/loss:

```text
profitLoss = (currentPrice - costPrice) * shares
```

Total real-time profit/loss:

```text
totalProfitLoss = sum(profitLoss for all holdings)
```

Display values should be rounded for presentation, but calculations should use numeric values internally.

## Local Persistence

Use a JSON file in Electron's user data directory, for example:

```text
holdings.json
```

The file stores:

- `fundCode`
- `shares`
- `costPrice`
- `createdAt`
- `updatedAt`

Fetched quote data is runtime state. It may be cached in memory during the app session, but holding configuration is the persistent source of truth.

## Tray Behavior

The app creates a system tray icon on startup.

Tray menu:

- Show window: show and focus the main window.
- Refresh now: refresh all holdings.
- Exit: stop the refresh timer and exit the app.

Window close behavior:

- Clicking the window close button hides the window.
- It does not quit the app.
- The app continues refreshing in the tray.

## Error States

The UI should cover:

- Empty state: no holdings added yet.
- Invalid fund code.
- Failed fund lookup when adding.
- Refresh failure for one or more funds.
- Offline or network timeout.
- Corrupt local JSON storage file.

For corrupt storage, the app should avoid crashing and surface a recoverable error. A backup or reset path can be planned during implementation if needed.

## Testing And Verification

Implementation should verify:

- The app starts from the development command.
- The packaged Windows app starts from the generated `.exe`.
- Adding a holding with cost unit price calculates profit/loss correctly.
- Adding a holding with total invested amount calculates cost unit price correctly.
- Invalid input shows clear validation errors.
- Startup refresh runs.
- Automatic 30-second refresh runs.
- Manual refresh runs.
- A failed fund endpoint does not break other holdings.
- Holdings persist after app restart.
- Closing the window keeps the app running in the tray.
- Tray exit closes the app.

## Implementation Approach

Use the simple single-app approach:

- Electron main process owns app lifecycle, tray, timers, file storage, and fund API requests.
- React renderer owns display, dialogs, validation UI, and user interactions.
- Preload exposes a small typed API for holdings and refresh actions.

This avoids the separate-backend failure mode shown in the reference image while keeping the first version focused and maintainable.
