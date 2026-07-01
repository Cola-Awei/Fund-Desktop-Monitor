import { build } from "esbuild";

await build({
  entryPoints: ["src/preload/preload.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  external: ["electron"],
  outfile: "dist-electron/preload/preload.cjs"
});
