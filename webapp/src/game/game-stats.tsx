"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Grid3X3, Layers } from "lucide-react"

interface GameStatsProps {
  turn: number
  player1Pieces: number
  player2Pieces: number
  totalCells: number
  boardSize: number
}

export function GameStats({
  turn,
  player1Pieces,
  player2Pieces,
  totalCells,
  boardSize,
}: GameStatsProps) {
  const occupiedCells = player1Pieces + player2Pieces
  const occupancyPercent = Math.round((occupiedCells / totalCells) * 100)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Estadisticas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>Turno</span>
          </div>
          <span className="font-semibold">{turn}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Grid3X3 className="h-4 w-4" />
            <span>Tablero</span>
          </div>
          <span className="font-semibold">{boardSize}x{boardSize}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ocupacion</span>
            <span className="font-semibold">{occupancyPercent}%</span>
          </div>
          <Progress value={occupancyPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{occupiedCells} ocupadas</span>
            <span>{totalCells - occupiedCells} libres</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="text-center p-2 rounded-md bg-player-1/10">
            <div className="text-lg font-bold text-player-1">{player1Pieces}</div>
            <div className="text-xs text-muted-foreground">Jugador 1</div>
          </div>
          <div className="text-center p-2 rounded-md bg-player-2/10">
            <div className="text-lg font-bold text-player-2">{player2Pieces}</div>
            <div className="text-xs text-muted-foreground">Jugador 2</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
