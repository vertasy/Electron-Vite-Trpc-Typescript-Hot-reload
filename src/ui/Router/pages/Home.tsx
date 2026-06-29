import { Link } from "react-router-dom";
import { trpcClient } from "../../trpcClient";
import { toast } from "sonner";
import { useState, useRef } from "react";
import HomeHeader from "./HomeComponents/HomeHeader";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (path: string) => {
    const res = await trpcClient.face.query(path);
    console.log("File path:", res);
  };

  const handleOpen = async () => {
    const res = await window.electron.openMultipleFileDialog();
    const firstFile = res[0];
    if (firstFile) handleFile(firstFile.path);
  };

  return (
    <div className="flex flex-col gap-2 w-full pt-2">
      <HomeHeader />

      <div
        onClick={handleOpen}
        className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer hover:border-gray-600 transition-colors"
      >
        <p className="text-gray-500">Drop an image here or click to select</p>
      </div>
    </div>
  );
}
