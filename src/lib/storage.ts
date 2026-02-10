import { put, del } from "@vercel/blob";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const UPLOADS_DIR = join(process.cwd(), "uploads");

async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export async function saveBlob(
  filename: string,
  data: Buffer
): Promise<string> {
  if (useBlob) {
    const { url } = await put(filename, data, { access: "public" });
    return url;
  }

  await ensureUploadsDir();
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filepath = join(UPLOADS_DIR, safeName);
  await writeFile(filepath, data);
  return filepath;
}

export async function readBlob(storagePath: string): Promise<Buffer> {
  if (useBlob) {
    const res = await fetch(storagePath);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(storagePath);
}

export async function deleteBlob(storagePath: string): Promise<void> {
  if (useBlob) {
    try {
      await del(storagePath);
    } catch {
      // Blob may already be gone
    }
    return;
  }
  try {
    await unlink(storagePath);
  } catch {
    // File may already be gone
  }
}
