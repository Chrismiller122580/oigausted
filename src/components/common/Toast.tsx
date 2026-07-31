"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Info } from "lucide-react"

interface ToastProps {
  message: string
  type?: "success" | "error" | "info"
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = "success", duration = 2800, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const styles = {
    success: "bg-green-600 border-green-700",
    error: "bg-red-600 border-red-700",
    info: "bg-blue-600 border-blue-700"
  }

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
  }

  const Icon = icons[type]

  return (
    <div 
      className={`fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[min(100vw-1.5rem,28rem)] transition-all duration-300 shadow-2xl ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className={`${styles[type]} text-white px-4 sm:px-6 py-4 rounded-2xl border flex items-center gap-3 sm:gap-4 w-full max-w-md`}>
        <Icon className="h-6 w-6 flex-shrink-0" aria-hidden />
        <p className="font-medium leading-snug text-[15px]">{message}</p>
      </div>
    </div>
  )
}
