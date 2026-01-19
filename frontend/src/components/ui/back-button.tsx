"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BackButtonProps {
  fallbackHref?: string
  label?: string
}

export function BackButton({ fallbackHref = "/admin", label = "Volver" }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // Try to go back in history, fallback to href if no history
    if (window.history?.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="gap-1"
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
