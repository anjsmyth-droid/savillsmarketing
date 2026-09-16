export interface PutFileInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface PutFileResult {
  storageKey: string;
}

// Every caller in the app talks to this interface only. The MVP's
// LocalStorageProvider writes to disk; a production AzureBlobProvider (or
// SharePoint-backed provider) implementing the same three methods can be
// swapped in via STORAGE_PROVIDER with no change to calling code.
export interface StorageProvider {
  put(input: PutFileInput): Promise<PutFileResult>;
  read(storageKey: string): Promise<Buffer>;
  remove(storageKey: string): Promise<void>;
}
