"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Lobby() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      const data = await res.json();
      router.push(`/room/${data.code}`);
    } catch {
      setError("Failed to create room");
      setCreating(false);
    }
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) {
      setError("Room code must be 4 characters");
      return;
    }
    router.push(`/room/${code}`);
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-2">Drop</h1>
        <p className="text-gray-400 text-lg">
          Ephemeral file transfer between devices
        </p>
      </div>

      <button
        onClick={handleCreate}
        disabled={creating}
        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-gray-400 rounded-xl text-lg font-semibold transition-colors"
      >
        {creating ? "Creating..." : "Create Room"}
      </button>

      <div className="flex items-center gap-4 w-full">
        <div className="h-px flex-1 bg-gray-800" />
        <span className="text-gray-500 text-sm">or join existing</span>
        <div className="h-px flex-1 bg-gray-800" />
      </div>

      <form onSubmit={handleJoin} className="w-full flex gap-3">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => {
            setJoinCode(e.target.value.toUpperCase().slice(0, 4));
            setError("");
          }}
          placeholder="ABCD"
          maxLength={4}
          className="flex-1 py-4 px-5 bg-gray-900 border border-gray-800 rounded-xl text-center text-2xl font-mono tracking-[0.3em] placeholder:text-gray-700 focus:outline-none focus:border-blue-600 transition-colors"
        />
        <button
          type="submit"
          className="py-4 px-6 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
        >
          Join
        </button>
      </form>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <p className="text-gray-600 text-xs text-center mt-4">
        Files auto-expire after 30 minutes
      </p>
    </div>
  );
}
