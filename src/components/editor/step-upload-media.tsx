"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useEditor } from "@/contexts/editor-context"
import { Media } from "@/generated/prisma"

interface UploadPicProps {
  stepId: string
}

export default function UploadPic({ stepId }: UploadPicProps) {
  const { updateStep } = useEditor()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first")

    setIsUploading(true)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("stepId", stepId)

    const MAX_SIZE = 500
    let uploadWidth = 300
    let uploadHeight = 300

    if (file.type.startsWith("image/")) {
      try {
        await new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            let { naturalWidth: width, naturalHeight: height } = img

            const scale = Math.min(MAX_SIZE / width, MAX_SIZE / height, 1)
            width = Math.round(width * scale)
            height = Math.round(height * scale)

            uploadWidth = width
            uploadHeight = height

            formData.append("width", String(width))
            formData.append("height", String(height))
            resolve()
          }
          img.onerror = () => resolve()
          img.src = preview || URL.createObjectURL(file)
        })
      } catch (e) {

      }
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        setIsUploading(false)
        return alert("Upload failed")
      }

      const data = await res.json()

      const newMedia = {
        id: data.media?.id || crypto.randomUUID(),
        stepId,
        url: data.url || data.media?.url,
        type: file.type.startsWith("image/") ? "IMAGE" : "VIDEO",
        x: 0,
        y: 0,
        z: 0,
        width: uploadWidth,
        height: uploadHeight,
      }

      updateStep(
        (prev) => ({
          ...prev,
          media: [...prev.media, newMedia as Media],
        }),
        "add-media",
      )

      setFile(null)
      setPreview(null)
      setIsUploading(false)
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Upload error:", error)
      setIsUploading(false)
      alert("Upload failed")
    }
  }

  return (
    <div className="flex flex-col gap-2 max-w-sm p-2 border border-[var(--border)] rounded shadow-sm bg-[var(--background-secondary)] text-[var(--foreground)]">
      <label
        htmlFor="file-upload"
        className="cursor-pointer py-2 px-4 rounded text-center border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:border-[var(--accent)] transition-colors duration-150"
      >
        Choose File
      </label>
      <input
        ref={fileInputRef}
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
            <img src={preview || "/placeholder.svg"} alt="Preview" className="max-w-full rounded" />
          ) : (
            <video src={preview} controls className="max-w-full rounded" />
          )}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="py-2 px-4 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  )
}
