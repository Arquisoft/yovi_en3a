use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot};
use rand::prelude::IndexedRandom;
pub struct MediumBot;

impl MediumBot {
    fn minimax(&self, board: &GameY, depth: usize, mut alpha: i32, mut beta: i32, maximizing_player: bool) -> i32 {
        if depth == 0 || board.check_game_over() {
            return self.evaluate_board(board);
        }

        if maximizing_player {
            let mut max_eval = i32::MIN;
            for &cell_index in board.available_cells() {
                let mut temp_board = board.clone();
                let coord = Coordinates::from_index(cell_index, board.board_size());
                let mv = Movement::Placement {
                    player: PlayerId::new(1),
                    coords: coord,
                };
                temp_board.add_move(mv);
                let eval = self.minimax(&temp_board, depth - 1, alpha, beta, false);
                max_eval = max_eval.max(eval);
                alpha = alpha.max(eval);
                if beta <= alpha {
                    break;
                }
            }
            return max_eval;
        } else {
            let mut min_eval = i32::MAX;
            for &cell_index in board.available_cells() {
                let mut temp_board = board.clone();
                let coord = Coordinates::from_index(cell_index, board.board_size());
                let mv = Movement::Placement {
                    player: PlayerId::new(0),
                    coords: coord,
                };
                temp_board.add_move(mv);
                let eval = self.minimax(&temp_board, depth - 1, alpha, beta, true);
                min_eval = min_eval.min(eval);
                beta = beta.min(eval);
                if beta <= alpha {
                    break;
                }
            }
            return min_eval;
        }
    }

    fn evaluate_board(&self, board: &GameY) -> i32 {
        return 1; // Placeholder evaluation function
    }

    fn chose_best_move(&self, board: &GameY) -> Option<Coordinates> {
        let mut best_score = i32::MIN;
        let mut best_move = None;
        let mut alpha = i32::MIN;
        let beta = i32::MAX;

        for &cell_index in board.available_cells() {
            let mut temp_board = board.clone();
            let coord = Coordinates::from_index(cell_index, board.board_size());
            let mv = Movement::Placement {
                player: PlayerId::new(1),
                coords: coord,
            };
            temp_board.add_move(mv);
            let score = self.minimax(&temp_board, 3, alpha, beta, false);
            alpha = alpha.max(score);
            if score > best_score {
                best_score = score;
                best_move = Some(coord);
            }
        }

        return best_move;
    }
    
}

impl YBot for MediumBot {
    fn name(&self) -> &str {
        "medium_bot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        return self.chose_best_move(board);
    }
}