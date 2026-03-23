use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot};
use std::collections::{HashMap, HashSet, VecDeque};

pub const MAX_NUMBER: i32 = i32::MAX / 2;
pub const MIN_NUMBER: i32 = i32::MIN / 2;

pub struct MediumBot;

impl MediumBot {
    /*
        Standard minimax algorithm with alpha-beta pruning.
        Recursively explores the game tree up to `depth` levels.
        The maximizing player is the bot (PlayerId 1), the minimizing player is the human (PlayerId 0).
        Alpha-beta pruning cuts off branches that cannot affect the final decision,
        significantly reducing the number of nodes evaluated.
    */
    fn minimax(
        &self,
        board: &GameY,
        depth: usize,
        mut alpha: i32,
        mut beta: i32,
        maximizing_player: bool,
    ) -> i32 {
        if depth == 0 || board.check_game_over() {
            return self.evaluate_board(board);
        }

        let candidates = self.relevant_cells(board);

        if maximizing_player {
            let mut max_eval = MIN_NUMBER;
            for cell_index in candidates {
                let mut temp_board = board.clone();
                let coord = Coordinates::from_index(cell_index, board.board_size());
                temp_board
                    .add_move(Movement::Placement {
                        player: PlayerId::new(1),
                        coords: coord,
                    })
                    .unwrap();
                let eval = self.minimax(&temp_board, depth - 1, alpha, beta, false);
                max_eval = max_eval.max(eval);
                alpha = alpha.max(eval);
                if beta <= alpha {
                    break;
                }
            }
            max_eval
        } else {
            let mut min_eval = MAX_NUMBER;
            for cell_index in candidates {
                let mut temp_board = board.clone();
                let coord = Coordinates::from_index(cell_index, board.board_size());
                temp_board
                    .add_move(Movement::Placement {
                        player: PlayerId::new(0),
                        coords: coord,
                    })
                    .unwrap();
                let eval = self.minimax(&temp_board, depth - 1, alpha, beta, true);
                min_eval = min_eval.min(eval);
                beta = beta.min(eval);
                if beta <= alpha {
                    break;
                }
            }
            min_eval
        }
    }

