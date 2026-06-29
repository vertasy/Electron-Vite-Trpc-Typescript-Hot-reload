import { Link } from "react-router-dom";
import { trpcClient } from "../../trpcClient";
import { toast } from "sonner";
import { useState, useRef } from "react";
import HomeHeader from "./HomeComponents/HomeHeader";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const filePath = window.electron.getPathForFile(file);
    const res = await trpcClient.face.query(filePath);
    console.log("File path:", res);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-2 w-full pt-2">
      <HomeHeader />

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer hover:border-gray-600 transition-colors"
      >
        <p className="text-gray-500">Drop an image here or click to select</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
