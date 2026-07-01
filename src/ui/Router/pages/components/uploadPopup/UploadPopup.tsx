import { useState } from "react";
import {
  XIcon,
  Settings2Icon,
  UploadIcon,
  TrashIcon,
  Link,
  LinkIcon
} from "lucide-react";
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
    aiCaptioning,
    isLoading
  } = useUploadStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [urlForm, setUrlForm] = useState(false);
  const [url, setUrl] = useState("");
  const { addFile } = useUploadStore();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50  flex items-center justify-center bg-black/80">
      <div className="relative flex h-fit min-h-[400px] max-h-[600px]  w-[700px] flex-col rounded-3xl border border-border bg-background">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="">
            <h1 className="text-2xl font-bold">Upload Files</h1>
            <p className="text-sm opacity-70">
              Upload your files to your Discord server.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setUrlForm(!settingsOpen)}
              className="flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2 hover:border-border-hover"
            >
              <Link size={18} />
              <span>Add Url</span>
            </button>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2 hover:border-border-hover"
            >
              <Settings2Icon size={18} />
              <span>Settings</span>
            </button>

            <button
              onClick={close}
              className="cursor-pointer flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2 hover:border-border-hover"
            >
              <span>Close</span>
              <XIcon size={18} />
            </button>
          </div>
        </header>

        {settingsOpen && (
          <header className="flex items-center gap-5 border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="opacity-70">Encrypted</span>
              <Switch checked={isEncrypted} onCheckedChange={setEncrypted} />
            </div>

            <div className="flex items-center gap-2">
              <span className="opacity-70">AI Caption</span>
              <Switch
                checked={aiCaptioning}
                onCheckedChange={setAiCaptioning}
              />
            </div>
          </header>
        )}

        {urlForm && (
          <header className="flex items-center gap-5 border-b border-border px-6 py-4">
            <input
              type="text"
              placeholder="Enter Url"
              className="w-full h-full outline-none border-none"
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={() => {
                if (url === "") return;
                const id = uuid();
                // useUploadStore.getState().addUrl(url);
                setUrlForm(false);
                addFile({ id: id, type: "url", url });
              }}
              className="cursor-pointer flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2 hover:border-border-hover"
            >
              <span>Add</span>
            </button>
          </header>
        )}

        <div className="flex flex-1 min-h-0 flex-col px-6 py-4">
          <UploadProgress />
          <DropDownArea />

          <button
            onClick={MainUploadFiles}
            className="disabled:opacity-50 disabled:cursor-not-allowed flex cursor-pointer items-center my-2 justify-center gap-2 rounded-2xl border border-border bg-foreground text-background px-4 py-2 hover:border-border-hover"
            disabled={isLoading || useUploadStore.getState().files.length === 0}
          >
            {isLoading ? "Uploading..." : "Upload Files"}
            <UploadIcon size={18} />
          </button>

          <div className="flex-1 min-h-0 overflow-y-auto rounded-lg">
            <div className="flex flex-col gap-2 p-2">
              {useUploadStore.getState().files.map((f) => (
                <PreviewCard key={f.id} file={f} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { FileIcon, defaultStyles } from "react-file-icon";
import { UploadProgress } from "./progress";

function PreviewCard({ file }: { file: UploadedFile }) {
  const { removeFile } = useUploadStore();
  if (file.type === "local") {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    console.log(`local://${encodeURIComponent(file.path)}`);
    return (
      <div className="flex gap-10 justify-between border border-border rounded-2xl p-2">
        <div className="flex gap-2">
          {file.mimeType.startsWith("image/") && (
            <img
              src={`local://${encodeURIComponent(file.path)}`}
              alt={file.name}
              className="h-auto w-30 object-cover rounded-2xl"
            />
          )}
          {file.mimeType.startsWith("application") && (
            <span className="h-auto w-30 max-w-30 min-w-30 object-cover rounded-2xl">
              <FileIcon
                extension={extension}
                {...(defaultStyles[extension as keyof typeof defaultStyles] ??
                  defaultStyles.txt)}
              />
            </span>
          )}
          {file.mimeType.startsWith("video") && (
            <video
              src={`local://${encodeURIComponent(file.path)}`}
              muted
              playsInline
              preload="metadata"
              controls
              className="w-30 rounded-2xl"
            />
          )}

          <div>
            <h2 className={"break-all font-semibold"}>{file.name}</h2>
            <h3 className={"text-sm opacity-70"}>
              {file.mimeType} • {file.type}
            </h3>
            <h3 className={"text-sm opacity-70 w-full break-all"}>
              {file.path}
            </h3>
          </div>
        </div>
        <div
          onClick={() => removeFile(file.id)}
          className="self-stretch w-30! hover:bg-rose-600 min-w-25 max-w-25 group cursor-pointer rounded-2xl border border-rose-600 flex items-center justify-center"
        >
          <TrashIcon className="text-rose-600 group-hover:text-foreground group-hover:animate-bounce" />
        </div>
      </div>
    );
  } else if (file.type === "raw") {
    return (
      <div className="flex gap-10 justify-between border border-border rounded-2xl p-2">
        <div className="flex gap-2">
          {file.mimeType.startsWith("image/") && (
            <img
              src={URL.createObjectURL(file.file)}
              alt={file.name}
              className="h-auto w-30 object-cover rounded-2xl"
            />
          )}

          <div>
            <h2 className={"break-all font-semibold"}>{file.name}</h2>
            <h3 className={"text-sm opacity-70"}>
              {file.mimeType} • {file.type}
            </h3>
          </div>
        </div>
        <div
          onClick={() => removeFile(file.id)}
          className="self-stretch w-30! hover:bg-rose-600 min-w-25 max-w-25 group cursor-pointer rounded-2xl border border-rose-600 flex items-center justify-center"
        >
          <TrashIcon className="text-rose-600 group-hover:text-foreground group-hover:animate-bounce" />
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex gap-10 justify-between border border-border rounded-2xl p-2">
        <div className="flex gap-2">
          <span className="h-auto w-30 max-w-30 min-w-30 object-cover rounded-2xl flex items-center justify-center">
            <LinkIcon className="text-foreground" size={30} />
          </span>
          <div>
            <h2 className={"break-all font-semibold"}>{file.url}</h2>
            <h3 className={"text-sm opacity-70"}>{file.type}</h3>
          </div>
        </div>
        <div
          onClick={() => removeFile(file.id)}
          className="self-stretch w-30! hover:bg-rose-600 min-w-25 max-w-25 group cursor-pointer rounded-2xl border border-rose-600 flex items-center justify-center"
        >
          <TrashIcon className="text-rose-600 group-hover:text-foreground group-hover:animate-bounce" />
        </div>
      </div>
    );
  }
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
        console.log("raw file");
        const fileBuffer = await Localfiles[i].arrayBuffer();
        const uint8Array = new Uint8Array(fileBuffer);
        addFile({
          id,
          type: "raw",
          name: Localfiles[i].name,
          mimeType: Localfiles[i].type,
          data: uint8Array,
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
      <div className="flex flex-col items-center gap-2 pointer-events-none select-none py-4">
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
