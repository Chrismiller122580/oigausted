/**
 * Normalize category names into URL-safe slugs and back.
 * "Zapatos y Calzado" -> "zapatos-y-calzado"
 */

const ACCENT_MAP: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n', ü: 'u', Á: 'a', É: 'e', Í: 'i', Ó: 'o', Ú: 'u', Ñ: 'n', Ü: 'u'
}

export function categoryToSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function slugToCategory(slug: string, categories: readonly string[]): string | null {
  const normalized = slug.toLowerCase().trim()
  for (const cat of categories) {
    if (categoryToSlug(cat) === normalized) return cat
  }
  // Fallback: try direct accent-stripped match
  const stripped = normalized
    .split('')
    .map((ch) => ACCENT_MAP[ch] || ch)
    .join('')
  for (const cat of categories) {
    if (categoryToSlug(cat) === stripped) return cat
  }
  return null
}

export function allCategorySlugs(categories: readonly string[]): string[] {
  return categories.map(categoryToSlug)
}
