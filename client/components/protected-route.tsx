"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div> // Можно заменить на красивый спиннер
  }

  if (!user) {
    return null // Рендеринг прерывается, так как редирект уже выполнен
  }

  return <>{children}</>
}