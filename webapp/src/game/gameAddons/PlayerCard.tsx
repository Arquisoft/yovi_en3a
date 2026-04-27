"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Crown } from "lucide-react"

interface PlayerCardProps {
  name: string
  avatar?: string
  isCurrentTurn: boolean
  piecesPlaced: number
  playerNumber: 1 | 2
  isWinner?: boolean
}

// Colors adapted to the dark theme from GameScreen.css
const playerColors = {
  1: {
    ring: "ring-blue-500/60",
    bar: "bg-blue-500",
    ping: "bg-blue-400",
    dot: "bg-blue-500",
    avatarBg: "bg-blue-500/20",
    avatarText: "text-blue-300",
    label: "text-blue-300",
  },
  2: {
    ring: "ring-red-500/60",
    bar: "bg-red-500",
    ping: "bg-red-400",
    dot: "bg-red-500",
    avatarBg: "bg-red-500/20",
    avatarText: "text-red-300",
    label: "text-red-300",
  },
}

export function PlayerCard({
  name,
  avatar,
  isCurrentTurn,
  piecesPlaced,
  playerNumber,
  isWinner,
}: PlayerCardProps) {
  const colors = playerColors[playerNumber]

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card
      className={cn(
        "relative flex items-center gap-3 p-3 transition-all duration-300",
        "bg-white/[0.03] border-white/[0.06]",
        isCurrentTurn && `ring-2 ring-offset-0 ${colors.ring}`,
        isWinner && "bg-yellow-500/5 border-yellow-500/20"
      )}
    >
      {/* Active indicator bar */}
      {isCurrentTurn && (
        <div
          className={cn(
            "absolute -left-px top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-full",
            colors.bar
          )}
        />
      )}

      {/* Avatar with ping */}
      <div className="relative">
        <Avatar className="h-9 w-9 border border-white/10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback
            className={cn("text-xs font-bold font-mono", colors.avatarBg, colors.avatarText)}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {isCurrentTurn && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", colors.ping)} />
            <span className={cn("relative inline-flex h-3 w-3 rounded-full", colors.dot)} />
          </span>
        )}
      </div>

      {/* Name and pieces */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn("text-sm font-medium truncate font-mono", colors.label)}>
          {name}
        </span>
        <span className="text-[0.65rem] text-white/30">
          {piecesPlaced} {piecesPlaced === 1 ? "piece" : "pieces"}
        </span>
      </div>

      {/* Winner crown */}
      {isWinner && (
        <Crown className="h-4 w-4 text-yellow-400 shrink-0" />
      )}
    </Card>
  )
}