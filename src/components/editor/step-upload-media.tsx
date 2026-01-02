
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

    const MAX_SIZE = 500;

    if (file.type.startsWith("image/")) {
      try {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            let { naturalWidth: width, naturalHeight: height } = img;

            // Scale down if image is too big
            const scale = Math.min(MAX_SIZE / width, MAX_SIZE / height, 1);
            width = Math.round(width * scale);
            height = Math.round(height * scale);

            formData.append("width", String(width));
            formData.append("height", String(height));
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
    <div className="flex flex-col gap-2 max-w-sm p-2 border border-[var(--border)] rounded shadow-sm bg-[var(--background-secondary)] text-[var(--foreground)]">
      <label
        htmlFor="file-upload"
        className="cursor-pointer py-2 px-4 rounded text-center border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:border-[var(--accent)] transition-colors duration-150"
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

      <div className="text-[var(--foreground-muted)] text-sm text-center p-1 border border-[var(--border)] rounded">
        {file ? file.name : "No file chosen"}
      </div>

      {preview && (
        <div className="border border-[var(--border)] rounded p-1 bg-[var(--background)] text-center">
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
        className="py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Upload
      </button>
    </div>
  );
}
