import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart3, Trophy, Target, Hash, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion } from "framer-motion";
import HexBackground from './HexBackGround';

interface UserStats {
    userId: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
}

const StatsView: React.FC = () => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [myPosition, setMyPosition] = useState<number | null>(null);

    useEffect(() => {
        const fetchStatsAndRanking = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('token');
                const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
                if (!userId || !token) return;

                const statsRes = await fetch(`${gatewayUrl}/api/users/stats/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                const rankingRes = await fetch(`${gatewayUrl}/api/users/stats/ranking?sortBy=wins`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (rankingRes.ok) {
                    const rankingData = await rankingRes.json();
                    if (rankingData.userPosition) {
                        setMyPosition(rankingData.userPosition.position);
                    } else if (rankingData.topPlayers) {
                        const indexInTop = rankingData.topPlayers.findIndex((player: any) => {
                            const playerMongoId = player.userId._id || player.userId;
                            return String(playerMongoId) === String(userId);
                        });
                        if (indexInTop !== -1) setMyPosition(indexInTop + 1);
                        else setMyPosition(null);
                    }
                }
            } catch (err) {
                console.error("Error fetching ranking:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatsAndRanking();
    }, []);

    const chartData = stats ? [
        { name: 'Victories', value: stats.wins },
        { name: 'Defeats', value: stats.losses },
    ] : [];

    const COLORS = ['#3b82f6', '#ef4444'];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#080b14] flex flex-col items-center justify-center text-white relative overflow-hidden">
                <HexBackground />
                <Loader2 className="animate-spin mb-4 relative z-10" size={48} />
                <p className="text-gray-400 relative z-10">Loading your performance data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080b14] text-white relative overflow-hidden">
            <HexBackground />
            <div className="relative z-10 p-4 md:p-8">
                <div className="max-w-5xl mx-auto">

                    {/* Header */}
                    <div className="flex items-start md:items-center gap-3 md:gap-4 mb-8 md:mb-10">
                        <button
                            onClick={() => navigate('/menu')}
                            className="p-2 hover:bg-[#161b22] border border-transparent hover:border-[#30363d] rounded-lg transition-all flex-shrink-0"
                        >
                            <ArrowLeft size={20} className="md:w-6 md:h-6" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words">Statistics</h1>
                            <p className="text-xs md:text-sm text-gray-400">Real-time breakdown of your competitive history</p>
                        </div>
                    </div>

                    {error ? (
                        <div className="bg-blue-900/10 border border-blue-500/50 p-8 rounded-2xl flex flex-col items-center text-center">
                            <AlertCircle className="text-blue-500 mb-4" size={48} />
                            <p className="text-lg text-blue-100">{error}</p>
                            <button
                                onClick={() => navigate('/menu')}
                                className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                            >
                                Go Play Now
                            </button>
                        </div>
                    ) : stats && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Chart */}
                            <div className="lg:col-span-1 bg-[#161b22]/80 backdrop-blur-sm border border-[#30363d] p-4 md:p-6 rounded-2xl shadow-xl">
                                <h3 className="text-gray-400 text-xs font-bold uppercase mb-4 md:mb-6 tracking-widest">Win/Loss Ratio</h3>
                                <div className="h-[240px] md:h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={8}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {chartData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }}
                                                itemStyle={{ fontSize: '12px' }}
                                            />
                                            <Legend iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="text-center mt-3 md:mt-4">
                                    <p className="text-xl md:text-2xl font-bold">
                                        {stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(0) : 0}%
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase">Overall Win Rate</p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                <StatCard
                                    title="Global Rank"
                                    value={myPosition ? `#${myPosition}` : "Unranked"}
                                    icon={myPosition && myPosition <= 3 ? <Trophy className="text-yellow-400" /> : <Hash />}
                                    color={myPosition && myPosition <= 3 ? "text-yellow-400 font-bold" : "text-white"}
                                />
                                <StatCard title="Total Matches" value={stats.gamesPlayed} icon={<Hash size={20} className="text-gray-400" />} />
                                <StatCard
                                    title="Win Rate"
                                    value={`${stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : 0}%`}
                                    icon={<BarChart3 size={20} className="text-blue-400" />}
                                    color="text-blue-400"
                                />
                                <StatCard title="Victories" value={stats.wins} icon={<Trophy size={20} className="text-green-500" />} color="text-green-400" />
                                <StatCard title="Defeats" value={stats.losses} icon={<Target size={20} className="text-red-500" />} color="text-red-400" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color = "text-white" }: any) => (
    <div className="bg-[#161b22]/80 backdrop-blur-sm border border-[#30363d] p-4 md:p-6 rounded-2xl flex flex-col justify-between hover:bg-[#1c2128]/80 transition-colors group">
        <div className="flex justify-between items-start md:items-center mb-4 md:mb-6 gap-2">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest flex-1">{title}</span>
            <div className="p-2 bg-[#0d1117] rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                {icon}
            </div>
        </div>
        <div className={`text-2xl md:text-4xl font-mono font-bold ${color} break-words`}>{value}</div>
    </div>
);

export default StatsView;