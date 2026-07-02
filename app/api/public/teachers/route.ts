import { NextResponse } from "next/server";
import { getTeachersFeatureEnabled, listTeachersForHomepage } from "@/lib/db";
import { filterTeachersForStudentProfile, getStudentClassificationContext } from "@/lib/student-classification";

export const dynamic = "force-dynamic";

export async function GET() {
  const enabled = await getTeachersFeatureEnabled();
  if (!enabled) {
    return NextResponse.json({ error: "الميزة غير مفعّلة" }, { status: 404 });
  }
  const [teachersRaw, studentCtx] = await Promise.all([
    listTeachersForHomepage(),
    getStudentClassificationContext(),
  ]);
  const teachers = studentCtx
    ? filterTeachersForStudentProfile(teachersRaw, studentCtx.profile)
    : teachersRaw;
  return NextResponse.json({ teachers });
}