    /*
        Selects the best move for the bot by running minimax on each candidate cell
        and returning the coordinate with the highest resulting score.
        If any candidate immediately wins the game, it is returned early without
        further search.
    */
    fn chose_best_move(&self, board: &GameY) -> Option<Coordinates> {
        let mut best_score = MIN_NUMBER;
        let mut best_move = None;
        let mut alpha = MIN_NUMBER;
        let beta = MAX_NUMBER;

        for cell_index in self.relevant_cells(board) {
            let mut temp_board = board.clone();
            let coord = Coordinates::from_index(cell_index, board.board_size());
            temp_board
                .add_move(Movement::Placement {
                    player: PlayerId::new(1),
                    coords: coord,
                })
                .unwrap();

            // Immediately return a winning move without further search.
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
        Evaluates the board from the bot's perspective and returns a signed score.
        A positive score favours the bot; a negative score favours the human.

        Terminal states return ±100 000 so the minimax always prefers winning
        over any non-terminal advantage.

        For non-terminal states the score is:
            score_human * urgency − score_bot
        where `score_*` is the minimum number of empty cells each player still
        needs to place to connect all three sides (lower = closer to winning),
        and `urgency` amplifies the human's score when they are very close to
        winning, forcing the bot to prioritise blocking.
    */
    fn evaluate_board(&self, board: &GameY) -> i32 {
        if let Some(winner) = self.get_winner(board) {
            return if winner.id() == 1 { 100_000 } else { -100_000 };
        }

        let score_bot   = self.player_score(board, PlayerId::new(1)) as i32;
        let score_human = self.player_score(board, PlayerId::new(0)) as i32;

        // Urgency multiplier: if the human needs ≤2 more placements to win,
        // triple the weight of their score so blocking becomes the top priority.
        let urgency = if score_human <= 2 { 3 } else { 1 };

        score_human * urgency - score_bot
    }

    /*
        Returns the winner of a finished game, or None if the game is still in progress.
    */
    fn get_winner(&self, board: &GameY) -> Option<PlayerId> {
        match board.status() {
            GameStatus::Finished { winner } => Some(*winner),
            _ => None,
        }
    }

    /*
        Computes the heuristic cost for `player` to win from the current board state.
        The cost is the minimum number of additional empty cells the player would need
        to fill in order to connect all three sides of the board.

        Strategy — "virtual hub" approach:
          1. Run a 0-1 BFS outward from each side of the board (cost 0 for cells
             already owned by the player, cost 1 for empty cells).
          2. For every visitable cell, sum the three distances (one per side).
             Subtract 2× the hub cost to correct for the fact that an empty hub
             cell is counted once by each of the three BFS passes but physically
             requires only one placement.
          3. The minimum of that sum over all visitable cells is the player's score.

        This naturally rewards positions where a single cell can act as the
        meeting point of paths to all three sides, and correctly handles multiple
        disconnected groups by treating all owned cells as free waypoints.
    */
    fn player_score(&self, board: &GameY, player: PlayerId) -> u32 {
        let visitable = self.visitable_cells(board, player);

        // Collect all cells owned by this player in one pass.
        let player_cells: Vec<Coordinates> = visitable
            .iter()
            .copied()
            .filter(|c| board.get_cell_owner(c) == Some(player))
            .collect();

        if player_cells.is_empty() {
            return MAX_NUMBER as u32;
        }

        // Build a set for O(1) ownership checks shared by all three BFS runs.
        let player_set: HashSet<Coordinates> = player_cells.iter().copied().collect();

        // Run the three BFS passes once each and reuse the results below.
        let dist_a = self.distances_from_side(board, 0, &player_set, &visitable);
        let dist_b = self.distances_from_side(board, 1, &player_set, &visitable);
        let dist_c = self.distances_from_side(board, 2, &player_set, &visitable);

        visitable
            .iter()
            .map(|cell| {
                let da = dist_a.get(cell).copied().unwrap_or(MAX_NUMBER as u32);
                let db = dist_b.get(cell).copied().unwrap_or(MAX_NUMBER as u32);
                let dc = dist_c.get(cell).copied().unwrap_or(MAX_NUMBER as u32);

                // Each BFS counts an empty hub cell as cost 1.
                // Since three paths converge here, the hub is counted three times
                // but only one placement is needed — subtract the double-count.
                let hub_cost = if player_set.contains(cell) { 0u32 } else { 1u32 };

                da.saturating_add(db)
                    .saturating_add(dc)
                    .saturating_sub(2 * hub_cost)
            })
            .min()
            .unwrap_or(MAX_NUMBER as u32)
    }

    /*
        Runs a 0-1 BFS starting from every cell that touches `side`.
        Returns a map from each reachable visitable cell to the minimum number of
        empty cells that must be filled to connect that cell to `side`.

        Cost model:
          - Entering a cell already owned by the player costs 0.
          - Entering an empty cell costs 1.
          - Cells owned by the opponent are not in `visitable` and are never visited.

        Using a pre-built `player_set` (passed in) avoids rebuilding the HashSet
        on each of the three calls made per player per evaluation.
    */
    fn distances_from_side(
        &self,
        board: &GameY,
        side: u8,
        player_set: &HashSet<Coordinates>,
        visitable: &HashSet<Coordinates>,
    ) -> HashMap<Coordinates, u32> {
        let mut dist: HashMap<Coordinates, u32> = HashMap::new();
        let mut deque: VecDeque<Coordinates> = VecDeque::new();
        let mut visited: HashSet<Coordinates> = HashSet::new();

        // Seed the BFS with every visitable cell that already touches this side.
        // Cost is always 0 at the source — we measure the distance *away* from
        // the side, not the cost of reaching the side cell itself.
        for &cell in visitable {
            let on_side = match side {
                0 => cell.touches_side_a(),
                1 => cell.touches_side_b(),
                _ => cell.touches_side_c(),
            };
            if on_side {
                dist.insert(cell, 0);
                deque.push_front(cell);
            }
        }

        while let Some(current) = deque.pop_front() {
            if !visited.insert(current) {
                continue; // already settled
            }

            let current_dist = dist[&current];

            for neighbor in board.get_neighbors(&current) {
                if !visitable.contains(&neighbor) || visited.contains(&neighbor) {
                    continue;
                }

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
        Returns the set of all cells that `player` can traverse:
        cells that are either empty or already owned by `player`.
        Opponent-owned cells are excluded since they block the player's paths.
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
        Returns the candidate cells passed to minimax at each node.
        Instead of considering every empty cell, only cells near existing pieces
        are included, which keeps the branching factor manageable.

        Two tiers of candidates are collected:
          - Distance 1: any empty cell adjacent to an occupied cell (either player).
          - Distance 2: any empty cell whose neighbour is adjacent to a bot-owned
            cell. This second tier ensures the bot can "jump" one step ahead along
            its own chain without the human needing to play nearby first.

        Only bot-owned cells seed the distance-2 expansion to avoid a combinatorial
        explosion when the human has many pieces spread across the board.
    */
    fn relevant_cells(&self, board: &GameY) -> Vec<u32> {
        let occupied: HashSet<Coordinates> = (0..board.total_cells())
            .map(|idx| Coordinates::from_index(idx, board.board_size()))
            .filter(|c| board.get_cell_owner(c).is_some())
            .collect();

        if occupied.is_empty() {
            return board.available_cells().clone();
        }

        // Pre-compute the set of cells adjacent to bot-owned pieces for the
        // distance-2 expansion. Building this once avoids a nested O(n²) scan.
        let bot_frontier: HashSet<Coordinates> = occupied
            .iter()
            .filter(|c| board.get_cell_owner(c) == Some(PlayerId::new(1)))
            .flat_map(|c| board.get_neighbors(c))
            .filter(|n| !occupied.contains(n))
            .collect();

        let mut candidate_set: HashSet<u32> = HashSet::new();

        for &idx in board.available_cells() {
            let coord = Coordinates::from_index(idx, board.board_size());
            let neighbors = board.get_neighbors(&coord);

            // Tier 1: adjacent to any occupied cell.
            if neighbors.iter().any(|n| occupied.contains(n)) {
                candidate_set.insert(idx);
                continue;
            }

            // Tier 2: adjacent to the bot's frontier (distance 2 from a bot cell).
            if neighbors.iter().any(|n| bot_frontier.contains(n)) {
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
        self.chose_best_move(board)
    }
}