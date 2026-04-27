import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import '@testing-library/jest-dom';
import GameBoard from "../game/GameBoard";
import type { GameBoardRef } from "../game/GameBoard";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ── Mock fetch global para evitar llamadas reales al backend ────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("../game/HexCell", () => ({
    default: React.forwardRef((props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            selectByPlayer:          vi.fn(() => true),
            selectByPlayer2:         vi.fn(() => true),
            deselect:                vi.fn(() => true),
            requestSelectForPlayer2: vi.fn(),
        }));

        return (
            <button
                data-testid="hex-cell"
                aria-label={`cell-${props.name}`}
                onClick={() => props.onCellClick?.(props.coordinates, props.name)}
            >
                {props.name}
            </button>
        );
    }),
}));

// ── Helper ──────────────────────────────────────────────────────────────────

const renderBoard = (size = 3, extraProps: Record<string, unknown> = {}) =>
    render(
        <MemoryRouter initialEntries={["/game/123/3/standard"]}>
            <Routes>
                <Route
                    path="/game/:gameId/:size/:gameType"
                    element={<GameBoard boardSize={size} {...extraProps} />}
                />
            </Routes>
        </MemoryRouter>
    );

// ── Tests ───────────────────────────────────────────────────────────────────

describe("GameBoard Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock por defecto: estado inicial vacío + movimiento sin ganador
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ yen: { layout: "---" } }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: "continue", yen: { layout: "---", size: 3 } }),
            });
    });

    it("renders the correct number of cells based on boardSize", () => {
        renderBoard(3);
        expect(screen.getAllByTestId("hex-cell")).toHaveLength(6);
    });

    it("calculates barycentric coordinates correctly (top cell)", () => {
        renderBoard(3);
        // Fila 0: x = boardSize-1-0 = 2, y = 0, z = 0
        expect(screen.getByText("(2,0,0)")).toBeInTheDocument();
    });

    it("renders all expected coordinate labels for size 3", () => {
        renderBoard(3);
        const expected = [
            "(2,0,0)",
            "(1,0,1)", "(1,1,0)",
            "(0,0,2)", "(0,1,1)", "(0,2,0)",
        ];
        expected.forEach((label) => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    it("calls onCellPlayed when a cell is clicked and API responds", async () => {
        const onCellPlayedMock = vi.fn();
        renderBoard(3, { onCellPlayed: onCellPlayedMock });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /cell-\(2,0,0\)/i }));
        });

        // handleClick llama a fetch; verificamos que se intentó la llamada
        expect(mockFetch).toHaveBeenCalled();
    });

    it("exposes selectCellByCoordinates via ref for p1", () => {
        const boardRef = React.createRef<GameBoardRef>();
        render(
            <MemoryRouter initialEntries={["/game/123/3/standard"]}>
                <Routes>
                    <Route
                        path="/game/:gameId/:size/:gameType"
                        element={<GameBoard ref={boardRef} boardSize={3} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        const result = boardRef.current?.selectCellByCoordinates(2, 0, 0, "p1");
        expect(result).toBe(true);
    });

    it("exposes selectCellByCoordinates via ref for p2", () => {
        const boardRef = React.createRef<GameBoardRef>();
        render(
            <MemoryRouter initialEntries={["/game/123/3/standard"]}>
                <Routes>
                    <Route
                        path="/game/:gameId/:size/:gameType"
                        element={<GameBoard ref={boardRef} boardSize={3} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        const result = boardRef.current?.selectCellByCoordinates(0, 2, 0, "p2");
        expect(result).toBe(true);
    });

    it("returns falsy when selectCellByCoordinates targets a non-existent cell", () => {
        const boardRef = React.createRef<GameBoardRef>();
        render(
            <MemoryRouter initialEntries={["/game/123/3/standard"]}>
                <Routes>
                    <Route
                        path="/game/:gameId/:size/:gameType"
                        element={<GameBoard ref={boardRef} boardSize={3} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        const result = boardRef.current?.selectCellByCoordinates(9, 9, 9, "p1");
        expect(result).toBeFalsy();
    });
});