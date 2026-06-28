import { revalidatePath, revalidateTag } from "next/cache";

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

const TAG_PROFILE = "max" as const;

function purgeTag(tag: string): void {
  revalidateTag(tag, TAG_PROFILE);
}

/** Bust cached HTML for public listing pages. */
export function revalidatePublicPaths(): void {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/teachers");
}

function revalidateCoursePath(slugOrId: string): void {
  const segment = slugOrId.trim();
  if (!segment) return;
  revalidatePath(`/courses/${segment}`);
}

export function revalidateHomepageCache(): void {
  purgeTag(PUBLIC_CACHE_TAGS.homepage);
  purgeTag(PUBLIC_CACHE_TAGS.teachers);
  purgeTag(PUBLIC_CACHE_TAGS.reviews);
  purgeTag(PUBLIC_CACHE_TAGS.courses);
  purgeTag(PUBLIC_CACHE_TAGS.categories);
  purgeTag(PUBLIC_CACHE_TAGS.subscriptionPlans);
  purgeTag(PUBLIC_CACHE_TAGS.storeProducts);
  revalidatePublicPaths();
}

export function revalidateCoursesCache(slug?: string | null, courseId?: string | null): void {
  purgeTag(PUBLIC_CACHE_TAGS.courses);
  purgeTag(PUBLIC_CACHE_TAGS.categories);
  revalidatePublicPaths();

  const slugKey = slug?.trim();
  const idKey = courseId?.trim();
  if (slugKey) {
    purgeTag(PUBLIC_CACHE_TAGS.courseContent(slugKey));
    revalidateCoursePath(slugKey);
  }
  if (idKey && idKey !== slugKey) {
    purgeTag(PUBLIC_CACHE_TAGS.courseContent(idKey));
    revalidateCoursePath(idKey);
  }
}

export function revalidateReviewsCache(): void {
  purgeTag(PUBLIC_CACHE_TAGS.reviews);
  revalidatePath("/");
}
