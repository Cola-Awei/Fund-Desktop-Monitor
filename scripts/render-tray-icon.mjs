import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const input = path.resolve("assets/tray.svg");
const output = path.resolve("build/icon.png");

await mkdir(path.dirname(output), { recursive: true });
const svg = await readFile(input);
await sharp(svg).resize(256, 256).png().toFile(output);
await writeFile(path.resolve("build/README.md"), "Generated icon assets for packaging.\n");
