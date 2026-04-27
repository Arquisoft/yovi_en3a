import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Layout, Trophy, XCircle, Clock, Bot } from 'lucide-react';

interface Match {
    gameId: string;
    status: 'won' | 'lost' | 'ongoing';
    botId: string;
    boardSize: number;
    createdAt: string;
}

const MatchHistoryView: React.FC = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

                const res = await fetch(`${gatewayUrl}/api/game-manager/list`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await res.json();
                if (res.ok) {
                    const historyData = Array.isArray(data) ? data : (data.history || data.games || []);
                    setMatches(historyData);
                }
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#0d1117] text-white p-4 md:p-8 flex justify-center">
            <div className="w-full max-w-5xl">
                <div className="flex items-center gap-4 mb-10">
                    <button onClick={() => navigate('/stats')} className="p-2 hover:bg-[#161b22] rounded-lg border border-[#30363d]"><ArrowLeft size={24} /></button>
                    <h1 className="text-3xl font-bold">Match History</h1>
                </div>

                {matches.length === 0 ? (
                    <div className="text-center p-12 bg-[#161b22] rounded-xl border border-[#30363d]">
                        <Clock size={48} className="mx-auto text-gray-600 mb-4" />
                        <p>No matches found in your history.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {matches.map((match, index) => {

                            const isWin = match.status === 'won';
                            const isOngoing = match.status === 'ongoing';
                            const date = match.createdAt ? new Date(match.createdAt).toLocaleDateString() : 'No date';

                            return (
                                <motion.div
                                    key={match.gameId} // Usamos gameId de la captura
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center justify-between hover:border-gray-500 transition-colors mb-4"
                                >
                                    <div className="flex items-center gap-6">
                                        {/* 3. Indicador visual por estado */}
                                        <div className={`p-3 rounded-lg ${isWin ? 'bg-green-500/10 text-green-500' :
                                            isOngoing ? 'bg-blue-500/10 text-blue-500' :
                                                'bg-red-500/10 text-red-500'
                                            }`}>
                                            {isWin ? <Trophy size={24} /> : isOngoing ? <Clock size={24} /> : <XCircle size={24} />}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-bold uppercase text-xs tracking-widest ${isWin ? 'text-green-500' :
                                                    isOngoing ? 'text-blue-500' :
                                                        'text-red-500'
                                                    }`}>
                                                    {match.status}
                                                </span>
                                                <span className="text-gray-500 text-sm flex items-center gap-1">
                                                    <Calendar size={14} /> {date}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Layout size={14} className="text-gray-600" /> {match.boardSize}x{match.boardSize}
                                                </span>
                                                <span className="flex items-center gap-1 capitalize">
                                                    <Bot size={14} className="text-gray-600" /> {match.botId?.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {isOngoing ? (
                                            <button
                                                onClick={() => {

                                                    navigate(`/game/${match.gameId}/${match.boardSize}/${match.gameId.includes('standard') ? 'standard' : 'variant'}`);
                                                }}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all"
                                            >
                                                Resume
                                            </button>
                                        ) : (
                                            <div className="text-[15px] font-mono text-gray-600 text-right">
                                                FINISHED
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchHistoryView;