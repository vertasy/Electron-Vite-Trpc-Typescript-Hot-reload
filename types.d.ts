declare global {
  interface TrpcEvent {
    procedureName: string;
    data: string;
  }
  export type UploadProgress = {
    processed: number;
    total: number;
  };
  type FileProgressMessage = {
    type: "fileProgress";
    fileName: string;
    status: "processing" | "completed";
  };
  export type MainToWorkerMessage =
    | {
        type: "init";
        config: Config;
      }
    | {
        type: "batch";
        groupId: string;
        files: UploadedFile[];
      }
    | {
        type: "finish";
        groupId: string;
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
        data?: Uint8Array;
        file: File;
      }
    | {
        id: string;
        type: "url";
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
