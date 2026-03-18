import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameScreen.css';
import SidePanel, { type SidePanelRef } from './game/SidePanel';
import GameBoard from './game/GameBoard';
import { useParams } from "react-router-dom";
import { Button } from './components/ui/button';
import { gatewayUrl } from './lib/config';

interface GameScreenProps {
    onExit?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit }) => {
    const { gameId, size } = useParams();
    const [boardSize] = useState<number>(size ? Number.parseInt(size) : 7);

    const sidePanelRef = useRef<SidePanelRef>(null);
    const [gameOver, setGameOver] = useState<"p1" | "p2" | null>(null);
    const navigate = useNavigate();

    // Antes que nada se comprueba si gamemanager devuelve error 401 o 403, de ser así se vuelve al menu
    useEffect(() => {
        if (!gameId) return;
        const token = localStorage.getItem('token');
        fetch(`${gatewayUrl}/api/game-manager/state/${gameId}`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => {
            // 401: usuarios sin authenticar
            // 403: usuario registrado, pero no es su partida
            if (res.status === 401 || res.status === 403) {
                navigate('/menu');
            }
        }).catch(() => {
            navigate('/menu');
        });
    }, [gameId, navigate]);

    useEffect(() => {
        let audio: HTMLAudioElement | null = null;
        try {
            audio = new Audio("/sounds/gameMusic.wav");
            audio.loop = true;
            audio.volume = 0.4;
            audio.play().catch(() => {});
        } catch {
            // Audio not available in test environment
        }

        return () => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        };
    }, []);

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
                <div className="game-over-overlay">
                    <div className="game-over-card">
                        <h2>{gameOver === "p1" ? "🎉 You win!" : "😞 You lose!"}</h2>
                        <p>{gameOver === "p1" ? "Congratulations!" : "Better luck next time!"}</p>
                        <button className="game-over-btn" onClick={handleExit}>
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

            <Button variant="destructive" onClick={handleExit}>
                ← Exit Game
            </Button>
        </div>
    );
};