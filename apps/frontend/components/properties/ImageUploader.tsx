"use client";

// ============================================================
// IMAGE UPLOADER
// ============================================================
// The file picker + selected-files list + upload button shared by the new
// and edit pages. It owns which files are picked; the parent does the
// actual upload (they upload to different endpoints / moments), so it
// just calls `onUpload(files)` with what was picked.
//
// Backend limits to restate: max 5 files, 5 MB each, JPEG/PNG/WEBP.
// ============================================================

import { useState, type ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";
import Alert from "../ui/Alert";

type ImageUploaderProps = {
  onUpload: (files: File[]) => void | Promise<void>;
  uploading?: boolean;
  error?: string | null;
  maxFiles?: number;
};

export default function ImageUploader({
  onUpload,
  uploading = false,
  error = null,
  maxFiles = 5,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    // Backend rejects anything beyond 5 in one request.
    setFiles(picked.slice(0, maxFiles));
  }

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFiles}
        className="block w-full border border-dashed border-line px-4 py-5 text-sm"
      />

      {files.length > 0 && (
        <p className="panel-note">
          {files.length} file{files.length > 1 ? "s" : ""} selected:{" "}
          {files.map((file) => file.name).join(", ")}
        </p>
      )}

      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <button
        type="button"
        onClick={() => onUpload(files)}
        disabled={uploading || files.length === 0}
        className="btn btn-light btn-sm mt-4"
      >
        <ImagePlus className="h-4 w-4" aria-hidden />
        {uploading ? "Uploading…" : `Upload ${files.length || ""}`.trim()}
      </button>
    </div>
  );
}