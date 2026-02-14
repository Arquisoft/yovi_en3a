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


#[cfg(test)]
mod tests {
    use super::*;
    use crate::{GameY, Movement, PlayerId, Coordinates};

    #[test]
    fn bot_wins_when_possible() {
        let mut board = GameY::new(3);
        let bot = BeginnerBot;
        let player = PlayerId::new(0);
        
        board.add_move(Movement::Placement {
            player,
            coords: Coordinates::new(2, 0, 0)
        }).unwrap();
        board.add_move(Movement::Placement {
            player,
            coords: Coordinates::new(1,0,1)
        }).unwrap();
        
        let chosen = bot.choose_move(&board);
        assert_eq!(chosen, Some(Coordinates::new(0, 0, 2)));
    }

    #[test]
    fn bot_blocks_opponent_win() {
        let mut board = GameY::new(3);
        let bot = BeginnerBot;
        let opponent = PlayerId::new(0);
        
        board.add_move(Movement::Placement { 
            player: opponent, 
            coords: Coordinates::new(1, 1, 0) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: opponent, 
            coords: Coordinates::new(1, 0, 1) 
        }).unwrap();
        
        let chosen = bot.choose_move(&board);
        assert_eq!(chosen, Some(Coordinates::new(0, 1, 1)));
    }

    #[test]
    fn bot_prioritizes_own_win_over_blocking() {
        let mut board = GameY::new(3);
        let bot = BeginnerBot;
        let bot_player = PlayerId::new(1);
        let opponent = PlayerId::new(0);
        
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(2, 0, 0) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(1, 1, 0) 
        }).unwrap();
        
        board.add_move(Movement::Placement { 
            player: opponent, 
            coords: Coordinates::new(0, 0, 2) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: opponent, 
            coords: Coordinates::new(0, 1, 1) 
        }).unwrap();
        
        let chosen = bot.choose_move(&board);
        assert_eq!(chosen, Some(Coordinates::new(0, 2, 0)));
    }

    #[test]
    fn bot_chooses_move_on_empty_board() {
        let board = GameY::new(3);
        let bot = BeginnerBot;
        
        let chosen = bot.choose_move(&board);
        assert!(chosen.is_some());
        
        if let Some(coords) = chosen {
            let sum = coords.x() + coords.y() + coords.z();
            assert_eq!(sum, 2);
        }
    }

    #[test]
    fn bot_detects_vertical_win() {
        let mut board = GameY::new(3);
        let bot = BeginnerBot;
        let bot_player = PlayerId::new(1);
        
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(0, 2, 0) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(0, 1, 1) 
        }).unwrap();
        
        let chosen = bot.choose_move(&board);
        assert_eq!(chosen, Some(Coordinates::new(0, 0, 2)));
    }

    #[test]
    fn bot_detects_diagonal_win() {
        let mut board = GameY::new(3);
        let bot = BeginnerBot;
        let bot_player = PlayerId::new(1);
        
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(2, 0, 0) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(1, 1, 0) 
        }).unwrap();
        
        let chosen = bot.choose_move(&board);
        assert_eq!(chosen, Some(Coordinates::new(0, 2, 0)));
    }
}