import { NextResponse } from "next/server";
import { getFile } from "@/lib/store";
import { readBlob } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const file = await getFile(code, id);
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const data = await readBlob(file.storagePath);

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.filename)}"`,
      "Content-Length": String(data.length),
    },
  });
}
