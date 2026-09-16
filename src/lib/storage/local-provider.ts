import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import type { PutFileInput, PutFileResult, StorageProvider } from "./types";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

/**
 * Local-disk storage for MVP development only. Files are never served as
 * static assets — they are always read server-side and streamed through
 * an authenticated route (src/app/api/files/[fileId]/route.ts) which
 * checks the owning Request's confidentiality/participants first.
 *
 * Production replacement: AzureBlobProvider / SharePointProvider
 * implementing StorageProvider, selected via STORAGE_PROVIDER.
 */
export class LocalStorageProvider implements StorageProvider {
  private async ensureRoot() {
    await mkdir(UPLOAD_ROOT, { recursive: true });
  }

  async put({ buffer, filename }: PutFileInput): Promise<PutFileResult> {
    await this.ensureRoot();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `${randomUUID()}-${safeName}`;
    await writeFile(path.join(UPLOAD_ROOT, storageKey), buffer);
    return { storageKey };
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(path.join(UPLOAD_ROOT, storageKey));
  }

  async remove(storageKey: string): Promise<void> {
    await rm(path.join(UPLOAD_ROOT, storageKey), { force: true });
  }
}
