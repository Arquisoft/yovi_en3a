import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import {
    BarChart3,
    Trophy,
    Target,
    Hash,
    ArrowLeft,
    Loader2,
    AlertCircle
} from 'lucide-react';

interface UserStats {
    userId: string;
    gamesPlayed: number;
    wins: number;      // Antes era gamesWon
    losses: number;    // Antes era gamesLost
    winRate: number;
}

const StatsView: React.FC = () => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('token');
                const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

                if (!userId || !token) {
                    navigate('/');
                    return;
                }

                const response = await fetch(`${gatewayUrl}/api/users/stats/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        // 'Content-Type': 'application/json', // A veces esto también sobra en un GET
                    }
                });

                const data = await response.json();

                if (response.status === 404) {
                    setError("No games played yet. Time to start your first match!");
                } else if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch stats');
                } else {
                    setStats(data);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    // Datos para el gráfico circular
    const chartData = stats ? [
        { name: 'Victories', value: stats.wins },
        { name: 'Defeats', value: stats.losses },
    ] : [];

    const COLORS = ['#3b82f6', '#ef4444']; // Azul (P1) y Rojo (P2/Bot)

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="text-gray-400">Loading your performance data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-white p-4 md:p-8">
            <div className="max-w-5xl mx-auto">

                {/* Header Navigation */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate('/menu')}
                        className="p-2 hover:bg-[#161b22] border border-transparent hover:border-[#30363d] rounded-lg transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
                        <p className="text-gray-400 text-sm">Real-time breakdown of your competitive history</p>
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

                        {/* Visual Chart Card */}
                        <div className="lg:col-span-1 bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl">
                            <h3 className="text-gray-400 text-xs font-bold uppercase mb-6 tracking-widest">Win/Loss Ratio</h3>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={90}
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
                                            itemStyle={{ fontSize: '14px' }}
                                        />
                                        <Legend iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center mt-4">
                                <p className="text-2xl font-bold">
                                    {stats.gamesPlayed > 0
                                        ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(0)
                                        : 0}%
                                </p>
                                <p className="text-xs text-gray-500 uppercase">Overall Win Rate</p>
                            </div>
                        </div>

                        {/* Numeric Stats Grid */}
                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatCard
                                title="Total Matches"
                                value={stats.gamesPlayed}
                                icon={<Hash size={20} className="text-gray-400" />}
                            />
                            <StatCard
                                title="Win Rate"
                                value={`${stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : 0}%`}
                                icon={<BarChart3 size={20} className="text-blue-400" />}
                                color="text-blue-400"
                            />
                            <StatCard
                                title="Victories"
                                value={stats.wins}
                                icon={<Trophy size={20} className="text-green-500" />}
                                color="text-green-400"
                            />
                            <StatCard
                                title="Defeats"
                                value={stats.losses}
                                icon={<Target size={20} className="text-red-500" />}
                                color="text-red-400"
                            />
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

/* Helper Component for Stat Cards */
const StatCard = ({ title, value, icon, color = "text-white" }: any) => (
    <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl flex flex-col justify-between hover:bg-[#1c2128] transition-colors group">
        <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{title}</span>
            <div className="p-2 bg-[#0d1117] rounded-lg group-hover:scale-110 transition-transform">
                {icon}
            </div>
        </div>
        <div className={`text-4xl font-mono font-bold ${color}`}>{value}</div>
    </div>
);

export default StatsView;