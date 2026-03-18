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


const HowToPlay: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-1">How to Play</h1>
          <p className="text-gray-400 text-sm">Game Y — Triangular Hex</p>
        </div>

        <Separator className="mb-6 bg-gray-700" />

        {/* About the game */}
       
        <Card className="bg-gray-800 border-gray-700 mb-6">
  <CardContent className="px-5 py-4 flex flex-col gap-3">
    <p className="text-gray-300 text-sm leading-relaxed">
     Game Y is a two-player strategy game played on a triangular board composed of hexagonal cells. 
              Players take turns placing pieces on the cells. The goal is to form a 
              continuous chain of your pieces connecting all three sides of the triangle, the first to do so wins, with no draws possible.
    </p>
    <p className="text-gray-300 text-sm leading-relaxed">
      Before starting a game you can customise your experience from the game 
      selection screen — choose your preferred board size, pick a bot difficulty, 
      and select a game mode to match how you want to play.
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
        <h2 className="text-white font-semibold text-sm uppercase tracking-widest mb-3 px-1">
          Game Modes
        </h2>
        {/* Add new cards for new game modes */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="px-5 py-4 flex items-start gap-3">
            <Badge style={{ backgroundColor: "#6366f1", color: "#fff" }}>
              Standard
            </Badge>
            <p className="text-gray-300 text-sm leading-relaxed">
              Classic rules, no time limit. Choose from board sizes 5, 7, 9 or 11 and bot difficulties ranging from easy to medium to hard.
            </p>
          </CardContent>
        </Card>

        {/* Back */}
        <Button
          variant="outline"
          className="w-full mt-6 border-gray-600 text-gray-300 hover:bg-gray-800"
          onClick={() => navigate(-1)}
        >
          ← Back to Menu
        </Button>

      </div>
    </div>
  );
};

export default HowToPlay;