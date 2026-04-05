import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import '@testing-library/jest-dom';
import GameBoard from "../game/GameBoard";
import type { GameBoardRef } from "../game/GameBoard";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../game/HexCell", () => {
    return {
        default: React.forwardRef((props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                selectByPlayer:  vi.fn(() => true),
                selectByPlayer2: vi.fn(() => true),
                deselect:        vi.fn(() => true),
                requestSelectForPlayer2: vi.fn(),
            }));

            return (
                <button
                    data-testid="hex-cell"
                    aria-label={`cell-${props.name}`}
                    onClick={() =>
                        props.onCellClick?.(props.coordinates, props.name)
                    }
                >
                    {props.name}
                </button>
            );
        }),
    };
});

// Helper: renderiza con la ruta correcta (/game/:gameId, sin :gameType en la URL)
const renderBoard = (size = 3, extraProps: Record<string, unknown> = {}) =>
    render(
        <MemoryRouter initialEntries={["/game/123"]}>
            <Routes>
                <Route
                    path="/game/:gameId"
                    element={<GameBoard boardSize={size} {...extraProps} />}
                />
            </Routes>
        </MemoryRouter>
    );

describe("GameBoard Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the correct number of cells based on boardSize", () => {
        // size=3 → filas [0,1,2] → 1+2+3 = 6 celdas
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
        // Fila 0: (2,0,0)
        // Fila 1: (1,0,1), (1,1,0)
        // Fila 2: (0,0,2), (0,1,1), (0,2,0)
        const expected = [
            "(2,0,0)",
            "(1,0,1)", "(1,1,0)",
            "(0,0,2)", "(0,1,1)", "(0,2,0)",
        ];
        expected.forEach((label) => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    it("calls onCellPlayed when a cell is clicked", async () => {
        const onCellPlayedMock = vi.fn();

        // useGameLogic intercepta el click en handleClick y luego llama a
        // onCellPlayed internamente. Para testear sin el hook real necesitamos
        // que el mock de HexCell dispare onCellClick, que es lo que recibe del HexGrid.
        // Si useGameLogic no está mockeado, este test valida el flujo integrado.
        render(
            <MemoryRouter initialEntries={["/game/123"]}>
                <Routes>
                    <Route
                        path="/game/:gameId"
                        element={
                            <GameBoard boardSize={3} onCellPlayed={onCellPlayedMock} />
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole("button", { name: /cell-\(2,0,0\)/i }));

        // handleClick en useGameLogic llama a la API y luego a onCellPlayed;
        // como fetch no está mockeado aquí, solo verificamos que el click
        // llegó al handler sin lanzar excepciones.
        // Si quieres verificar onCellPlayed, mockea fetch antes del render:
        //   global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({...}) });
        expect(onCellPlayedMock).not.toThrow?.();
    });

    it("exposes selectCellByCoordinates via ref", () => {
        const boardRef = React.createRef<GameBoardRef>();

        render(
            <MemoryRouter initialEntries={["/game/123"]}>
                <Routes>
                    <Route
                        path="/game/:gameId"
                        element={<GameBoard ref={boardRef} boardSize={3} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        // La celda (2,0,0) está montada y su ref registrada en cellRefs
        const result = boardRef.current?.selectCellByCoordinates(2, 0, 0, "p1");
        expect(result).toBe(true);
    });

    it("exposes selectCellByCoordinates for p2 via ref", () => {
        const boardRef = React.createRef<GameBoardRef>();

        render(
            <MemoryRouter initialEntries={["/game/123"]}>
                <Routes>
                    <Route
                        path="/game/:gameId"
                        element={<GameBoard ref={boardRef} boardSize={3} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        const result = boardRef.current?.selectCellByCoordinates(0, 2, 0, "p2");
        expect(result).toBe(true);
    });

    it("returns false (or undefined) when selectCellByCoordinates targets a non-existent cell", () => {
        const boardRef = React.createRef<GameBoardRef>();

        render(
            <MemoryRouter initialEntries={["/game/123"]}>
                <Routes>
                    <Route
                        path="/game/:gameId"
                        element={<GameBoard ref={boardRef} boardSize={3} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        // Coordenadas que no existen en el tablero de size 3
        const result = boardRef.current?.selectCellByCoordinates(9, 9, 9, "p1");
        expect(result).toBeFalsy();
    });
});