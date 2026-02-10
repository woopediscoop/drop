"use client";

import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  roomCode: string;
  onUploaded: () => void;
}

export default function UploadZone({ roomCode, onUploaded }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/rooms/${roomCode}/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(formData);
      });

      setUploading(false);
      setProgress(0);
      onUploaded();
    },
    [roomCode, onUploaded]
  );

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      for (const file of Array.from(fileList)) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragging
          ? "border-blue-500 bg-blue-500/10"
          : "border-gray-800 hover:border-gray-600"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {uploading ? (
        <div>
          <p className="text-gray-300 mb-3">Uploading... {progress}%</p>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-300 text-lg mb-1">
            Drop files here or tap to browse
          </p>
          <p className="text-gray-600 text-sm">
            Files expire with the room
          </p>
        </div>
      )}
    </div>
  );
}
