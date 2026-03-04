import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameScreen.css';
import { Button } from './components/ui/button';
import SidePanel from './game/SidePanel';
import GameBoard from './game/GameBoard';

interface GameScreenProps {
    onExit?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit }) => {   
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
                <div className="game-board-placeholder">Game Board</div>


                 <GameBoard />
                </main>
                <SidePanel />
            </div>



            <Button variant="destructive" onClick={handleExit}>
                ← Exit Game
            </Button>
        </div>
    );
};