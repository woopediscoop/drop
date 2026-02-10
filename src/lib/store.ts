import { generateRoomCode, generateFileId, ROOM_TTL_MS } from "./utils";
import { deleteBlob } from "./storage";

export interface Room {
  code: string;
  createdAt: number;
  expiresAt: number;
}

export interface FileEntry {
  id: string;
  roomCode: string;
  filename: string;
  size: number;
  storagePath: string; // local path or blob URL
  uploadedAt: number;
  expiresAt: number;
}

const rooms = new Map<string, Room>();
const files = new Map<string, FileEntry[]>(); // roomCode -> files

export function createRoom(): Room {
  let code: string;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  const now = Date.now();
  const room: Room = {
    code,
    createdAt: now,
    expiresAt: now + ROOM_TTL_MS,
  };
  rooms.set(code, room);
  files.set(code, []);
  return room;
}

export function getRoom(code: string): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;
  if (Date.now() > room.expiresAt) {
    cleanupRoom(code);
    return null;
  }
  return room;
}

export function addFile(
  roomCode: string,
  filename: string,
  size: number,
  storagePath: string
): FileEntry | null {
  const room = getRoom(roomCode);
  if (!room) return null;

  const entry: FileEntry = {
    id: generateFileId(),
    roomCode: roomCode.toUpperCase(),
    filename,
    size,
    storagePath,
    uploadedAt: Date.now(),
    expiresAt: room.expiresAt,
  };

  const roomFiles = files.get(roomCode.toUpperCase()) || [];
  roomFiles.push(entry);
  files.set(roomCode.toUpperCase(), roomFiles);
  return entry;
}

export function getFiles(roomCode: string): FileEntry[] {
  const code = roomCode.toUpperCase();
  const roomFiles = files.get(code) || [];
  const now = Date.now();

  const [active, expired] = roomFiles.reduce<[FileEntry[], FileEntry[]]>(
    ([a, e], f) => (f.expiresAt > now ? [[...a, f], e] : [a, [...e, f]]),
    [[], []]
  );

  // Fire-and-forget cleanup of expired file blobs
  for (const f of expired) {
    deleteBlob(f.storagePath).catch(() => {});
  }

  files.set(code, active);
  return active;
}

export function getFile(roomCode: string, fileId: string): FileEntry | null {
  const roomFiles = getFiles(roomCode);
  return roomFiles.find((f) => f.id === fileId) || null;
}

export function deleteFile(roomCode: string, fileId: string): boolean {
  const code = roomCode.toUpperCase();
  const roomFiles = files.get(code) || [];
  const idx = roomFiles.findIndex((f) => f.id === fileId);
  if (idx === -1) return false;

  const [removed] = roomFiles.splice(idx, 1);
  deleteBlob(removed.storagePath).catch(() => {});
  return true;
}

function cleanupRoom(code: string) {
  const upperCode = code.toUpperCase();
  const roomFiles = files.get(upperCode) || [];
  for (const f of roomFiles) {
    deleteBlob(f.storagePath).catch(() => {});
  }
  rooms.delete(upperCode);
  files.delete(upperCode);
}

// Periodic cleanup every 5 minutes
if (typeof globalThis !== "undefined") {
  const key = "__drop_cleanup_interval__";
  const g = globalThis as Record<string, unknown>;
  if (!g[key]) {
    g[key] = setInterval(() => {
      const now = Date.now();
      for (const [code, room] of rooms) {
        if (now > room.expiresAt) {
          cleanupRoom(code);
        }
      }
    }, 5 * 60 * 1000);
  }
}
