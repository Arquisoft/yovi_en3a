import { Button } from "./components/ui/button";

interface MenuViewProps {
    onLogout: () => void; // Añadimos esta prop para avisar a App.tsx
}

const MenuView: React.FC<MenuViewProps> = ({ onLogout }) => {
    const options = [
        "Play vs Bot",
        "Multiplayer",
        "History and stats",
        "How to play"
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
            <h1 className="text-4xl font-extrabold mb-10 text-slate-800">Game Y</h1>

            <div className="flex flex-col gap-4 w-full max-w-md">
                {/* Botones normales */}
                {options.map((item) => (
                    <Button
                        key={item}
                        variant="outline"
                        className="h-16 text-xl font-semibold shadow-sm text-slate-900 bg-white w-full"
                    >
                        {item}
                    </Button>
                ))}

                {/* Botón de Log Out Rojo */}
                <Button
                    variant="destructive"
                    onClick={onLogout}
                    className="h-16 text-xl font-semibold shadow-md w-full mt-4 bg-red-600 hover:bg-red-700 text-white"
                >
                    Log Out
                </Button>
            </div>
        </div>
    );
};

export default MenuView;