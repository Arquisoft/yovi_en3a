use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot, coord};
use rand::prelude::IndexedRandom;
pub struct BeginnerBot;

impl BeginnerBot {
    fn check_win(&self, board: &GameY, player: PlayerId) -> Option<Coordinates> {
        for &cell_idx in board.available_cells() {
            let coords = Coordinates::from_index(cell_idx, board.board_size());
            
            let mut temp_board = board.clone();
            
            let movement = Movement::Placement {
                player: player,
                coords,
            };
            
            if temp_board.add_move(movement).is_ok() {
                if let GameStatus::Finished { winner } = temp_board.status() {
                    if *winner == player {
                        return Some(coords);
                    }
                }
            }
        }
        None
    }

    fn choose_evaluated_move(&self, board: &GameY) -> Option<Coordinates> {
        let available_cells = board.available_cells();
        let mut best_score = i32::MIN;
        let mut best_move = None;

        for &cell_idx in available_cells {
            let coords = Coordinates::from_index(cell_idx, board.board_size());
            let score = self.evaluate_move(board, coords);
            if score > best_score {
                best_score = score;
                best_move = Some(coords);
            }
        }
        best_move
    }

    fn evaluate_move(&self, board: &GameY, coords: Coordinates) -> i32 {
        return 1; // Placeholder: In the v1 version of the bot this will be implemented.
    }
}

impl YBot for BeginnerBot {
    fn name(&self) -> &str {
        "beginner_bot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        if let Some(coordinates) = self.check_win(board, PlayerId::new(1)) {
            return Some(coordinates);
        }else if let Some(coordinates) = self.check_win(board, PlayerId::new(0)) {
            return Some(coordinates);
        }
        //return choose_evaluated_move(board); // Placeholder for v1, for now it will just choose a random move.
        let available_cells = board.available_cells();
        let cell = available_cells.choose(&mut rand::rng())?;
        let coordinates: Coordinates = Coordinates::from_index(*cell, board.board_size());
        Some(coordinates)
    }
}