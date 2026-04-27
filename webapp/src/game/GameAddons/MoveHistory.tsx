"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Move {
  player: "p1" | "p2"
  playerName: string
  coordinate: string
  timestamp: Date
  swapped?: boolean
}

interface MoveHistoryProps {
  moves: Move[]
  maxHeight?: number
}

export function MoveHistory({ moves, maxHeight = 200 }: MoveHistoryProps) {
  return (
    <Card className="bg-white/[0.02] border-white/[0.06]">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-white/20 flex items-center gap-2">
          <History className="h-3 w-3" />
          Move History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          {moves.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-white/20 italic">
              No moves yet
            </div>
          ) : (
            <div className="space-y-0.5 p-3 pt-0">
              {[...moves].reverse().map((move, index) => {
                const realIndex = moves.length - index;
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded text-xs",
                      "hover:bg-white/[0.03] transition-colors"
                    )}
                  >
                    <span className="text-white/20 font-mono w-5 text-right shrink-0">
                      {realIndex}
                    </span>
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        move.player === "p1" ? "bg-blue-500" : "bg-red-500"
                      )}
                    />
                    <span className={cn(
                      "font-mono truncate flex-1",
                      move.player === "p1" ? "text-blue-300/70" : "text-red-300/70"
                    )}>
                      {move.playerName}
                      {move.swapped && <span className="text-yellow-400 ml-1">⇄</span>}
                    </span>
                    <span className="font-mono text-white/40 shrink-0 tabular-nums">
                      {move.coordinate}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}