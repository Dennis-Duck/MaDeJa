"use client";

import { useState } from "react";

export default function UploadPic({ stepId }: { stepId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile)); // preview in browser
  };

  const handleUpload = async () => {
    if (!file) return alert("Selecteer eerst een bestand");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("stepId", stepId);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Upload result:", data);
    alert("Upload klaar!");
  };

  return (
    <div>
      <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
      {preview && <img src={preview} alt="preview" width={200} />}
      <button onClick={handleUpload} disabled={!file}>Upload</button>
    </div>
  );
}
