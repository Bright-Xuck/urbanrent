"use client";

// ============================================================
// IMAGE UPLOADER
// ============================================================
// File picker + selected-files list + upload button shared by the new and
// edit pages. It owns which files are picked; the parent does the actual
// upload (different endpoints / moments), so it just calls `onUpload(files)`
// with what was picked.
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
  const [picked, setPicked] = useState<File[]>([]);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Backend rejects anything beyond 5 in one request.
    setPicked(files.slice(0, maxFiles));
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

      {picked.length > 0 && (
        <p className="panel-note">
          {picked.length} file{picked.length > 1 ? "s" : ""} selected:{" "}
          {picked.map((file) => file.name).join(", ")}
        </p>
      )}

      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <button
        type="button"
        onClick={() => onUpload(picked)}
        disabled={uploading || picked.length === 0}
        className="btn btn-light btn-sm mt-4"
      >
        <ImagePlus className="h-4 w-4" aria-hidden />
        {uploading ? "Uploading…" : `Upload ${picked.length || ""}`.trim()}
      </button>
    </div>
  );
}