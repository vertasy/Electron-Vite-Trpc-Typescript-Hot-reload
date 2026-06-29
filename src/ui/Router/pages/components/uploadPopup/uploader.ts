import { useUploadStore } from "../../../../store/upload";

export default async function MainUploadFiles() {
  const files = useUploadStore.getState().files;

  if (!files.length) {
    return {
      ok: false,
      message: "No files"
    };
  }

  const getPriority = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return 0;
    if (mimeType.startsWith("audio/")) return 1;
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("word") ||
      mimeType.includes("document") ||
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("presentation") ||
      mimeType.startsWith("text/")
    ) {
      return 2;
    }
    if (mimeType.startsWith("video/")) return 3;

    return 4;
  };

  const formattedFiles = [...files].sort(
    (a, b) => getPriority(a.mimeType) - getPriority(b.mimeType)
  );

  await window.electron.startUpload(formattedFiles);

  return {
    ok: true
  };
}
