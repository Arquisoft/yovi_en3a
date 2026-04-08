import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Hourglass } from "lucide-react"

interface TurnTimerProps {
  gameId?: string
  totalSeconds?: number
  onExpire: () => void
}

export function TurnTimer({ gameId, totalSeconds = 20, onExpire }: TurnTimerProps) {
  const storageKey = `turnTimer_${gameId ?? "local"}`
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds)
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
    const now = Date.now()

    let startTime: number
    const stored = sessionStorage.getItem(storageKey)
    if (stored) {
      const t = parseInt(stored, 10)
      const elapsed = (now - t) / 1000
      if (elapsed >= 0 && elapsed < totalSeconds + 5) {
        startTime = t
      } else {
        startTime = now
        sessionStorage.setItem(storageKey, String(now))
      }
    } else {
      startTime = now
      sessionStorage.setItem(storageKey, String(now))
    }

    const computeRemaining = () =>
      Math.max(0, totalSeconds - (Date.now() - startTime) / 1000)

    const initial = computeRemaining()
    setTimeLeft(Math.ceil(initial))

    if (initial <= 0) {
      if (!firedRef.current) {
        firedRef.current = true
        setTimeout(() => onExpireRef.current(), 0)
      }
      return
    }

    const interval = setInterval(() => {
      const remaining = computeRemaining()
      setTimeLeft(Math.ceil(remaining))
      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true
        clearInterval(interval)
        onExpireRef.current()
      }
    }, 200)

    return () => clearInterval(interval)
  }, [storageKey, totalSeconds])

  useEffect(() => {
    return () => {
      sessionStorage.removeItem(storageKey)
    }
  }, [storageKey])

  const isUrgent = timeLeft <= 5
  const progress = (timeLeft / totalSeconds) * 100

  return (
    <Card
      className="flex flex-col gap-1.5 px-3 py-2"
      style={{
        background: isUrgent ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
        borderColor: isUrgent ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)",
        transition: "background 0.4s, border-color 0.4s",
      }}
    >
      <div className="flex items-center gap-2">
        <Hourglass
          className="h-3 w-3 shrink-0"
          style={{ color: isUrgent ? "#ef4444" : "rgba(255,255,255,0.2)" }}
        />
        <span
          className="font-mono text-base font-bold tabular-nums tracking-wider"
          style={{ color: isUrgent ? "#ef4444" : "#818cf8" }}
        >
          {timeLeft}s
        </span>
        <span
          className="text-[0.6rem] uppercase tracking-widest ml-auto"
          style={{ color: isUrgent ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.2)" }}
        >
          tu turno
        </span>
      </div>

      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 3, background: "rgba(255,255,255,0.05)" }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: "9999px",
            background: isUrgent ? "#ef4444" : "linear-gradient(90deg, #6366f1, #818cf8)",
            transition: "width 0.2s linear, background 0.4s",
          }}
        />
      </div>
    </Card>
  )
}