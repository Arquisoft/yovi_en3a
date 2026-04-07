"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface GameTimerProps {
  isRunning?: boolean
  initialTime?: number
  onTimeUpdate?: (time: number) => void
}

export function GameTimer({
  isRunning = true,
  initialTime = 0,
  onTimeUpdate,
}: GameTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(initialTime)

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1
        onTimeUpdate?.(newTime)
        return newTime
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, onTimeUpdate])

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  return (
    <Card className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border-white/[0.06]">
      <Clock className="h-3 w-3 text-white/20 shrink-0" />
      <span className="font-mono text-base font-bold tabular-nums text-indigo-400 tracking-wider">
        {formatTime(elapsedTime)}
      </span>
    </Card>
  )
}