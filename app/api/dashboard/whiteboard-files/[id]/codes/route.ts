import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createWhiteboardFileCodes,
  getWhiteboardFileById,
  listWhiteboardFileCodes,
} from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const file = await getWhiteboardFileById(id);
  if (!file) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const codes = await listWhiteboardFileCodes(id);
  return NextResponse.json({ codes });
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const file = await getWhiteboardFileById(id);
  if (!file) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (file.status !== "published") {
    return NextResponse.json({ error: "انشر السبورة أولاً قبل إنشاء الأكواد" }, { status: 400 });
  }

  let body: { count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 500);
  try {
    const created = await createWhiteboardFileCodes(id, count);
    return NextResponse.json({ created, count: created.length });
  } catch (e) {
    console.error("whiteboard file codes POST", e);
    return NextResponse.json({ error: "فشل إنشاء الأكواد" }, { status: 500 });
  }
}
