import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, ArrowLeft, User } from 'lucide-react';

interface PlayerRank {
    userId: {
        _id: string;
        username: string;
    };
    wins: number;
    gamesPlayed: number;
    winRate: number;
}

const RankingView: React.FC = () => {
    const [topPlayers, setTopPlayers] = useState<PlayerRank[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const token = localStorage.getItem('token');
                const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

                const res = await fetch(`${gatewayUrl}/api/users/stats/ranking?sortBy=wins`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await res.json();
                if (res.ok) {
                    setTopPlayers(data.topPlayers);
                }
            } catch (err) {
                console.error("Error fetching ranking:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    if (loading) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white">Loading Rankings...</div>;

    const podio = topPlayers.slice(0, 3);
    const resto = topPlayers.slice(3);

    return (
        <div className="min-h-screen bg-[#0d1117] text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate('/menu')}
                        className="p-2 hover:bg-[#161b22] rounded-lg transition-all border border-[#30363d]"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold">Global Leaderboard</h1>
                        <p className="text-gray-400">The best Hex players in the world</p>
                    </div>
                </div>

                {/* Podio Visual AI generated */}
                <div className="grid grid-cols-3 gap-2 items-end mb-12 px-4">
                    {/* Segundo Puesto */}
                    {podio[1] && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mb-2 border-4 border-gray-500 shadow-lg">
                                <Medal size={32} className="text-gray-800" />
                            </div>
                            <span className="font-bold text-sm truncate w-full text-center">{podio[1].userId.username}</span>
                            <div className="bg-gray-700 w-full h-24 rounded-t-lg mt-2 flex items-center justify-center text-2xl font-black">2</div>
                        </motion.div>
                    )}

                    {/* Primer Puesto */}
                    {podio[0] && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mb-2 border-4 border-yellow-600 shadow-xl shadow-yellow-900/20">
                                <Trophy size={40} className="text-yellow-900" />
                            </div>
                            <span className="font-bold text-lg truncate w-full text-center">{podio[0].userId.username}</span>
                            <div className="bg-yellow-600/20 border-x border-t border-yellow-500/50 w-full h-32 rounded-t-lg mt-2 flex items-center justify-center text-4xl font-black text-yellow-500">1</div>
                        </motion.div>
                    )}

                    {/* Tercer Puesto */}
                    {podio[2] && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-14 h-14 bg-orange-400 rounded-full flex items-center justify-center mb-2 border-4 border-orange-600 shadow-lg">
                                <Medal size={28} className="text-orange-900" />
                            </div>
                            <span className="font-bold text-sm truncate w-full text-center">{podio[2].userId.username}</span>
                            <div className="bg-orange-900/40 w-full h-20 rounded-t-lg mt-2 flex items-center justify-center text-2xl font-black">3</div>
                        </motion.div>
                    )}
                </div>

                {/* Table with Rest of Players */}
                <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#0d1117] border-b border-[#30363d]">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Rank</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Player</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-center">Wins</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-right">Win Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#30363d]">
                            {resto.map((player, index) => (
                                <motion.tr
                                    key={player.userId._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-[#1c2128] transition-colors"
                                >
                                    <td className="px-6 py-4 font-mono text-gray-400">#{index + 4}</td>
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                                            <User size={16} className="text-blue-400" />
                                        </div>
                                        <span className="font-medium">{player.userId.username}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-green-400">{player.wins}</td>
                                    <td className="px-6 py-4 text-right text-gray-400">
                                        {((player.wins / player.gamesPlayed) * 100).toFixed(1)}%
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RankingView;