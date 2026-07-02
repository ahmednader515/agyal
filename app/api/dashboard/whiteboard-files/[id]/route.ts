import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteWhiteboardFile, getWhiteboardFileById, updateWhiteboardFile } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const file = await getWhiteboardFileById(id);
  if (!file) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({ file });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await getWhiteboardFileById(id);
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let body: {
    title?: string;
    titleAr?: string | null;
    description?: string | null;
    descriptionEn?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  await updateWhiteboardFile(id, {
    title: body.title,
    title_ar: body.titleAr,
    description: body.description ?? undefined,
    description_en: body.descriptionEn,
    sort_order: body.sortOrder,
    is_active: body.isActive,
  });
  const file = await getWhiteboardFileById(id);
  return NextResponse.json({ success: true, file });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await getWhiteboardFileById(id);
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  await deleteWhiteboardFile(id);
  return NextResponse.json({ success: true });
}
