"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      // Intentionally omit `enableSystem` (and do not pass it) so first-time / no-preference
      // visitors ALWAYS get light mode on initial load. This ensures the public landing page
      // (and whole app) does not start in dark mode, regardless of OS preference.
      // The ModeToggle still allows switching to dark (persisted in localStorage).
      // (If explicit "system" support is needed later, re-enable and extend the toggle to cycle through it.)
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}