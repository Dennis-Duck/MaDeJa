"use client";

import { useState } from "react";

interface UploadPicProps {
  stepId: string;
  onUploadComplete?: () => void; // callback naar parent
}

export default function UploadPic({ stepId, onUploadComplete }: UploadPicProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("stepId", stepId);

    // If image, try to read natural width/height and append to form
    if (file.type.startsWith("image/")) {
      try {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            formData.append("width", String(img.naturalWidth));
            formData.append("height", String(img.naturalHeight));
            resolve();
          };
          img.onerror = () => resolve();
          img.src = preview || URL.createObjectURL(file);
        });
      } catch (e) {
        // ignore and continue without dimensions
      }
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return alert("Upload failed");

    const data = await res.json();
    console.log("Upload result:", data);

    // Clear form immediately for UX
    setFile(null);
    setPreview(null);

    // Notify parent to refresh step data
    if (onUploadComplete) onUploadComplete(); // notify parent
  };

  return (
    <div className="flex flex-col gap-2 max-w-sm p-2 border rounded shadow-sm">
      <label
        htmlFor="file-upload"
        className="cursor-pointer py-2 px-4 rounded hover:bg-gray-300 text-center"
      >
        Choose File
      </label>
      <input
        id="file-upload"
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div className="text-gray-500 text-sm text-center p-1 border rounded">
        {file ? file.name : "No file chosen"}
      </div>

      {preview && (
        <div className="border rounded p-1 bg-gray-50 text-center">
          {file?.type.startsWith("image/") ? (
            <img src={preview} alt="Preview" className="max-w-full rounded" />
          ) : (
            <video src={preview} controls className="max-w-full rounded" />
          )}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file}
        className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:cursor-not-allowed"
      >
        Upload
      </button>
    </div>
  );
}
