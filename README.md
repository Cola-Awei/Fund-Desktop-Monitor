# Fund Desktop Monitor

深色桌面基金实时盈亏监控工具，支持基金持仓添加、30 秒自动刷新、当日盈亏统计、基金关联股票持仓与实时涨跌查看，并可打包为 Windows exe。

## 功能

- 双击 exe 启动桌面小窗口
- 深色无边框窗口，可拖动、缩放、最小化
- 添加基金代码、持有份额、持仓成本单价
- 每 30 秒自动刷新基金实时估值
- 顶部汇总当日实时盈亏
- 亏损显示绿色，盈利显示红色，符合 A 股常见配色
- 点击单个基金查看关联股票：
  - 股票名称和代码
  - 今日涨跌
  - 持仓占比
  - 较上期占比，新进持仓显示“新增”
- 本地保存持仓信息，不上传到服务器

## 数据来源与计算

基金实时估值来自天天基金 `fundgz.1234567.com.cn` 接口。程序使用接口里的：

- `gsz`：实时估值
- `dwjz`：最新单位净值
- `gszzl`：实时估值涨跌幅
- `gztime`：估值时间

当日实时盈亏计算方式：

```text
(实时估值 gsz - 最新单位净值 dwjz) * 持有份额
```

基金关联股票来自东方财富/天天基金基金档案接口，股票实时涨跌来自东方财富行情接口。“较上期占比”按当前报告期持仓占比减上一报告期持仓占比计算；上一期不存在该股票时显示“新增”。

> 注意：盘中估值不是基金公司最终公布净值，仅用于实时参考，最终收益以基金公司公布净值和交易平台数据为准。

## 开发环境

需要安装 Node.js 18 或更高版本。

```bash
npm install
npm run dev
```

## 常用命令

```bash
# 运行测试
npm test

# 构建前端、主进程和 preload
npm run build

# 打包 Windows 目录版 exe
npm run package

# 打包 Windows 安装包
npm run package:installer
```

打包后的目录版 exe 位于：

```text
release/win-unpacked/Fund Desktop Monitor.exe
```

## 本地数据

持仓数据保存在 Electron 的用户数据目录中，文件名为：

```text
holdings.json
```

Windows 上通常位于：

```text
%APPDATA%/fund-desktop-monitor/holdings.json
```

删除或清空该文件即可重置本地持仓。

## 技术栈

- Electron
- React
- TypeScript
- Vite
- Vitest
- electron-builder

## 免责声明

本项目仅用于个人基金持仓监控和学习交流。所有行情、估值和持仓数据均来自公开网络接口，可能存在延迟、缺失或误差。本项目不提供投资建议，不保证数据准确性、完整性和实时性。任何投资决策请以基金公司、交易平台和官方公告为准，风险自担。
