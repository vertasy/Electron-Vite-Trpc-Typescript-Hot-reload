interface UploadProgress {
  processed: number;
  total: number;
}

interface UploadProgress {
  processed: number;
  total: number;
}

interface Window {
  electron: {
    sendTrpcEvent(payload: TrpcEvent): Promise<any>;
    getPathForFile(file: File): string;
    openFileDialog(): Promise<{ path: string; name: string } | null>;
    openMultipleFileDialog(): Promise<
      { path: string; name: string; mimeType: string }[]
    >;
    startUpload(files: UploadedFile[]): Promise<void>;
    onUploadProgress(callback: (progress: UploadProgress) => void): () => void;
    onUploadFileProgress(
      callback: (data: { fileName: string; status: string }) => void
    ): () => void; // ✅ new
    onUploadCompleted(callback: () => void): () => void;
    onUploadError(callback: (error: string) => void): () => void;
    readFile?(filePath: string): Promise<Buffer>;
    openExternal(url: string): Promise<void>;
  };
}
