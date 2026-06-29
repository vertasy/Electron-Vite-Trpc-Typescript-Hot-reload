declare global {
  interface TrpcEvent {
    procedureName: string;
    data: string;
  }
  export type UploadProgress = {
    processed: number;
    total: number;
  };
  export type MainToWorkerMessage =
    | {
        type: "init";
        config: Config;
      }
    | {
        type: "batch";
        files: UploadedFile[];
      }
    | {
        type: "finish";
      };

  export type WorkerToMainMessage =
    | {
        type: "requestBatch";
        processed: number;
      }
    | {
        type: "completed";
      }
    | {
        type: "error";
        error: string;
      };
  type UploadedFile =
    | {
        id: string;
        type: "local";
        mimeType: string;
        name: string;
        path: string;
      }
    | {
        id: string;
        type: "raw";
        mimeType: string;
        name: string;
        file: File;
      }
    | {
        id: string;
        type: "url";
        mimeType: string;
        name: string;
        url: string;
      };

  interface Window {
    electron: {
      sendTrpcEvent(payload: TrpcEvent): Promise<any>;
      getPathForFile(file: File): string;
      openFileDialog(): Promise<{ path: string; name: string } | null>; // ✅ here
      openMultipleFileDialog(): Promise<
        {
          path: string;
          name: string;
          mimeType: string;
        }[]
      >;
      // if you later add the readFile method:
      readFile?(filePath: string): Promise<Buffer>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}

export {};
