import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import HexBackground from './HexBackGround';
import "./HowToPlay.css";



const HowToPlay: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="game-select-overlay">
      <HexBackground opacity={0.7} />
      <div className="game-select-container" style={{ maxWidth: "28rem" }}>
        {/* Header */}
        <header className="game-select-header">
          <button
            onClick={() => navigate(-1)}
            className="btn-back"
          >
            ← Back
          </button>
          <h1 className="game-select-title">How to Play</h1>
          <p className="game-select-subtitle">Game Y — Triangular Hex</p>
        </header>

        <Separator className="mb-6 bg-gray-700" />

        {/* About the game */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="px-5 py-4 flex flex-col gap-3">
            <p className="text-gray-300 text-sm leading-relaxed">
              Game Y is a two-player strategy game played on a triangular board 
              composed of hexagonal cells. Players take turns placing pieces on 
              the cells. The goal is to form a continuous chain connecting all 
              three sides of the triangle — the first to do so wins, with no 
              draws possible.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Before starting a game you can customise your experience from the 
              game selection screen — choose your preferred board size, pick a 
              bot difficulty, and select a game mode to match how you want to play.
            </p>
            <a
              href="https://en.wikipedia.org/wiki/Y_%28game%29"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-sm underline underline-offset-2 transition-colors"
            >
              Learn more on Wikipedia ↗
            </a>
          </CardContent>
        </Card>

        {/* Game modes */}
        <h2 className="text-gray-400 font-semibold text-xs uppercase tracking-widest mb-3 px-1">
          Game Modes
        </h2>

        <div className="flex flex-col gap-3">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="px-5 py-4 flex items-start gap-3">
              <Badge style={{ backgroundColor: "#6366f1", color: "#fff" }}>Standard</Badge>
              <p className="text-gray-300 text-sm leading-relaxed">
                Classic rules, no time limit. Choose from board sizes 5, 7, 9 or 11
                and bot difficulties ranging from easy to medium to hard.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="px-5 py-4 flex items-start gap-3">
              <Badge style={{ backgroundColor: "#6366f1", color: "#fff" }}>Master</Badge>
              <p className="text-gray-300 text-sm leading-relaxed">
                Two moves per turn. Not yet implemented.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="px-5 py-4 flex items-start gap-3">
              <Badge style={{ backgroundColor: "#6366f1", color: "#fff" }}>Fortune</Badge>
              <p className="text-gray-300 text-sm leading-relaxed">
                In every turn which player moves is chosen randomly. Not yet implemented.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-gray-400 font-semibold text-xs uppercase tracking-widest mb-3 px-1">
            Multiplayer Only Modes
          </h2>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="px-5 py-4 flex items-start gap-3">
              <Badge style={{ backgroundColor: "#6366f1", color: "#fff" }}>Pie Rule</Badge>
              <p className="text-gray-300 text-sm leading-relaxed">
                At the start of the game, Player 1 places one piece anywhere on the board. Then Player 2 
                decides whether to swap and take that piece or to keep the current 
                position. This mode is designed to balance the inherent first-player advantage.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="px-5 py-4 flex items-start gap-3">
              <Badge style={{ backgroundColor: "#6366f1", color: "#fff" }}>Tabu</Badge>
              <p className="text-gray-300 text-sm leading-relaxed">
                It is forbidden to move in any of the tiles adjacent to where your opponent has just moved.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="px-5 py-4 flex items-start gap-3">
              <Badge style={{ backgroundColor: "#6366f1", color: "#fff" }}>Holey</Badge>
              <p className="text-gray-300 text-sm leading-relaxed">
                The board has holes. Not yet implemented.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="px-5 py-4 flex items-start gap-3">
              <Badge style={{ backgroundColor: "#6366f1", color: "#fff" }}>Why Not</Badge>
              <p className="text-gray-300 text-sm leading-relaxed">
                The first to connect all three sides loses. Not yet implemented.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;