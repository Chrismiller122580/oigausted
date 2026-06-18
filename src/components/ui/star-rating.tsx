import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  max?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  reviewCount?: number
  className?: string
  interactive?: boolean
  onChange?: (rating: number) => void
}

const sizeMap = {
  sm: { icon: "h-3 w-3", text: "text-xs" },
  md: { icon: "h-4 w-4", text: "text-sm" },
  lg: { icon: "h-5 w-5", text: "text-base" },
}

export function StarRating({
  rating,
  max = 5,
  size = "md",
  showValue = false,
  reviewCount,
  className,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizes = sizeMap[size]

  const starClassName = (filled: boolean) =>
    cn(
      sizes.icon,
      "shrink-0",
      filled
        ? "fill-amber-400 text-amber-400"
        : "fill-transparent text-muted-foreground/40"
    )

  return (
    <div className={cn("inline-flex items-center gap-0.5 leading-none", className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating)

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(i + 1)}
              className="inline-flex min-h-0 min-w-0 h-auto w-auto p-0 cursor-pointer hover:scale-110 transition-transform"
              aria-label={`Calificar ${i + 1} estrellas`}
            >
              <Star className={starClassName(filled)} />
            </button>
          )
        }

        return (
          <span key={i} className="inline-flex shrink-0" aria-hidden="true">
            <Star className={starClassName(filled)} />
          </span>
        )
      })}
      {showValue && (
        <span
          className={cn(
            "ml-1 inline-flex items-baseline gap-0.5 font-medium text-foreground tabular-nums leading-none",
            sizes.text
          )}
        >
          <span>{rating.toFixed(1)}</span>
          {reviewCount !== undefined && reviewCount > 0 && (
            <span className="text-muted-foreground font-normal">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  )
}