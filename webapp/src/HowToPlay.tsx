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

const sections = [
  {
    title: " Objective",
    content:
      "Connect two specific corners of the triangular board with an unbroken chain of your hexagons. The first player to form a continuous path wins.",
  },
  {
    title: " The Board",
    content:
      "The board is a triangle made of hexagonal cells. Each cell touches up to 6 neighbours. You play on the cells, not the edges.",
  },
  {
    title: " Taking Turns",
    content:
      "You always go first as the Blue player. After your move, the bot (Red) responds automatically. Each full round counts as one turn.",
  },
  {
    title: " How to Win",
    content:
      "Blue must connect the left corner to the right corner. Red must connect the top corner to the bottom edge. Paths can twist and bend — they just need to be continuous.",
  },
  
];

const HowToPlay: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <div className="w-full max-w-lg">


        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-1">How to Play</h1>
          <p className="text-gray-400 text-sm">Game Y — Triangular Hex</p>
        </div>

        

        <Separator className="mb-6 bg-gray-700" />

        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <Card key={section.title} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-1 pt-4 px-5">
                <CardTitle className="text-white text-base">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {section.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

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