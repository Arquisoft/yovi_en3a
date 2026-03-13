use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot};
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
            return if winner.id() == 1 { 100_000 } else { -100_000 };
        }

        let score_bot   = self.player_score(board, PlayerId::new(1)) as i32;
        let score_human = self.player_score(board, PlayerId::new(0)) as i32;

        // Si el humano está muy cerca de ganar, priorizar el bloqueo
        let urgency = if score_human <= 2 { 3 } else { 1 };
        
        score_human * urgency - score_bot
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

        let all_cells: Vec<Coordinates> = islets.iter().flatten().copied().collect();
        let player_set: HashSet<Coordinates> = all_cells.iter().copied().collect();

        let dist_a = self.distances_from_side(board, 0, &all_cells, &visitable);
        let dist_b = self.distances_from_side(board, 1, &all_cells, &visitable);
        let dist_c = self.distances_from_side(board, 2, &all_cells, &visitable);

        visitable.iter()
            .map(|cell| {
                let da = dist_a.get(cell).copied().unwrap_or(MAX_NUMBER as u32);
                let db = dist_b.get(cell).copied().unwrap_or(MAX_NUMBER as u32);
                let dc = dist_c.get(cell).copied().unwrap_or(MAX_NUMBER as u32);

                // Los 3 BFS cuentan el hub como parte de su camino.
                // Si el hub está vacío, los 3 lo contaron como coste 1 cada uno → triple conteo.
                // El hub real vale 1 ficha, así que restamos 2 para no contar triple.
                // Si ya tiene ficha del jugador, los 3 lo contaron como 0 → sin problema.
                let hub_cost = if player_set.contains(cell) { 0u32 } else { 1u32 };

                da.saturating_add(db)
                .saturating_add(dc)
                .saturating_sub(2 * hub_cost)
            })
            .min()
            .unwrap_or(MAX_NUMBER as u32)
    }

    // BFS desde las celdas del lado `side` hacia todo el tablero,
    // usando `player_cells` como coste 0 y celdas vacías como coste 1.
    fn distances_from_side(
        &self,
        board: &GameY,
        side: u8,
        player_cells: &[Coordinates],
        visitable: &HashSet<Coordinates>,
    ) -> HashMap<Coordinates, u32> {
        let player_set: HashSet<Coordinates> = player_cells.iter().copied().collect();
        let mut dist: HashMap<Coordinates, u32> = HashMap::new();
        let mut deque: VecDeque<Coordinates> = VecDeque::new();
        let mut visited: HashSet<Coordinates> = HashSet::new();

        for &cell in visitable {
            let on_side = match side {
                0 => cell.touches_side_a(),
                1 => cell.touches_side_b(),
                _ => cell.touches_side_c(),
            };
            if on_side {
                // Coste 0 siempre: el lado es el punto de partida del BFS,
                // no cuesta nada "estar" en él
                dist.insert(cell, 0);
                deque.push_front(cell);
            }
        }

        while let Some(current) = deque.pop_front() {
            if visited.contains(&current) { continue; }
            visited.insert(current);

            let current_dist = dist[&current];

            for neighbor in board.get_neighbors(&current) {
                if !visitable.contains(&neighbor) || visited.contains(&neighbor) { continue; }

                // El coste de ENTRAR a un vecino:
                // - ficha del jugador ya puesta → 0 (ya es parte del camino)
                // - celda vacía → 1 (hay que colocar una ficha)
                let step_cost = if player_set.contains(&neighbor) { 0 } else { 1 };
                let new_dist = current_dist + step_cost;

                if new_dist < *dist.get(&neighbor).unwrap_or(&u32::MAX) {
                    dist.insert(neighbor, new_dist);
                    if step_cost == 0 {
                        deque.push_front(neighbor);
                    } else {
                        deque.push_back(neighbor);
                    }
                }
            }
        }

        dist
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
        Method used for obtaining the candidate cells for the minimax algorithm. Instead of considering all available cells,
        we focus on those that are adjacent to occupied cells, as they are more likely to influence the game state and lead 
        to a win or loss. This heuristic reduces the branching factor of the search tree, allowing for deeper exploration
        within the same time constraints.

        PROBLEMS: It just considers cells adjacent to any occupied cell, so it might forget about cells that are strategically important
        but most moves will be correct since we have other heuristics to check if there are better moves.
     */
    fn relevant_cells(&self, board: &GameY) -> Vec<u32> {
        let occupied: HashSet<Coordinates> = (0..board.total_cells())
            .map(|idx| Coordinates::from_index(idx, board.board_size()))
            .filter(|c| board.get_cell_owner(c).is_some())
            .collect();

        if occupied.is_empty() {
            return board.available_cells().clone();
        }

        // Vecinos a distancia 1 de cualquier ficha ocupada
        let mut candidate_set: HashSet<u32> = HashSet::new();
        
        for &idx in board.available_cells() {
            let coord = Coordinates::from_index(idx, board.board_size());
            let neighbors = board.get_neighbors(&coord);
            
            // Distancia 1: adyacente a una ficha ocupada
            if neighbors.iter().any(|n| occupied.contains(n)) {
                candidate_set.insert(idx);
                continue;
            }
            
            // Distancia 2: vecino de un vecino de una ficha ocupada
            // Solo para celdas adyacentes a fichas del bot (PlayerId 1),
            // para no explotar el branching factor
            let near_bot_neighbor = neighbors.iter().any(|n| {
                board.get_neighbors(n).iter().any(|nn| {
                    occupied.contains(nn) && board.get_cell_owner(nn) == Some(PlayerId::new(1))
                })
            });
            if near_bot_neighbor {
                candidate_set.insert(idx);
            }
        }

        candidate_set.into_iter().collect()
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