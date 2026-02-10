import { NextResponse } from "next/server";
import { deleteFile } from "@/lib/store";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const deleted = await deleteFile(code, id);
  if (!deleted) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
