import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import '@testing-library/jest-dom'
import GameBoard from "../game/GameBoard";
import type { GameBoardRef } from "../game/GameBoard";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock HexCell to simplify the DOM
vi.mock("../game/HexCell", () => {
    return {
        // Usamos forwardRef porque el GameBoard le pasa una ref a cada HexCell
        default: React.forwardRef((props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                selectByPlayer: vi.fn(() => true),
                selectByPlayer2: vi.fn(() => true),
            }));

            return (
                <button
                    data-testid="hex-cell"
                    aria-label={`cell-${props.name}`}
                    onClick={() => props.onCellPlayed?.('p1', 'Test Player', props.name)}
                >
                    {props.name}
                </button>
            );
        }),
    };
});

describe("GameBoard Component", () => {
    const renderBoard = (size = 3) => {
        return render(
            <MemoryRouter initialEntries={[`/game/123`]}>
                <Routes>
                    <Route
                        path="/game/:gameId"
                        element={<GameBoard boardSize={size} />}
                    />
                </Routes>
            </MemoryRouter>
        );
    };

    it("renders the correct number of cells based on boardSize", () => {
        // For size 3, the coordinate logic generates a specific number of cells
        // (Row 0: 1, Row 1: 2, Row 2: 3) = 6 cells
        renderBoard(3);
        const cells = screen.getAllByTestId("hex-cell");
        expect(cells).toHaveLength(6);
    });

    it("calculates barycentric coordinates correctly (top cell)", () => {
        renderBoard(3);
        // The top cell in your logic is boardSize - 1 - row
        // For size 3, row 0: x=2, y=0, z=0
        expect(screen.getByText("(2,0,0)")).toBeInTheDocument();
    });

    it("calls onCellPlayed when a cell is clicked", () => {
        const onCellPlayedMock = vi.fn();
        render(
            <MemoryRouter>
                <GameBoard boardSize={3} onCellPlayed={onCellPlayedMock} />
            </MemoryRouter>
        );

        const cell = screen.getByRole('button', { name: /cell-\(2,0,0\)/i });
        fireEvent.click(cell);

        expect(onCellPlayedMock).toHaveBeenCalledWith('p1', 'Test Player', "(2,0,0)");
    });

    it("exposes selectCellByCoordinates via ref", () => {
        const boardRef = React.createRef<GameBoardRef>();
        render(
            <MemoryRouter>
                <GameBoard ref={boardRef} boardSize={3} />
            </MemoryRouter>
        );

        // Call the imperative method
        const result = boardRef.current?.selectCellByCoordinates(2, 0, 0, "p1");
        expect(result).toBe(true);
    });
});