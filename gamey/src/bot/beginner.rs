use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot};
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
        let mut score = 0;
        score += self.evaluate_center_proximity(board, coords);
        score += self.evaluate_connection_points(board, coords);
        score += self.evaluate_position_type(board, coords);
        //score += self.evaluate_side_progression(board, coords);
        return score;
    }

    /*
        Evaluates how close the coordinates are to the center of the board.
     */
    fn evaluate_center_proximity(&self, board: &GameY, coords: Coordinates) -> i32 {
        let board_size = board.board_size();
        let n = (board_size - 1) as f32;
        let ideal_center = n / 3.0;
        
        let dx = coords.x() as f32 - ideal_center;
        let dy = coords.y() as f32 - ideal_center;
        let dz = coords.z() as f32 - ideal_center;
        
        let distance = (dx * dx + dy * dy + dz * dz).sqrt();
        
        let max_distance = n * 2.0 / 3.0_f32.sqrt();
        let normalized = (distance / max_distance).min(1.0);
        
        (50.0 * (1.0 - normalized)) as i32
    }

    /*
        Evaluates if the coordinates are connecting some points
     */
    fn evaluate_connection_points(&self, board: &GameY, coords: Coordinates) -> i32 {
        let temp_board = board.clone();
        let neighbors = temp_board.get_neighbors(&coords);
        let mut score = 0;
        for neighbor in neighbors {
            if temp_board.get_cell_owner(&neighbor) == Some(PlayerId::new(1)) {
                score += 10;
            }
        }
        score
    }

    /*
        Evaluates if the coordinates are near a border or a corner.
     */
    fn evaluate_position_type(&self, board: &GameY, coords: Coordinates) -> i32 {
        let board_size = board.board_size();
        let max_idx = board_size - 1;
        
        let is_corner = (coords.x() == 0 || coords.x() == max_idx) && 
                       (coords.y() == 0 || coords.y() == max_idx);
        
        let is_edge = coords.x() == 0 || coords.x() == max_idx || 
                     coords.y() == 0 || coords.y() == max_idx;
        
        if is_corner {
            return 15;
        } else if is_edge {
            return 10;
        }
        
        0
    }

    /*
        Evaluates if the coordinates are progressing towards a side not conquered by the bot.
     */
    fn evaluate_side_progression(&self, board: &GameY, coords: Coordinates) -> i32 {
        return 0; // Placeholder for future approaches.
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
        return self.choose_evaluated_move(board);
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Coordinates, GameY, Movement, PlayerId, bot};

    #[test]
    fn bot_wins_when_possible() {
        let mut board = GameY::new(3);
        let bot = BeginnerBot;
        let bot_player = PlayerId::new(1);
        
        board.add_move(Movement::Placement {
            player: bot_player,
            coords: Coordinates::new(2, 0, 0)
        }).unwrap();
        board.add_move(Movement::Placement {
            player: bot_player,
            coords: Coordinates::new(1,0,1)
        }).unwrap();
        
        let chosen = bot.choose_move(&board);
        assert_eq!(chosen, Some(Coordinates::new(0, 0, 2)));
    }

    #[test]
    fn bot_blocks_opponent_win() {
        let mut board = GameY::new(3);
        let bot = BeginnerBot;
        let player = PlayerId::new(0);
        
        board.add_move(Movement::Placement {
            player: player,
            coords: Coordinates::new(0, 2, 0)
        }).unwrap();
        board.add_move(Movement::Placement {
            player: player,
            coords: Coordinates::new(0,1,1)
        }).unwrap();
        
        let chosen = bot.choose_move(&board);
        print!("Chosen move: {:?}", chosen);
        assert_eq!(chosen, Some(Coordinates::new(1, 0, 1)));
    }

    #[test]
    fn bot_prioritizes_own_win_over_blocking() {
        let mut board = GameY::new(4);
        let bot = BeginnerBot;
        let bot_player = PlayerId::new(1);
        let opponent = PlayerId::new(0);
        
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(3, 0, 0) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(2, 0, 1) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(1, 2, 0) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(0, 0, 3) 
        }).unwrap();

        board.add_move(Movement::Placement { 
            player: opponent, 
            coords: Coordinates::new(2, 1, 0) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: opponent, 
            coords: Coordinates::new(1, 0, 2) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: opponent, 
            coords: Coordinates::new(0, 1, 2) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: opponent, 
            coords: Coordinates::new(0, 3, 0) 
        }).unwrap();
        
        let chosen = bot.choose_move(&board);
        assert_eq!(chosen, Some(Coordinates::new(1, 1, 1)));
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
    fn bot_detects_diagonal_win() {
        let mut board = GameY::new(4);
        let bot = BeginnerBot;
        let bot_player = PlayerId::new(1);
        
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(3, 0, 0) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(1, 0, 2) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(1, 1, 1) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(1, 2, 0) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(0, 0, 3) 
        }).unwrap();
        board.add_move(Movement::Placement { 
            player: bot_player, 
            coords: Coordinates::new(0, 3, 0) 
        }).unwrap();
        
        let chosen = bot.choose_move(&board);
        assert_eq!(chosen, Some(Coordinates::new(2, 0, 1)));
    }
}