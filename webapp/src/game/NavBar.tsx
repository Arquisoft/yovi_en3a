import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavBarProps {
    onLogout: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const username = localStorage.getItem("username") ?? "Player";

    const breadcrumb = () => {
        if (location.pathname === "/") return "Menu";
        if (location.pathname === "/select-game") return "Menu → Select Game";
        if (location.pathname.startsWith("/game/")) return "Menu → Select Game → Game";
        return "";
    };

    return (
        <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            height: "52px",
            background: "rgba(8, 11, 20, 0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center",
            padding: "0 1.5rem",
            gap: "1rem",
        }}>
            {/* Logo */}
            <button
                onClick={() => navigate("/")}
                style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#fff", fontWeight: 900, fontSize: "1.1rem",
                    letterSpacing: "0.05em", padding: 0,
                    fontFamily: "Georgia, serif",
                    flexShrink: 0,
                }}
            >
                Game<span style={{ color: "#6366f1" }}>Y</span>
            </button>

            {/* Breadcrumb */}
            <div style={{
                fontSize: "0.7rem", color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.05em", flex: 1,
            }}>
                {breadcrumb()}
            </div>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", position: "relative" }}>
                {/* Username pill */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        background: menuOpen ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${menuOpen ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: "6px",
                        padding: "0.3rem 0.75rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                    }}
                >
                    <div style={{
                        width: "22px", height: "22px", borderRadius: "50%",
                        background: "#6366f1",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", fontWeight: 700, color: "#fff",
                        flexShrink: 0,
                    }}>
                        {username[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>
                        {username}
                    </span>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", marginLeft: "2px" }}>
                        {menuOpen ? "▲" : "▼"}
                    </span>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                    <div style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        background: "#0d1117",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        padding: "0.4rem",
                        minWidth: "160px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}>
                        {[
                            { label: "🏠 Menu", action: () => { navigate("/"); setMenuOpen(false); } },
                            { label: "🎮 Play vs Bot", action: () => { navigate("/select-game"); setMenuOpen(false); } },
                            { label: "📊 History", action: () => { navigate("/history"); setMenuOpen(false); } },
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={item.action}
                                style={{
                                    display: "block", width: "100%", textAlign: "left",
                                    padding: "0.5rem 0.75rem",
                                    background: "none", border: "none", cursor: "pointer",
                                    color: "rgba(255,255,255,0.6)", fontSize: "0.8rem",
                                    borderRadius: "4px",
                                    transition: "all 0.1s ease",
                                    fontFamily: "monospace",
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.1)";
                                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLButtonElement).style.background = "none";
                                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
                                }}
                            >
                                {item.label}
                            </button>
                        ))}

                        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.3rem 0" }} />

                        <button
                            onClick={() => { onLogout(); setMenuOpen(false); }}
                            style={{
                                display: "block", width: "100%", textAlign: "left",
                                padding: "0.5rem 0.75rem",
                                background: "none", border: "none", cursor: "pointer",
                                color: "rgba(239,68,68,0.7)", fontSize: "0.8rem",
                                borderRadius: "4px",
                                transition: "all 0.1s ease",
                                fontFamily: "monospace",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                                (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "none";
                                (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.7)";
                            }}
                        >
                            ⏻ Log Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavBar;