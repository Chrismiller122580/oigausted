"use client"
import { useState, useEffect } from "react"

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
    success: "✅",
    error: "❌",
    info: "ℹ️"
  }

  return (
    <div 
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 shadow-2xl ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className={`${styles[type]} text-white px-6 py-4 rounded-2xl border flex items-center gap-4 min-w-[300px] max-w-md`}>
        <span className="text-2xl flex-shrink-0">{icons[type]}</span>
        <p className="font-medium leading-snug text-[15px]">{message}</p>
      </div>
    </div>
  )
}
