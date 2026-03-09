import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameScreen.css';
import { Button } from './components/ui/button';
import SidePanel, { type SidePanelRef } from './game/SidePanel';
import GameBoard from './game/GameBoard';
import { useParams } from "react-router-dom";

interface GameScreenProps {
    onExit?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit }) => { 
    const { gameId } = useParams();  
    const sidePanelRef = useRef<SidePanelRef>(null);
    
    
    /// Temporary exit
    const navigate = useNavigate();

    const handleExit = () => {
        if (onExit) {
            onExit();
        } else {
            navigate(-1);
        }
    };
    ///
    return (
        <div className="game-screen">           
           

            <header className="game-header">
                <h1>Game</h1>
            </header>

             <div className="game-container">
                <main className="game-board-section">


                 <GameBoard
                    gameId={gameId}
                    onCellPlayed={(player, playerName, coordinate) => {
                    sidePanelRef.current?.addMove(player, playerName, coordinate);
                    if (player === "p1") {
                    sidePanelRef.current?.incrementTurn();
    }
  }}
/>
                </main>
               <SidePanel ref={sidePanelRef} />
            </div>


            <Button variant="destructive" onClick={handleExit}>
                ← Exit Game
            </Button>
        </div>
    );
};