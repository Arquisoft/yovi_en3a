import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { createRef } from "react";
import HexCell from "../game/HexCell";
import type { HexCellRef } from "../game/HexCell";
import '@testing-library/jest-dom/vitest';

// Mock de fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("HexCell Component", () => {
    const defaultProps = {
        gameId: "game-123",
        coordinates: { x: 2, y: 0, z: 0 },
        name: "(2,0,0)",
        onCellPlayed: vi.fn(),
        onGameOver: vi.fn(),
        onRequestSelectCell: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

    });

    it("renders correctly with initial state", () => {
        render(<HexCell {...defaultProps} />);
        const cell = screen.getByText("(2,0,0)");
        expect(cell).toBeInTheDocument();
        // Color inicial (bg: #21262d)
        expect(cell).toHaveStyle({ backgroundColor: "rgb(33, 38, 45)" });
    });

    it("changes color when selectByPlayer is called via ref", async () => {
        const ref = createRef<HexCellRef>();
        render(<HexCell {...defaultProps} ref={ref} />);

        ref.current?.selectByPlayer();

        // Sin el awit no funciona porque el cambio de estado es asíncrono
        await waitFor(() => {
            const cell = screen.getByText("(2,0,0)");
            expect(cell).toHaveStyle({ backgroundColor: "rgb(59, 130, 246)" });
        });
    });

    it("handles a successful move and triggers bot response", async () => {
        // 1. Simulamos el estado inicial (antes del movimiento)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ yen: { layout: "B--" } }), // Supongamos 'B' es vacío
        });

        // 2. Simulamos la respuesta del movimiento (el bot pone una 'R')
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "continue",
                yen: { layout: "BR-", size: 3 }
            }),
        });

        render(<HexCell {...defaultProps} />);

        const cell = screen.getByText("(2,0,0)");
        fireEvent.click(cell);

        // Verificamos que se llamó a la API de movimiento
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/api/game-manager/game/game-123/move"),
                expect.anything()
            );
        });

        // Verificamos que se notificó el movimiento del jugador
        expect(defaultProps.onCellPlayed).toHaveBeenCalledWith("p1", "Player 1", "(2,0,0)");

        // Verificamos que se detectó el movimiento del Bot ('R' en el layout nuevo)
        await waitFor(() => {
            expect(defaultProps.onRequestSelectCell).toHaveBeenCalled();
            expect(defaultProps.onCellPlayed).toHaveBeenCalledWith("p2", "Bot", expect.any(String));
        });
    });

    it("triggers onGameOver when the API returns won status", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ yen: { layout: "---" } }),
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: "won" }),
        });

        render(<HexCell {...defaultProps} />);
        fireEvent.click(screen.getByText("(2,0,0)"));

        await waitFor(() => {
            expect(defaultProps.onGameOver).toHaveBeenCalledWith("p1");
        });
    });
});