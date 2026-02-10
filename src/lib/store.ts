import { kv } from "@vercel/kv";
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

const KV_ROOM_PREFIX = "room:";
const KV_FILES_PREFIX = "files:";

export async function createRoom(): Promise<Room> {
  let code: string;
  let attempts = 0;
  do {
    code = generateRoomCode();
    attempts++;
    if (attempts > 10) throw new Error("Failed to generate unique room code");
  } while (await kv.exists(`${KV_ROOM_PREFIX}${code}`));

  const now = Date.now();
  const ttlSeconds = Math.floor(ROOM_TTL_MS / 1000);
  const room: Room = {
    code,
    createdAt: now,
    expiresAt: now + ROOM_TTL_MS,
  };

  await kv.set(`${KV_ROOM_PREFIX}${code}`, room, { ex: ttlSeconds });
  await kv.set(`${KV_FILES_PREFIX}${code}`, [], { ex: ttlSeconds });
  return room;
}

export async function getRoom(code: string): Promise<Room | null> {
  const upperCode = code.toUpperCase();
  const room = await kv.get<Room>(`${KV_ROOM_PREFIX}${upperCode}`);
  if (!room) return null;
  if (Date.now() > room.expiresAt) {
    await cleanupRoom(code);
    return null;
  }
  return room;
}

export async function addFile(
  roomCode: string,
  filename: string,
  size: number,
  storagePath: string
): Promise<FileEntry | null> {
  const room = await getRoom(roomCode);
  if (!room) return null;

  const upperCode = roomCode.toUpperCase();
  const entry: FileEntry = {
    id: generateFileId(),
    roomCode: upperCode,
    filename,
    size,
    storagePath,
    uploadedAt: Date.now(),
    expiresAt: room.expiresAt,
  };

  const roomFiles = (await kv.get<FileEntry[]>(`${KV_FILES_PREFIX}${upperCode}`)) || [];
  roomFiles.push(entry);

  const ttlSeconds = Math.floor((room.expiresAt - Date.now()) / 1000);
  await kv.set(`${KV_FILES_PREFIX}${upperCode}`, roomFiles, { ex: Math.max(ttlSeconds, 1) });
  return entry;
}

export async function getFiles(roomCode: string): Promise<FileEntry[]> {
  const code = roomCode.toUpperCase();
  const roomFiles = (await kv.get<FileEntry[]>(`${KV_FILES_PREFIX}${code}`)) || [];
  const now = Date.now();

  const [active, expired] = roomFiles.reduce<[FileEntry[], FileEntry[]]>(
    ([a, e], f) => (f.expiresAt > now ? [[...a, f], e] : [a, [...e, f]]),
    [[], []]
  );

  // Fire-and-forget cleanup of expired file blobs
  for (const f of expired) {
    deleteBlob(f.storagePath).catch(() => {});
  }

  if (expired.length > 0) {
    const room = await getRoom(code);
    if (room) {
      const ttlSeconds = Math.floor((room.expiresAt - Date.now()) / 1000);
      await kv.set(`${KV_FILES_PREFIX}${code}`, active, { ex: Math.max(ttlSeconds, 1) });
    }
  }

  return active;
}

export async function getFile(roomCode: string, fileId: string): Promise<FileEntry | null> {
  const roomFiles = await getFiles(roomCode);
  return roomFiles.find((f) => f.id === fileId) || null;
}

export async function deleteFile(roomCode: string, fileId: string): Promise<boolean> {
  const code = roomCode.toUpperCase();
  const roomFiles = (await kv.get<FileEntry[]>(`${KV_FILES_PREFIX}${code}`)) || [];
  const idx = roomFiles.findIndex((f) => f.id === fileId);
  if (idx === -1) return false;

  const [removed] = roomFiles.splice(idx, 1);
  deleteBlob(removed.storagePath).catch(() => {});

  const room = await getRoom(code);
  if (room) {
    const ttlSeconds = Math.floor((room.expiresAt - Date.now()) / 1000);
    await kv.set(`${KV_FILES_PREFIX}${code}`, roomFiles, { ex: Math.max(ttlSeconds, 1) });
  }

  return true;
}

async function cleanupRoom(code: string) {
  const upperCode = code.toUpperCase();
  const roomFiles = (await kv.get<FileEntry[]>(`${KV_FILES_PREFIX}${upperCode}`)) || [];
  for (const f of roomFiles) {
    deleteBlob(f.storagePath).catch(() => {});
  }
  await kv.del(`${KV_ROOM_PREFIX}${upperCode}`);
  await kv.del(`${KV_FILES_PREFIX}${upperCode}`);
}
