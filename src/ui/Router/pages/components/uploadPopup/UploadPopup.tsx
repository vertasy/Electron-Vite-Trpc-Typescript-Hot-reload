import { useState } from "react";
import { XIcon, Settings2Icon, UploadIcon } from "lucide-react";
import { useUploadStore } from "../../../../store/upload";
import { Switch } from "../../../../components/switch";
import clsx from "clsx";
import { v4 as uuid } from "uuid";
import MainUploadFiles from "./uploader";
export function UploadPopup() {
  const {
    isOpen,
    close,
    settings,
    setEncrypted,
    setAiCaptioning,
    isEncrypted,
    aiCaptioning
  } = useUploadStore();

  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
      <div className="relative h-[80%] w-fit min-w-[700px] rounded-3xl border border-border bg-background">
        <header className="flex items-center justify-between border-b border-border py-4 px-6 pr-6">
          <div>
            <h1 className="text-2xl font-bold">Upload Files</h1>
            <p className="text-sm opacity-70">
              Upload your files to your Discord server.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="cursor-pointer flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2 hover:border-border-hover"
            >
              <Settings2Icon size={18} />
              <span>Settings</span>
            </button>

            <button
              onClick={close}
              className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2 hover:border-border-hover"
            >
              <span>Close</span>
              <XIcon size={18} />
            </button>
          </div>
        </header>
        {settingsOpen && (
          <header className="flex items-center justify-start gap-5 border-b border-border py-4 px-6 pr-4">
            <div className="flex items-center gap-2">
              <span className="opacity-70">Encrypted</span>
              <Switch
                onCheckedChange={(e) => setEncrypted(e)}
                checked={isEncrypted}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-70">AI Caption</span>
              <Switch
                onCheckedChange={(e) => setAiCaptioning(e)}
                checked={aiCaptioning}
              />
            </div>
          </header>
        )}

        <div className="w-full h-full px-6 py-4">
          <DropDownArea />
          <h3>{useUploadStore.getState().files.length} Files</h3>
          <div className="flex flex-col gap-2 max-h-30 overflow-y-scroll">
            {useUploadStore.getState().files.map((f) => (
              <span key={f.id} className="text-sm opacity-70">
                {f.name}
              </span>
            ))}
          </div>
          <button onClick={MainUploadFiles}>Upload</button>
        </div>
      </div>
    </div>
  );
}

function DropDownArea() {
  const [isDragging, setIsDragging] = useState(false);
  const handleOpenDialog = async () => {
    const result = await window.electron.openMultipleFileDialog();
    if (!result) return; // user cancelled
    for (let i = 0; i < result.length; i++) {
      const id = uuid();
      addFile({
        id,
        type: "local",
        name: result[i].name,
        path: result[i].path,
        mimeType: result[i].mimeType
      });
    }
  };
  //files
  const { files, addFile, addFiles, removeFile, clear } = useUploadStore();
  const handleFilesUpload = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const Localfiles = e.dataTransfer.files;
    if (!Localfiles) return;

    for (let i = 0; i < Localfiles.length; i++) {
      const id = uuid();
      const path = window.electron.getPathForFile(Localfiles[i]);
      if (path) {
        //local file
        addFile({
          id,
          type: "local",
          name: Localfiles[i].name,
          path,
          mimeType: Localfiles[i].type
        });
      } else {
        addFile({
          id,
          type: "raw",
          name: Localfiles[i].name,
          mimeType: Localfiles[i].type,
          file: Localfiles[i]
        });
      }
    }
  };

  return (
    <div
      onClick={handleOpenDialog}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={handleFilesUpload}
      className={clsx(
        "h-50 hover:border-border-hover w-full rounded-3xl border flex items-center justify-center transition-all",
        isDragging ? "border-dashed bg-muted" : "border-border bg-muted/30"
      )}
    >
      <div className="flex flex-col items-center gap-2 pointer-events-none select-none">
        <span>
          <UploadIcon />
        </span>
        <span className="text-sm opacity-70 text-center max-w-[130px]">
          Click here or drag and drop to upload
        </span>
      </div>
    </div>
  );
}
