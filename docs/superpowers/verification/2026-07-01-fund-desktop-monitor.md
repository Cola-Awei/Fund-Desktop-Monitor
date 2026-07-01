# Fund Desktop Monitor Verification

Date: 2026-07-01

## Automated

- `npm test`: PASS
- `npm run build`: PASS
- `npm run package`: PASS

## Packaged App

- Output: `release/win-unpacked/Fund Desktop Monitor.exe`
- Packaged `.exe` launched directly without `start.bat`: PASS
- Renderer loaded from packaged `app.asar/dist/index.html`: PASS
- Preload API exposed as `window.fundApp`: PASS

## Manual / CDP-Assisted

- Main UI renders `基金实时监控`: PASS
- Main UI excludes `估算市值`: PASS
- Add holding by cost unit price (`000001`, shares `1000`, cost price `1.5`): PASS
- Add holding by total invested amount (`000001`, shares `1000`, total amount `1500`): PASS
- Total amount mode calculated cost price `1.5`: PASS
- Manual refresh returned fresh quote data for `华夏成长混合`: PASS
- Test holding cleanup: PASS
- Close-to-tray lifecycle is covered by `src/main/tray.test.ts`: PASS

## Notes

- Public fund endpoint used: `https://fundgz.1234567.com.cn/js/000001.js`
- `npm run package` builds the reliable no-install Windows app directory because NSIS installer creation requires downloading `nsis-3.0.4.1.7z` from GitHub, which timed out in this environment.
- `npm run package:installer` remains available for generating an NSIS installer when that download path is reachable.
