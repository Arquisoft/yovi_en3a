use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot};
use rand::prelude::IndexedRandom;
use std::collections::{HashMap, HashSet, VecDeque};

pub const MAX_NUMBER: i32 = i32::MAX / 2;
pub const MIN_NUMBER: i32 = i32::MIN / 2;
pub struct MediumBot;

impl MediumBot {
    fn minimax(&self, board: &GameY, depth: usize, mut alpha: i32, mut beta: i32, maximizing_player: bool) -> i32 {
        if depth == 0 || board.check_game_over() {
            return self.evaluate_board(board);
        }

        if maximizing_player {
            let mut max_eval = MIN_NUMBER;
            let candidates = self.relevant_cells(board);
            for cell_index in candidates {
                let mut temp_board = board.clone();
                let coord = Coordinates::from_index(cell_index, board.board_size());
                let mv = Movement::Placement {
                    player: PlayerId::new(1),
                    coords: coord,
                };
                temp_board.add_move(mv).unwrap();
                let eval = self.minimax(&temp_board, depth - 1, alpha, beta, false);
                max_eval = max_eval.max(eval);
                alpha = alpha.max(eval);
                if beta <= alpha {
                    break;
                }
            }
            return max_eval;
        } else {
            let mut min_eval = MAX_NUMBER;
            let candidates = self.relevant_cells(board);
            for cell_index in candidates {
                let mut temp_board = board.clone();
                let coord = Coordinates::from_index(cell_index, board.board_size());
                let mv = Movement::Placement {
                    player: PlayerId::new(0),
                    coords: coord,
                };
                temp_board.add_move(mv).unwrap();
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

    fn chose_best_move(&self, board: &GameY) -> Option<Coordinates> {
        let mut best_score = MIN_NUMBER;
        let mut best_move = None;
        let mut alpha = MIN_NUMBER;
        let beta = MAX_NUMBER;

        let candidates = self.relevant_cells(board);

        for cell_index in candidates {
            let mut temp_board = board.clone();
            let coord = Coordinates::from_index(cell_index, board.board_size());
            let mv = Movement::Placement {
                player: PlayerId::new(1),
                coords: coord,
            };
            temp_board.add_move(mv).unwrap();
            
            if temp_board.check_game_over() {
                return Some(coord);
            }
            let score = self.minimax(&temp_board, 4, alpha, beta, false);
            alpha = alpha.max(score);
            if score > best_score {
                best_score = score;
                best_move = Some(coord);
            }
        }

        best_move
    }

    /*
        This method evaluates the board state and returns a score representing how favorable the position is for the bot.
        What it is doing is first checking if there is a winner, if there is, it returns a very high score if the bot wins 
        and a very low score if the opponent wins.

        If there is no winner, it calculates a score for both the bot and the opponent based on the distance of their islets 
        to the sides of the board.

        Then we normalize the score for having a value between 0 and 99 and we return the difference between the bot's 
        score and the opponent's score, so a positive score means a favorable position for the bot and a negative score 
        means an unfavorable position.

        PROBLEMS: Formula is used to test as a first approach, but we could find another better.
     */
    fn evaluate_board(&self, board: &GameY) -> i32 {
        if let Some(winner) = self.get_winner(board) {
            return if winner.id() == 1 { 10_000 } else { -100_000 };
        }

        let size = board.board_size() as i32;
        let max_dist = (size * (size - 1) / 4 + 2) * 3;

        let score_bot = self.player_score(board, PlayerId::new(1)) as i32;
        let score_human = self.player_score(board, PlayerId::new(0)) as i32;

        let grade_bot = if max_dist > 0 {
            99 * (max_dist - score_bot.min(max_dist)) / max_dist
        } else {
            0
        };
        let grade_human = if max_dist > 0 {
            99 * (max_dist - score_human.min(max_dist)) / max_dist
        } else {
            0
        };

        grade_bot - grade_human
    }

    fn get_winner(&self, board: &GameY) -> Option<PlayerId> {
        match board.status() {
            GameStatus::Finished { winner } => Some(*winner),
            _ => None,
        }
    }

    /*
        We obtain the different islets (connected cells) of the player,
        then we obtain all the visitable cells for that player. 
        If there is no islets, we return the max distance.
        Then for each islet we calculate the distance to each side, and we return the minimum of the sum of those distances for all islets.

        PROBLEMS: If it is the first move, the bot will move to a position close to the cell placed by the player
     */
    fn player_score(&self, board: &GameY, player: PlayerId) -> u32 {
        let islets = self.separate_into_islets(board, player);
        let visitable = self.visitable_cells(board, player);

        if islets.is_empty() {
            return MAX_NUMBER as u32;
        }

        islets
            .iter()
            .map(|islet| {
                let d_a = self.min_distance_to_side(board, islet, 0, &visitable);
                let d_b = self.min_distance_to_side(board, islet, 1, &visitable);
                let d_c = self.min_distance_to_side(board, islet, 2, &visitable);
                d_a + d_b + d_c
            })
            .min()
            .unwrap_or(MAX_NUMBER as u32)
    }

    /*
        This method is used to separate the player's occupied cells into islets (connected components). 
        We iterate through all the cells owned by the player and perform a BFS to find all connected cells, 
        marking them as visited to avoid processing them multiple times. Each time we encounter an unvisited cell, 
        we start a new BFS to form a new islet until all cells have been processed.
     */
    fn separate_into_islets(&self, board: &GameY, player: PlayerId) -> Vec<Vec<Coordinates>> {
        let player_cells: HashSet<Coordinates> = (0..board.total_cells())
            .map(|idx| Coordinates::from_index(idx, board.board_size()))
            .filter(|coord| board.get_cell_owner(coord) == Some(player))
            .collect();

        let mut visited: HashSet<Coordinates> = HashSet::new();
        let mut islets: Vec<Vec<Coordinates>> = Vec::new();

        for &cell in &player_cells {
            if visited.contains(&cell) {
                continue;
            }
            let mut islet = Vec::new();
            let mut queue = VecDeque::new();
            queue.push_back(cell);
            visited.insert(cell);

            while let Some(current) = queue.pop_front() {
                islet.push(current);
                for neighbor in board.get_neighbors(&current) {
                    if player_cells.contains(&neighbor) && !visited.contains(&neighbor) {
                        visited.insert(neighbor);
                        queue.push_back(neighbor);
                    }
                }
            }
            islets.push(islet);
        }

        islets
    }

    /*
        Returns a HashSet of all coordinates that are either empty or belong to `player`.
        This is used to determine which cells are "visitable" for pathfinding.
     */
    fn visitable_cells(&self, board: &GameY, player: PlayerId) -> HashSet<Coordinates> {
        (0..board.total_cells())
            .map(|idx| Coordinates::from_index(idx, board.board_size()))
            .filter(|coord| {
                let owner = board.get_cell_owner(coord);
                owner.is_none() || owner == Some(player)
            })
            .collect()
    }

    /*
        This method is used for calculating the minimum distance from an islet to a side of the board.
        It uses a multi-source BFS starting from all cells in the islet simultaneously. The distance is 
        defined as the number of empty cells that need to be added to connect the islet to the side. Cells 
        already in the islet have a cost of 0, while empty cells have a cost of 1. We use a 0-1 BFS (deque) 
        where moving to an islet cell costs 0 and moving to an empty cell costs 1.
     */
    fn min_distance_to_side(&self, board: &GameY, islet: &[Coordinates], side: u8, visitable: &HashSet<Coordinates>,
    ) -> u32 {
        // BFS: start from all cells in the islet simultaneously (multi-source)
        // Distance = number of empty cells we need to add to reach the side.
        // Cells already in the islet have cost 0, empty cells cost 1.
        //
        // We use a 0-1 BFS (deque) where moving to an islet cell costs 0
        // and moving to an empty cell costs 1.

        let islet_set: HashSet<Coordinates> = islet.iter().copied().collect();

        let mut dist: HashMap<Coordinates, u32> = HashMap::new();
        let mut deque: VecDeque<Coordinates> = VecDeque::new();
        let mut visited: HashSet<Coordinates> = HashSet::new();

        for &cell in islet {
            dist.insert(cell, 0);
            deque.push_front(cell);
        }

        while let Some(current) = deque.pop_front() {
            // Skip stale entries — node already settled with a shorter distance
            if visited.contains(&current) {
                continue;
            }
            visited.insert(current);

            let current_dist = dist[&current];

            let on_side = match side {
                0 => current.touches_side_a(),
                1 => current.touches_side_b(),
                _ => current.touches_side_c(),
            };
            if on_side {
                return current_dist;
            }

            for neighbor in board.get_neighbors(&current) {
                if !visitable.contains(&neighbor) || visited.contains(&neighbor) {
                    continue;
                }

                let step_cost = if islet_set.contains(&neighbor) { 0 } else { 1 };
                let new_dist = current_dist + step_cost;

                if new_dist < *dist.get(&neighbor).unwrap_or(&(MAX_NUMBER as u32)) {
                    dist.insert(neighbor, new_dist);
                    if step_cost == 0 {
                        deque.push_front(neighbor);
                    } else {
                        deque.push_back(neighbor);
                    }
                }
            }
        }

        MAX_NUMBER as u32
    }

    /*
        Method used for obtaining the candidate cells for the minimax algorithm. Instead of considering all available cells,
        we focus on those that are adjacent to occupied cells, as they are more likely to influence the game state and lead 
        to a win or loss. This heuristic reduces the branching factor of the search tree, allowing for deeper exploration
        within the same time constraints.

        PROBLEMS: It just considers cells adjacent to any occupied cell, so it might forget about cells that are strategically important
        but most moves will be correct since we have other heuristics to check if there are better moves.
     */
    fn relevant_cells(&self, board: &GameY) -> Vec<u32> {
        // First we obtain all the occupied cells on the board, filtering to just the coordinates.
        let occupied: HashSet<Coordinates> = (0..board.total_cells())
            .map(|idx| Coordinates::from_index(idx, board.board_size()))
            .filter(|c| board.get_cell_owner(c).is_some())
            .collect();

        // If it is empty, we return all the available cells, since there are no occupied cells to be adjacent to.
        if occupied.is_empty() {
            return board.available_cells().clone();
        }

        //From all the available cells, we filter to just obtain the ones that are near a occupied cell, since they are 
        //more likely to influence the game state and lead to a win or loss.
        board
            .available_cells()
            .iter()
            .copied()
            .filter(|&idx| {
                let coord = Coordinates::from_index(idx, board.board_size());
                board.get_neighbors(&coord).iter().any(|n| occupied.contains(n))
            })
            .collect()
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