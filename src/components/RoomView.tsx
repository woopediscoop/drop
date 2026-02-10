"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import FileItem from "./FileItem";
import UploadZone from "./UploadZone";
import QrCode from "./QrCode";

interface FileData {
  id: string;
  filename: string;
  size: number;
  uploadedAt: number;
  expiresAt: number;
}

interface RoomData {
  room: { code: string; expiresAt: number };
  files: FileData[];
}

export default function RoomView({ code }: { code: string }) {
  const [data, setData] = useState<RoomData | null>(null);
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (res.status === 404) {
        setExpired(true);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      // Network error, will retry
    }
  }, [code]);

  useEffect(() => {
    const timeout = setTimeout(fetchRoom, 0);
    const interval = setInterval(fetchRoom, 5000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchRoom]);

  async function handleDelete(fileId: string) {
    await fetch(`/api/rooms/${code}/files/${fileId}`, { method: "DELETE" });
    fetchRoom();
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/room/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (expired) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Room Expired</h2>
        <p className="text-gray-400 mb-6">This room has expired or doesn&apos;t exist.</p>
        <Link
          href="/"
          className="py-3 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors inline-block"
        >
          Back to Lobby
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500">
        <p>Connecting to room...</p>
      </div>
    );
  }

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${code}`
      : "";

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
      {/* Room header */}
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-1">Room Code</p>
        <p className="text-4xl font-mono font-bold tracking-[0.3em] mb-3">
          {code}
        </p>
        <button
          onClick={handleCopyLink}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {copied ? "Copied!" : "Copy room link"}
        </button>
      </div>

      {/* QR Code - hidden on small screens */}
      <div className="hidden sm:flex justify-center">
        {roomUrl && <QrCode url={roomUrl} />}
      </div>

      {/* Upload zone */}
      <UploadZone roomCode={code} onUploaded={fetchRoom} />

      {/* File list */}
      {data.files.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-gray-500 px-1">
            Files ({data.files.length})
          </h3>
          {data.files.map((file) => (
            <FileItem
              key={file.id}
              id={file.id}
              roomCode={code}
              filename={file.filename}
              size={file.size}
              expiresAt={file.expiresAt}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {data.files.length === 0 && (
        <p className="text-center text-gray-600 text-sm">
          No files yet. Upload something to get started.
        </p>
      )}
    </div>
  );
}
