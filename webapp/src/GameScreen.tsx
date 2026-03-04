import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GameScreen.css';
import { Button } from './components/ui/button';
import { Link } from 'lucide-react';

interface GameScreenProps {
    onExit?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit }) => {
    const navigate = useNavigate();
/// Temporary exit
    const handleExit = () => {
        if (onExit) {
            onExit();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="game-screen">
           
                <Button variant="destructive" onClick={handleExit}>
                    ← Exit Game
                </Button>
 
            <header className="game-header">
                
                <h1>Game</h1>
            </header>
            

          

            <div className="game-container">
                <main className="game-board-section">
                    {/* GameBoard component will go here */}
                    <div className="game-board-placeholder">Game Board</div>
                </main>

                <aside className="side-panel">
                    {/* Game info panel */}
                    <div className="panel-content">
                        <h2>Game Info</h2>
                        <div className="info-section">
                            {/* Score, timer, player info, etc. */}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};