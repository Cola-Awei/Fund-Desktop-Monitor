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
    let content: string;
    try {
      content = await readFile(this.filePath, "utf8");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return [];
      throw error;
    }

    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      await rename(this.filePath, path.join(this.userDataPath, "holdings.json.corrupt"));
      return [];
    }
  }

  async save(holdings: Holding[]) {
    await mkdir(this.userDataPath, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(holdings, null, 2), "utf8");
  }
}
