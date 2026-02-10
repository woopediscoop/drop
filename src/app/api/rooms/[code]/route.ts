import { NextResponse } from "next/server";
import { getRoom, getFiles } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });
  }

  const filesData = await getFiles(code);
  const files = filesData.map((f) => ({
    id: f.id,
    filename: f.filename,
    size: f.size,
    uploadedAt: f.uploadedAt,
    expiresAt: f.expiresAt,
  }));

  return NextResponse.json({ room, files });
}
