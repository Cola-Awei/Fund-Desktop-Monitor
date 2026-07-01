import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Holding } from "../shared/types.js";

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
      await rename(this.filePath, path.join(this.userDataPath, "holdings.json.corrupt")).catch(
        () => undefined,
      );
      return [];
    }
  }

  async save(holdings: Holding[]) {
    await mkdir(this.userDataPath, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(holdings, null, 2), "utf8");
  }
}
