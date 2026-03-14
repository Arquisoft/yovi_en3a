import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameScreen.css';
import SidePanel, { type SidePanelRef } from './game/SidePanel';
import GameBoard from './game/GameBoard';
import { useParams } from "react-router-dom";

interface GameScreenProps {
    onExit?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit }) => {
    const { gameId, size } = useParams();
    const [boardSize] = useState<number>(size ? Number.parseInt(size) : 7);

    const sidePanelRef = useRef<SidePanelRef>(null);
    const [gameOver, setGameOver] = useState<"p1" | "p2" | null>(null);
    const navigate = useNavigate();

    const handleExit = () => {
        if (onExit) onExit();
        else navigate(-1);
    };

    return (
        <div className="game-screen">
            <header className="game-header">
                <h1>Game</h1>
            </header>

            {gameOver && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 50,
                        background: "rgba(0,0,0,0.7)",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: "1rem"
                    }}
                >
                    <div
                        style={{
                            background: "#161b22", border: "1px solid #30363d",
                            borderRadius: "12px", padding: "2rem 3rem", textAlign: "center"
                        }}
                    >
                        <h2 style={{ color: "#fff", fontSize: "2rem", marginBottom: "0.5rem" }}>
                            {gameOver === "p1" ? "🎉 You win!" : "😞 You lose!"}
                        </h2>
                        <p style={{ color: "#8b949e", marginBottom: "1.5rem" }}>
                            {gameOver === "p1" ? "Congratulations!" : "Better luck next time!"}
                        </p>
                        <button
                            onClick={handleExit}
                            style={{
                                background: "#238636", color: "#fff", border: "none",
                                borderRadius: "8px", padding: "0.75rem 2rem",
                                fontSize: "1rem", cursor: "pointer"
                            }}
                        >
                            Back to Menu
                        </button>
                    </div>
                </div>
            )}

            <div className="game-container">
                <main className="game-board-section">
                    <GameBoard
                        gameIdProp={gameId}
                        boardSize={boardSize}
                        onCellPlayed={(player, playerName, coordinate) => {
                            sidePanelRef.current?.addMove(player, playerName, coordinate);
                            if (player === "p1") sidePanelRef.current?.incrementTurn();
                        }}
                        onGameOver={(winner) => setGameOver(winner)}
                    />
                </main>
                <SidePanel ref={sidePanelRef} />
            </div>

            <button onClick={handleExit}>
                ← Exit Game
            </button>
        </div>
    );
};