import React, { useState, forwardRef, useImperativeHandle } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Move {
  player: "p1" | "p2";
  playerName: string;
  coordinate: string; // e.g. "(2,1,0)"
  turn: number;
}

export interface SidePanelRef {
  /** Call this from GameBoard when a cell is clicked */
  addMove: (player: "p1" | "p2", playerName: string, coordinate: string) => void;
  /** Call this to advance the turn counter */
  incrementTurn: () => void;
  /** Read the current turn number if needed */
  getCurrentTurn: () => number;
}

// ── Component ────────────────────────────────────────────────────────────────

const SidePanel = forwardRef<SidePanelRef>((_, ref) => {
  const [moves, setMoves] = useState<Move[]>([]);
  const [turn, setTurn] = useState<number>(1);

  // Exposed imperative methods
  useImperativeHandle(ref, () => ({
    addMove: (player, playerName, coordinate) => {
      setMoves((prev) => [
        ...prev,
        { player, playerName, coordinate, turn },
      ]);
    },
    incrementTurn: () => {
      setTurn((prev) => prev + 1);
    },
    getCurrentTurn: () => turn,
  }));

  const playerColor = (player: "p1" | "p2") =>
    player === "p1" ? "p1-badge" : "p2-badge";

  return (
<aside className="side-panel flex flex-col h-full">

      {/* ── Move History ── */}

    <div className="flex flex-col flex-1 min-h-0">

      <h3 className="moves-title">Move History</h3>

      {moves.length === 0 ? (
        <p className="no-moves">No moves yet.</p>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">

            <ScrollArea className="moves-scroll flex-1 h-[400px]">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Coordinate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...moves].reverse().map((move, idx) => (
                <TableRow key={idx} className="move-row">
                  <TableCell className="text-muted-foreground text-xs">
                    {moves.length - idx} 
                  </TableCell>
                  <TableCell>
                    <Badge className={playerColor(move.player)}>
                      {move.playerName}
                    </Badge>
                  </TableCell>
                  <TableCell className="coordinate-cell">
                    {move.coordinate}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        </div>
        )}
        </div>
            {/* ── Turn Counter ── */}
     
      <Separator className="my-3" />
       <div className="turn-counter">
        <span className="turn-label">Turn</span>
        <span className="turn-number">{turn}</span>
      </div>


    </aside>
  );
});

SidePanel.displayName = "SidePanel";
export default SidePanel;