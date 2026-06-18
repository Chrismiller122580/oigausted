import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: LucideIcon
  iconColor?: string
  label: string
  value: string | number
  sublabel?: string
  href?: string
  className?: string
  highlight?: boolean
}

export function StatCard({
  icon: Icon,
  iconColor = "text-blue-400",
  label,
  value,
  sublabel,
  href,
  className,
  highlight,
}: StatCardProps) {
  const content = (
    <Card
      className={cn(
        "bg-card border-border hover:border-accent hover:shadow-sm transition h-full",
        highlight && "border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20",
        className
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <Icon className={cn("h-8 w-8 mb-3", iconColor)} />
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl sm:text-4xl font-bold mt-1 tabular-nums">{value}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}