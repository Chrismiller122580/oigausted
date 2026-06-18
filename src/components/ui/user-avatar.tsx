import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeMap = {
  sm: { container: "w-8 h-8", icon: "h-4 w-4", text: "text-xs" },
  md: { container: "w-10 h-10", icon: "h-5 w-5", text: "text-sm" },
  lg: { container: "w-16 h-16", icon: "h-8 w-8", text: "text-xl" },
  xl: { container: "w-24 h-24", icon: "h-10 w-10", text: "text-3xl" },
}

export function UserAvatar({ src, name, size = "md", className }: UserAvatarProps) {
  const sizes = sizeMap[size]
  const initial = name?.[0]?.toUpperCase()

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || "Usuario"}
        className={cn(
          sizes.container,
          "rounded-full object-cover border border-border",
          className
        )}
      />
    )
  }

  if (initial) {
    return (
      <div
        className={cn(
          sizes.container,
          sizes.text,
          "rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold border border-border",
          className
        )}
      >
        {initial}
      </div>
    )
  }

  return (
    <div
      className={cn(
        sizes.container,
        "rounded-full bg-muted flex items-center justify-center border border-border",
        className
      )}
    >
      <User className={cn(sizes.icon, "text-muted-foreground")} />
    </div>
  )
}