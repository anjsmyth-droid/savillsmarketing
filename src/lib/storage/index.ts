import { LocalStorageProvider } from "./local-provider";
import type { StorageProvider } from "./types";

export type { StorageProvider, PutFileInput, PutFileResult } from "./types";

function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  switch (provider) {
    case "local":
    default:
      return new LocalStorageProvider();
  }
}

export const storage = createStorageProvider();
