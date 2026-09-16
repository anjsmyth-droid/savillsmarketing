import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isMarketing } from "@/lib/auth";
import { storage } from "@/lib/storage";

// Files are never exposed as static assets. Every read goes through this
// route so confidentiality/participant checks apply before any bytes are
// streamed — this is the enforcement point storage migration (local disk
// -> Azure Blob/SharePoint) must preserve.
export async function GET(_req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const file = await db.file.findUnique({
    where: { id: fileId },
    include: { request: { include: { participants: true } } },
  });
  if (!file) return new NextResponse("Not found", { status: 404 });

  if (file.request && file.request.confidential && !isMarketing(user)) {
    const allowed =
      file.request.requestorId === user.id || file.request.participants.some((p) => p.userId === user.id);
    if (!allowed) return new NextResponse("Forbidden", { status: 403 });
  }

  const buffer = await storage.read(file.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
