"use client";

import { useEffect, useState } from "react";
import { formatBytes } from "@/lib/utils";

interface FileItemProps {
  id: string;
  roomCode: string;
  filename: string;
  size: number;
  expiresAt: number;
  onDelete: (id: string) => void;
}

function useCountdown(expiresAt: number) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, expiresAt - Date.now())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const left = Math.max(0, expiresAt - Date.now());
      setRemaining(left);
      if (left === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function FileItem({
  id,
  roomCode,
  filename,
  size,
  expiresAt,
  onDelete,
}: FileItemProps) {
  const countdown = useCountdown(expiresAt);

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-gray-900 rounded-xl">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{filename}</p>
        <p className="text-sm text-gray-500">
          {formatBytes(size)} &middot; {countdown}
        </p>
      </div>
      <a
        href={`/api/rooms/${roomCode}/files/${id}/download`}
        className="shrink-0 py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
      >
        Download
      </a>
      <button
        onClick={() => onDelete(id)}
        className="shrink-0 py-2 px-3 bg-gray-800 hover:bg-red-900 rounded-lg text-sm text-gray-400 hover:text-red-400 transition-colors"
        title="Delete"
      >
        &times;
      </button>
    </div>
  );
}
