import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


const MenuView: React.FC = () => {
    const [hovered, setHovered] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

    const handlePlayVsBot = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${gatewayUrl}/api/game-manager/create/standard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ botId: 'random_bot', boardSize: 7 })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            navigate(`/game/${data.gameId}`); // pasamos el gameId por la URL
        } catch (err) {
            console.error("Error creating game:", err);
        } finally {
            setLoading(false);
        }
    };

    const options = [
        { label: "Play vs Bot", icon: "🤖", onClick: () => navigate("/select-game") },
        { label: "Multiplayer", icon: "⚔️", path: "/multiplayer" },
        { label: "History & Stats", icon: "📊", path: "/history" },
        { label: "How to Play", icon: "📖", onClick: () => navigate("/how-to-play") },
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-1">Game Y</h1>
                    <p className="text-gray-400 text-sm">Choose an option to continue</p>
                </div>

                <div className="flex flex-col gap-3">
                    {options.map((item) => (
                        <button
                            key={item.label}
                            onMouseEnter={() => setHovered(item.label)}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => item.onClick ? item.onClick() : navigate(item.path!)}
                            disabled={loading && item.label === "Play vs Bot"}
                            className="flex items-center gap-3 w-full px-5 py-4 rounded-lg text-left transition-all duration-150"
                            style={{
                                background: hovered === item.label ? "#1e293b" : "#111827",
                                border: `1px solid ${hovered === item.label ? "#6366f1" : "#1f2937"}`,
                                color: hovered === item.label ? "#fff" : "#9ca3af",
                                opacity: loading && item.label === "Play vs Bot" ? 0.6 : 1,
                            }}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium text-base">
                                {loading && item.label === "Play vs Bot" ? "Creating game..." : item.label}
                            </span>
                        </button>
                    ))}

                    <div className="border-t border-gray-800 my-1" />

                    <button
                        onMouseEnter={() => setHovered("logout")}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => {

                            localStorage.removeItem('token');
                            localStorage.removeItem('userId');


                            navigate('/');
                        }}
                        className="w-full py-3 rounded-lg font-medium text-sm transition-all duration-150"
                        style={{
                            background: "transparent",
                            border: `1px solid ${hovered === "logout" ? "#ef4444" : "#374151"}`,
                            color: hovered === "logout" ? "#ef4444" : "#6b7280",
                        }}
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuView;