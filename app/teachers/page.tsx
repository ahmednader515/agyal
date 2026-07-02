import { redirect } from "next/navigation";
import { getTeachersFeatureEnabled, listTeachersForHomepage } from "@/lib/db";
import { filterTeachersForStudentProfile, getStudentClassificationContext } from "@/lib/student-classification";
import { TeachersBrowseClient } from "./TeachersBrowseClient";

export const metadata = {
  title: "اختر المدرسين | منصتي التعليمية",
  description: "تصفح مدرسي المنصة والدورات المتاحة لكل مدرس",
};

export default async function TeachersPage() {
  const enabled = await getTeachersFeatureEnabled();
  if (!enabled) {
    redirect("/");
  }
  const [teachersRaw, studentCtx] = await Promise.all([
    listTeachersForHomepage().catch(() => []),
    getStudentClassificationContext(),
  ]);
  const teachers = studentCtx
    ? filterTeachersForStudentProfile(teachersRaw, studentCtx.profile)
    : teachersRaw;

  return <TeachersBrowseClient initialTeachers={teachers} />;
}
