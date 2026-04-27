import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRef } from "react";
import HexCell from "../game/HexCell";
import type { HexCellRef } from "../game/HexCell";
import '@testing-library/jest-dom/vitest';

describe("HexCell Component", () => {
    const defaultProps = {
        gameId: "game-123",
        coordinates: { x: 2, y: 0, z: 0 },
        name: "(2,0,0)",
        onCellPlayed: vi.fn(),
        onGameOver: vi.fn(),
        onRequestSelectCell: vi.fn(),
        onCellClick: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders correctly with initial state", () => {
        render(<HexCell {...defaultProps} />);
        const cell = screen.getByText("(2,0,0)");
        expect(cell).toBeInTheDocument();
        // Color inicial none bg: #21262d
        expect(cell).toHaveStyle({ backgroundColor: "rgb(33, 38, 45)" });
    });

    it("changes color when selectByPlayer is called via ref", async () => {
        const ref = createRef<HexCellRef>();
        render(<HexCell {...defaultProps} ref={ref} />);

        ref.current?.selectByPlayer();

        await waitFor(() => {
            const cell = screen.getByText("(2,0,0)");
            // p1 sel: #3b82f6
            expect(cell).toHaveStyle({ backgroundColor: "rgb(59, 130, 246)" });
        });
    });

    it("changes color when selectByPlayer2 is called via ref", async () => {
        const ref = createRef<HexCellRef>();
        render(<HexCell {...defaultProps} ref={ref} />);

        ref.current?.selectByPlayer2();

        await waitFor(() => {
            const cell = screen.getByText("(2,0,0)");
            // p2 sel: #ef4444
            expect(cell).toHaveStyle({ backgroundColor: "rgb(239, 68, 68)" });
        });
    });

    it("deselects correctly via ref", async () => {
        const ref = createRef<HexCellRef>();
        render(<HexCell {...defaultProps} ref={ref} />);

        ref.current?.selectByPlayer();
        await waitFor(() => {
            expect(screen.getByText("(2,0,0)")).toHaveStyle({ backgroundColor: "rgb(59, 130, 246)" });
        });

        ref.current?.deselect();
        await waitFor(() => {
            // Vuelve al color inicial none
            expect(screen.getByText("(2,0,0)")).toHaveStyle({ backgroundColor: "rgb(33, 38, 45)" });
        });
    });

    it("calls onCellClick with coordinates and name when clicked", () => {
        render(<HexCell {...defaultProps} />);

        fireEvent.click(screen.getByText("(2,0,0)"));

        expect(defaultProps.onCellClick).toHaveBeenCalledWith(
            { x: 2, y: 0, z: 0 },
            "(2,0,0)"
        );
    });

    it("does not call onCellClick when already selected", async () => {
        const ref = createRef<HexCellRef>();
        render(<HexCell {...defaultProps} ref={ref} />);

        ref.current?.selectByPlayer();
        await waitFor(() => {
            expect(screen.getByText("(2,0,0)")).toHaveStyle({ backgroundColor: "rgb(59, 130, 246)" });
        });

        fireEvent.click(screen.getByText("(2,0,0)"));
        expect(defaultProps.onCellClick).not.toHaveBeenCalled();
    });

    it("does not call onCellClick when disabled", () => {
        render(<HexCell {...defaultProps} disabled={true} />);

        fireEvent.click(screen.getByText("(2,0,0)"));

        expect(defaultProps.onCellClick).not.toHaveBeenCalled();
    });

    it("does not call onCellClick when coordinates are not provided", () => {
        const propsWithoutCoords = { ...defaultProps, coordinates: undefined };
        render(<HexCell {...propsWithoutCoords} />);

        fireEvent.click(screen.getByText("(2,0,0)"));

        expect(defaultProps.onCellClick).not.toHaveBeenCalled();
    });

    it("calls onRequestSelectCell with correct args via requestSelectForPlayer2", () => {
        const ref = createRef<HexCellRef>();
        render(<HexCell {...defaultProps} ref={ref} />);

        const targetCoords = { x: 1, y: 0, z: 0 };
        ref.current?.requestSelectForPlayer2(targetCoords);

        expect(defaultProps.onRequestSelectCell).toHaveBeenCalledWith(targetCoords, "p2");
    });

    it("updates to p1 color when owner prop changes to p1", async () => {
        const { rerender } = render(<HexCell {...defaultProps} owner="none" />);

        rerender(<HexCell {...defaultProps} owner="p1" />);

        await waitFor(() => {
            expect(screen.getByText("(2,0,0)")).toHaveStyle({ backgroundColor: "rgb(59, 130, 246)" });
        });
    });

    it("updates to p2 color when owner prop changes to p2", async () => {
        const { rerender } = render(<HexCell {...defaultProps} owner="none" />);

        rerender(<HexCell {...defaultProps} owner="p2" />);

        await waitFor(() => {
            // p2 sel: #ef4444
            expect(screen.getByText("(2,0,0)")).toHaveStyle({ backgroundColor: "rgb(239, 68, 68)" });
        });
    });
});