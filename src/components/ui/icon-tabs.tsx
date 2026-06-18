"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface IconTabItem<T extends string = string> {
  key: T
  label: string
  icon: LucideIcon
}

interface IconTabsProps<T extends string = string> {
  tabs: IconTabItem<T>[]
  activeTab: T
  onChange: (tab: T) => void
  className?: string
}

export function IconTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
}: IconTabsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2 border-b border-border pb-2", className)}>
      {tabs.map(({ key, label, icon: Icon }) => {
        const active = activeTab === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              active
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}