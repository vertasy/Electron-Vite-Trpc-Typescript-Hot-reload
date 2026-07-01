import { useEffect, useState } from "react";

export function UploadProgress() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  useEffect(() => {
    window.electron.onUploadFileProgress((data) => {
      if (data.status === "processing") {
        console.log(`Uploading: ${data.fileName}`);
        setCurrentFile(data.fileName);
      } else {
        // Optionally clear the indicator when done, or let it be overwritten by next file
        // setCurrentFile(null);
      }
    });
  }, []);

  if (!currentFile) return null;

  return (
    <div className="upload-progress">
      <p>Uploading: {currentFile}</p>
      {/* optionally add a spinner */}
    </div>
  );
}
