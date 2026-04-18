import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './GameScreen.css';
import SidePanel, { type SidePanelRef } from './game/SidePanel';
import GameBoard, { type GameBoardRef } from './game/GameBoard';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { gatewayUrl } from './lib/config';
import { PlayerCard } from './game/PlayerCard';
import { MoveHistory, type Move } from './game/MoveHistory';
import { GameTimer } from './game/GameTimer';
import { TurnTimer } from './game/TurnTimer';
import { Trophy, LogOut, Gamepad2, Eye, EyeOff } from 'lucide-react';
import HexBackground from './HexBackGround';

interface GameScreenProps {
    onExit?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit }) => {
    const { gameId, size, gameType } = useParams();
    const [boardSize] = useState<number>(size ? Number.parseInt(size) : 7);

    const sidePanelRef = useRef<SidePanelRef>(null);
    const gameBoardRef = useRef<GameBoardRef>(null);

    const [gameOver, setGameOver] = useState<"p1" | "p2" | null>(null);
    const [moves, setMoves] = useState<Move[]>([]);
    const [currentTurn, setCurrentTurn] = useState<"p1" | "p2">("p1");
    const [piecesP1, setPiecesP1] = useState(0);
    const [piecesP2, setPiecesP2] = useState(0);
    const [turnNumber, setTurnNumber] = useState(1);
    const [showCellNames, setShowCellNames] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!gameId) return;
        const token = localStorage.getItem('token');
        fetch(`${gatewayUrl}/api/game-manager/state/${gameId}`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => {
            if (res.status === 401 || res.status === 403) navigate('/menu');
        }).catch(() => navigate('/menu'));
    }, [gameId, navigate]);

    useEffect(() => {
        let audio: HTMLAudioElement | null = null;
        try {
            audio = new Audio("/sounds/gameMusic.wav");
            audio.loop = true;
            audio.volume = 0.4;
            audio.play().catch(() => {});
        } catch {}
        return () => { if (audio) { audio.pause(); audio.currentTime = 0; } };
    }, []);

    // Tipos de juego que gestionan los turnos ellos mismos via onTurnChange
    const SELF_MANAGED_TURNS = ["fortune", "master"];
    const autoTurn = !gameType || !SELF_MANAGED_TURNS.includes(gameType);

    const handleCellPlayed = (player: "p1" | "p2", playerName: string, coordinate: string) => {
        sidePanelRef.current?.addMove(player, playerName, coordinate);
        const newMove: Move = { player, playerName, coordinate, timestamp: new Date() };
        setMoves(prev => [...prev, newMove]);

        if (player === "p1") {
            setPiecesP1(p => p + 1);
            sidePanelRef.current?.incrementTurn();
            setTurnNumber(t => t + 1);
            if (autoTurn) setCurrentTurn("p2");
        } else {
            setPiecesP2(p => p + 1);
            if (autoTurn) setCurrentTurn("p1");
        }
    };

    const handleTurnChange = (turn: "p1" | "p2") => {
        setCurrentTurn(turn);
    };

    const handleExit = () => {
        if (onExit) onExit();
        else navigate(-1);
    };

    const handleTurnTimeout = () => {
        gameBoardRef.current?.makeRandomMove?.();
    };

    return (
        <div className="min-h-screen bg-[#080b14] flex flex-col relative overflow-hidden" style={{
            fontFamily: "'Courier New', monospace"
        }}>
            <HexBackground />

            <div className="relative z-10 flex flex-col flex-1">

                {/* ── Header ── */}
                <header className="w-full flex items-center justify-between px-6 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4 text-indigo-400 opacity-60" />
                        <span className="text-[0.65rem] font-bold tracking-[0.25em] uppercase text-white/20">
                            Y-Game
                        </span>
                        {gameType && (
                            <Badge variant="outline" className="text-[0.6rem] border-white/10 text-white/30 ml-2">
                                {gameType}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[0.65rem] tracking-widest uppercase text-white/20">
                            Turn <span className="text-indigo-400 font-bold">{turnNumber}</span>
                        </span>
                        <Separator orientation="vertical" className="h-4 bg-white/10" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleExit}
                            className="text-white/30 hover:text-red-400 hover:bg-red-500/10 h-7 px-2 text-xs gap-1 transition-colors"
                        >
                            <LogOut className="h-3 w-3" />
                            Exit
                        </Button>
                    </div>
                </header>

                {/* ── Game Over Overlay ── */}
                {gameOver && (
                    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center">
                        <div
                            className="bg-[#0d1117] border border-white/10 rounded-2xl p-10 text-center shadow-2xl"
                            style={{ animation: 'fadeInUp 0.25s ease' }}
                        >
                            <div className="flex justify-center mb-4">
                                <Trophy className={`h-12 w-12 ${gameOver === "p1" ? "text-yellow-400" : "text-white/20"}`} />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Courier New', monospace" }}>
                                {gameOver === "p1" ? "You Win!" : "You Lose!"}
                            </h2>
                            <p className="text-white/30 text-sm mb-6">
                                {gameOver === "p1" ? "Congratulations, well played!" : "Better luck next time."}
                            </p>
                            <Button
                                onClick={handleExit}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono tracking-wide px-8"
                            >
                                Back to Menu
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Main layout ── */}
                <div className="flex flex-1 gap-5 px-6 py-4 items-start justify-center">

                    {/* Left sidebar */}
                    <aside className="flex flex-col gap-3 w-52 shrink-0 pt-1">
                        <PlayerCard
                            name="Player 1"
                            playerNumber={1}
                            isCurrentTurn={currentTurn === "p1" && !gameOver}
                            piecesPlaced={piecesP1}
                            isWinner={gameOver === "p1"}
                        />
                        <PlayerCard
                            name="Player 2"
                            playerNumber={2}
                            isCurrentTurn={currentTurn === "p2" && !gameOver}
                            piecesPlaced={piecesP2}
                            isWinner={gameOver === "p2"}
                        />
                        <Separator className="bg-white/5" />
                        <GameTimer isRunning={!gameOver} />
                        {currentTurn === "p1" && !gameOver && (
                            <TurnTimer
                                key={turnNumber}
                                gameId={gameId}
                                totalSeconds={20}
                                onExpire={handleTurnTimeout}
                            />
                        )}
                        <Separator className="bg-white/5" />
                        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-2">
                            <p className="text-[0.6rem] uppercase tracking-widest text-white/20 font-bold">Info</p>
                            <div className="flex justify-between text-xs">
                                <span className="text-white/30">Board</span>
                                <span className="text-white/60 font-mono">{boardSize}×{boardSize}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-white/30">Mode</span>
                                <span className="text-white/60 font-mono">{gameType ?? 'local'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-white/30">Moves</span>
                                <span className="text-indigo-400 font-mono font-bold">{moves.length}</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCellNames(!showCellNames)}
                            className="text-white/15 hover:text-indigo-400 hover:bg-indigo-500/5 h-10 w-10 p-0 transition-colors"
                            title={showCellNames ? "Hide coordinates" : "Show coordinates"}
                        >
                            {showCellNames ? <Eye className="h-7 w-7" /> : <EyeOff className="h-7 w-7" />}
                        </Button>
                    </aside>

                    {/* Center: board */}
                    <main className="game-board-section flex-shrink-0">
                        <GameBoard
                            ref={gameBoardRef}
                            gameIdProp={gameId}
                            boardSize={boardSize}
                            gameType={gameType}
                            showNames={showCellNames}
                            onCellPlayed={(player, playerName, coordinate) =>
                                handleCellPlayed(player as "p1" | "p2", playerName, coordinate)
                            }
                            onGameOver={(winner) => setGameOver(winner)}
                            onTurnChange={handleTurnChange}
                        />
                    </main>

                    {/* Right sidebar */}
                    <aside className="flex flex-col gap-3 w-56 shrink-0 pt-1">
                        <MoveHistory moves={moves} maxHeight={420} />
                        <div className="hidden">
                            <SidePanel ref={sidePanelRef} />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};