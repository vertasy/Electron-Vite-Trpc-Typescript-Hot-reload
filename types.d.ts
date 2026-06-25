declare global {
  interface TrpcEvent {
    procedureName: string;
    data: string;
  }

  interface Window {
    electron: {
      sendTrpcEvent(payload: TrpcEvent): Promise<any>;
    };
  }
}

export {};
