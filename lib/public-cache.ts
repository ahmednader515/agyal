import { revalidateTag } from "next/cache";

/** Cross-request cache tags for public, mostly-static data. */
export const PUBLIC_CACHE_TAGS = {
  homepage: "homepage-settings",
  courses: "courses-published",
  categories: "categories",
  reviews: "reviews",
  teachers: "teachers-homepage",
  subscriptionPlans: "subscription-plans",
  storeProducts: "store-products",
  courseContent: (segment: string) => `course-${segment}`,
} as const;

export const PUBLIC_CACHE_REVALIDATE_SECONDS = 60;

export function revalidateHomepageCache(): void {
  revalidateTag(PUBLIC_CACHE_TAGS.homepage, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.teachers, "max");
}

export function revalidateCoursesCache(slug?: string | null, courseId?: string | null): void {
  revalidateTag(PUBLIC_CACHE_TAGS.courses, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.categories, "max");
  const slugKey = slug?.trim();
  if (slugKey) revalidateTag(PUBLIC_CACHE_TAGS.courseContent(slugKey), "max");
  const idKey = courseId?.trim();
  if (idKey) revalidateTag(PUBLIC_CACHE_TAGS.courseContent(idKey), "max");
}

export function revalidateReviewsCache(): void {
  revalidateTag(PUBLIC_CACHE_TAGS.reviews, "max");
}
