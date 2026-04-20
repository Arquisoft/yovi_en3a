import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, ArrowLeft, User, Target } from 'lucide-react';
import HexBackground from './HexBackGround';
import './RankingView.css';

interface PlayerRank {
    userId: { _id: string; username: string; };
    wins: number;
    gamesPlayed: number;
}

interface UserPosition {
    position: number;
    wins: number;
    gamesPlayed: number;
}

const RankingView: React.FC = () => {
    const [topPlayers, setTopPlayers] = useState<PlayerRank[]>([]);
    const [userRank, setUserRank] = useState<UserPosition | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const currentUserId = localStorage.getItem('userId');

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
                    setTopPlayers(data.topPlayers || []);
                    setUserRank(data.userPosition || null);
                }
            } catch (err) {
                console.error("Error fetching ranking:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRanking();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#080b14] flex items-center justify-center text-white relative overflow-hidden">
            <HexBackground />
            <span className="relative z-10">Loading Rankings...</span>
        </div>
    );

    const podio = topPlayers.slice(0, 3);
    const resto = topPlayers.slice(3);
    const isUserInTop20 = topPlayers.some((_, index) => (index + 1) === userRank?.position);

    return (
        <div className="min-h-screen bg-[#080b14] text-white relative overflow-hidden">
            <HexBackground />
            <div className="relative z-10 p-4 md:p-8 flex justify-center">
                <div className="w-full max-w-4xl">

                    {/* Header */}
                    <div className="flex items-start md:items-center gap-3 md:gap-4 mb-8 md:mb-10">
                        <button
                            onClick={() => navigate('/menu')}
                            className="p-2 hover:bg-[#161b22] rounded-lg transition-all border border-[#30363d] flex-shrink-0"
                        >
                            <ArrowLeft size={20} className="md:w-6 md:h-6" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold break-words">Global Leaderboard</h1>
                            <p className="text-xs md:text-sm text-gray-400">The best Hex players in the world</p>
                        </div>
                    </div>

                    {/* Podio */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end mb-12 px-2 md:px-4 h-auto md:h-64">
                        {podio[1] && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center" data-podium="second">
                                <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mb-2 border-4 border-gray-500 shadow-lg">
                                    <Medal size={32} className="text-gray-800" />
                                </div>
                                <span className="font-bold text-sm truncate w-full text-center">{podio[1].userId.username}</span>
                                <div className="bg-gray-700 w-full h-24 rounded-t-lg mt-2 flex items-center justify-center text-2xl font-black italic">2</div>
                            </motion.div>
                        )}
                        {podio[0] && (
                            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center" data-podium="first">
                                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mb-2 border-4 border-yellow-600 shadow-xl shadow-yellow-900/20">
                                    <Trophy size={40} className="text-yellow-900" />
                                </div>
                                <span className="font-bold text-lg truncate w-full text-center">{podio[0].userId.username}</span>
                                <div className="bg-yellow-600/20 border-x border-t border-yellow-500/50 w-full h-32 rounded-t-lg mt-2 flex items-center justify-center text-4xl font-black text-yellow-500 italic">1</div>
                            </motion.div>
                        )}
                        {podio[2] && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center" data-podium="third">
                                <div className="w-14 h-14 bg-orange-400 rounded-full flex items-center justify-center mb-2 border-4 border-orange-600 shadow-lg">
                                    <Medal size={28} className="text-orange-900" />
                                </div>
                                <span className="font-bold text-sm truncate w-full text-center">{podio[2].userId.username}</span>
                                <div className="bg-orange-900/40 w-full h-20 rounded-t-lg mt-2 flex items-center justify-center text-2xl font-black italic">3</div>
                            </motion.div>
                        )}
                    </div>

                    {/* Tabla */}
                    <div className="bg-[#161b22]/80 backdrop-blur-sm rounded-xl border border-[#30363d] overflow-x-auto mb-6">
                        <table className="w-full text-left text-xs md:text-sm">
                            <thead className="bg-[#0d1117]/80 border-b border-[#30363d]">
                                <tr>
                                    <th className="px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-400 uppercase">Rank</th>
                                    <th className="px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-400 uppercase">Player</th>
                                    <th className="px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-400 uppercase text-center">Wins</th>
                                    <th className="px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-400 uppercase text-right">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#30363d]">
                                {resto.map((player, index) => {
                                    const isMe = player.userId._id === currentUserId;
                                    const position = index + 4;
                                    const winRate = (player.wins / player.gamesPlayed) * 100;
                                    const winRateFormatted = winRate.toFixed(1);
                                    return (
                                        <motion.tr
                                            key={player.userId._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`transition-colors ${isMe
                                                ? 'bg-blue-600/20 border-l-4 border-l-blue-500 hover:bg-blue-600/30'
                                                : 'hover:bg-[#1c2128]'}`}
                                        >
                                            <td className={`px-3 md:px-6 py-3 md:py-4 font-mono ${isMe ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>#{position}</td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3">
                                                <div className={`w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    <User size={14} className="md:w-4 md:h-4" />
                                                </div>
                                                <span className={`font-medium truncate ${isMe ? 'text-blue-100' : ''}`}>
                                                    {player.userId.username} {isMe && <span className="hidden sm:inline text-[10px] ml-2 bg-blue-500 px-1.5 py-0.5 rounded text-white uppercase">You</span>}
                                                </span>
                                            </td>
                                            <td className={`px-3 md:px-6 py-3 md:py-4 text-center font-bold ${isMe ? 'text-blue-300' : 'text-green-400'}`}>{player.wins}</td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                                                <div className="flex flex-col items-end gap-0.5 md:gap-1.5">
                                                    <span className={`text-xs font-mono ${isMe ? 'text-blue-300 font-bold' : 'text-gray-400'}`}>{winRateFormatted}%</span>
                                                    <div className="w-12 md:w-24 h-1 md:h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${winRate}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className={`h-full rounded-full ${isMe ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : winRate > 50 ? 'bg-green-500' : 'bg-yellow-600'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Sección personal */}
                    {userRank && !isUserInTop20 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 shadow-lg backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-3 md:gap-4 flex-1">
                                <div className="bg-blue-500 text-white w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold flex-shrink-0">
                                    <span className="text-[10px] uppercase leading-none opacity-80">Rank</span>
                                    <span className="text-lg">#{userRank.position}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                                        Your Standing <Target size={14} className="text-blue-400 flex-shrink-0" />
                                    </h3>
                                    <p className="text-xs text-gray-400 italic">Keep playing to climb the leaderboard!</p>
                                </div>
                            </div>
                            <div className="flex gap-6 md:gap-8 text-right w-full md:w-auto">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Wins</p>
                                    <p className="text-lg md:text-xl font-bold text-green-400">{userRank.wins}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Win Rate</p>
                                    <p className="text-lg md:text-xl font-bold text-white">
                                        {((userRank.wins / userRank.gamesPlayed) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RankingView;