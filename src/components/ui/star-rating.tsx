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
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
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
  const iconSize = sizeMap[size]

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating)
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={cn(
              "inline-flex",
              interactive && "cursor-pointer hover:scale-110 transition-transform"
            )}
            aria-label={interactive ? `Calificar ${i + 1} estrellas` : undefined}
          >
            <Star
              className={cn(
                iconSize,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-foreground tabular-nums">
          {rating.toFixed(1)}
          {reviewCount !== undefined && reviewCount > 0 && (
            <span className="text-muted-foreground font-normal ml-0.5">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  )
}