"use client"
import { use } from "react"
import CreateGigForm from "../CreateGigForm"
import { gigCategories } from "@/lib/gig-categories"
import { notFound } from "next/navigation"

export default function CreateGigCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params)
  let categorySlug = resolvedParams.category.toLowerCase().trim()

  // Decode URL-encoded characters (like %C3%B1 → ñ)
  categorySlug = decodeURIComponent(categorySlug)

  console.log("Decoded slug:", categorySlug)

  const category = gigCategories.find(c => c.slug.toLowerCase() === categorySlug)

  if (!category) {
    console.error("Category not found after decode:", categorySlug)
    notFound()
  }

  console.log("✅ Loading category:", category.name, "with slug:", categorySlug)

  return <CreateGigForm initialCategory={categorySlug} />
}
