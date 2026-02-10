import { NextResponse } from "next/server";
import { getRoom, addFile } from "@/lib/store";
import { saveBlob } from "@/lib/storage";

// Increase body size limit for video uploads
// Note: Vercel has a 4.5MB body size limit on Hobby tier, 4.5MB on Pro without streaming
export const maxDuration = 60; // Allow up to 60 seconds for upload processing

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = await saveBlob(file.name, buffer);
  const entry = await addFile(code, file.name, file.size, storagePath);

  if (!entry) {
    return NextResponse.json({ error: "Room expired" }, { status: 410 });
  }

  return NextResponse.json({
    id: entry.id,
    filename: entry.filename,
    size: entry.size,
    uploadedAt: entry.uploadedAt,
    expiresAt: entry.expiresAt,
  });
}
