use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot};
use std::collections::{HashMap, HashSet, VecDeque};

pub const MAX_NUMBER: i32 = i32::MAX / 2;
pub const MIN_NUMBER: i32 = i32::MIN / 2;

pub struct MediumBot;

impl MediumBot {
    fn with_move(&self, board: &GameY, coord: Coordinates, player: PlayerId) -> GameY {
        let mut temp = board.clone();
        temp.add_move(Movement::Placement { player, coords: coord }).unwrap();
        temp
    }

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
                let coord = Coordinates::from_index(cell_index, board.board_size());
                let next = self.with_move(board, coord, PlayerId::new(1));
                let eval = self.minimax(&next, depth - 1, alpha, beta, false);
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
                let coord = Coordinates::from_index(cell_index, board.board_size());
                let next = self.with_move(board, coord, PlayerId::new(0));
                let eval = self.minimax(&next, depth - 1, alpha, beta, true);
                min_eval = min_eval.min(eval);
                beta = beta.min(eval);
                if beta <= alpha {
                    break;
                }
            }
            min_eval
        }
    }

    fn choose_best_move(&self, board: &GameY) -> Option<Coordinates> {
        let mut best_score = MIN_NUMBER;
        let mut best_move = None;
        let mut alpha = MIN_NUMBER;
        let beta = MAX_NUMBER;

        for cell_index in self.relevant_cells(board) {
            let coord = Coordinates::from_index(cell_index, board.board_size());
            let next = self.with_move(board, coord, PlayerId::new(1));

            if next.check_game_over() {
                return Some(coord);
            }

            let score = self.minimax(&next, 4, alpha, beta, false);
            alpha = alpha.max(score);
            if score > best_score {
                best_score = score;
                best_move = Some(coord);
            }
        }

        best_move
    }

    fn evaluate_board(&self, board: &GameY) -> i32 {
        if let Some(winner) = self.get_winner(board) {
            return if winner.id() == 1 { 100_000 } else { -100_000 };
        }

        let score_bot   = self.player_score(board, PlayerId::new(1)) as i32;
        let score_human = self.player_score(board, PlayerId::new(0)) as i32;
        let urgency     = if score_human <= 2 { 3 } else { 1 };

        score_human * urgency - score_bot
    }

    fn get_winner(&self, board: &GameY) -> Option<PlayerId> {
        match board.status() {
            GameStatus::Finished { winner } => Some(*winner),
            _ => None,
        }
    }

    fn player_score(&self, board: &GameY, player: PlayerId) -> u32 {
        let visitable = self.visitable_cells(board, player);

        let player_set: HashSet<Coordinates> = visitable
            .iter()
            .copied()
            .filter(|c| board.get_cell_owner(c) == Some(player))
            .collect();

        if player_set.is_empty() {
            return MAX_NUMBER as u32;
        }

        let dist_a = self.distances_from_side(board, 0, &player_set, &visitable);
        let dist_b = self.distances_from_side(board, 1, &player_set, &visitable);
        let dist_c = self.distances_from_side(board, 2, &player_set, &visitable);

        let inf = MAX_NUMBER as u32;

        visitable
            .iter()
            .map(|cell| {
                let da = dist_a.get(cell).copied().unwrap_or(inf);
                let db = dist_b.get(cell).copied().unwrap_or(inf);
                let dc = dist_c.get(cell).copied().unwrap_or(inf);
                let hub_cost = if player_set.contains(cell) { 0u32 } else { 1u32 };

                da.saturating_add(db)
                    .saturating_add(dc)
                    .saturating_sub(2 * hub_cost)
            })
            .min()
            .unwrap_or(inf)
    }

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

        let touches_side: fn(&Coordinates) -> bool = match side {
            0 => Coordinates::touches_side_a,
            1 => Coordinates::touches_side_b,
            _ => Coordinates::touches_side_c,
        };

        for &cell in visitable {
            if touches_side(&cell) {
                dist.insert(cell, 0);
                deque.push_front(cell);
            }
        }

        while let Some(current) = deque.pop_front() {
            if !visited.insert(current) {
                continue;
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

    fn visitable_cells(&self, board: &GameY, player: PlayerId) -> HashSet<Coordinates> {
        (0..board.total_cells())
            .map(|idx| Coordinates::from_index(idx, board.board_size()))
            .filter(|coord| {
                let owner = board.get_cell_owner(coord);
                owner.is_none() || owner == Some(player)
            })
            .collect()
    }

    fn relevant_cells(&self, board: &GameY) -> Vec<u32> {
        let occupied: HashSet<Coordinates> = (0..board.total_cells())
            .map(|idx| Coordinates::from_index(idx, board.board_size()))
            .filter(|c| board.get_cell_owner(c).is_some())
            .collect();

        if occupied.is_empty() {
            return board.available_cells().clone();
        }

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

            if neighbors.iter().any(|n| occupied.contains(n)) {
                candidate_set.insert(idx);
                continue;
            }

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
        self.choose_best_move(board)
    }
}

#[cfg(test)]
mod medium_bot_tests {
    use crate::{Coordinates, GameY, Movement, PlayerId};
    use crate::bot::medium::MediumBot;
    use crate::YBot;

    fn bot() -> MediumBot {
        MediumBot
    }

    fn apply_moves(board: &mut GameY, coords: &[(u32, u32, u32)], first_player: u32) {
        for (i, &(x, y, z)) in coords.iter().enumerate() {
            let player = PlayerId::new((first_player + i as u32) % 2);
            board
                .add_move(Movement::Placement {
                    player,
                    coords: Coordinates::new(x, y, z),
                })
                .unwrap();
        }
    }

    #[test]
    fn empty_board_returns_some() {
        let board = GameY::new(5);
        assert!(bot().choose_move(&board).is_some());
    }

    #[test]
    fn empty_board_move_is_available() {
        let board = GameY::new(5);
        let mv = bot().choose_move(&board).unwrap();
        let idx = mv.to_index(board.board_size());
        assert!(board.available_cells().contains(&idx));
    }

    #[test]
    fn single_cell_left_must_be_chosen() {
        let mut board = GameY::new(2);
        board
            .add_move(Movement::Placement {
                player: PlayerId::new(0),
                coords: Coordinates::new(0, 1, 0),
            })
            .unwrap();
        board
            .add_move(Movement::Placement {
                player: PlayerId::new(1),
                coords: Coordinates::new(0, 0, 1),
            })
            .unwrap();

        let mv = bot().choose_move(&board);
        if let Some(coord) = mv {
            assert_eq!(coord, Coordinates::new(1, 0, 0));
        }
    }

    #[test]
    fn bot_blocks_human_imminent_win() {
        let mut board = GameY::new(5);

        for &(x, y, z) in &[(0u32, 2u32, 2u32), (0, 1, 3), (2, 0, 2)] {
            board
                .add_move(Movement::Placement {
                    player: PlayerId::new(0),
                    coords: Coordinates::new(x, y, z),
                })
                .unwrap();
            if !board.check_game_over() {
                board
                    .add_move(Movement::Placement {
                        player: PlayerId::new(1),
                        coords: Coordinates::new(4, 0, 0),
                    })
                    .unwrap_or(());
            }
        }

        let mv = bot().choose_move(&board);
        assert!(mv.is_some(), "El bot debe devolver un movimiento");

        if let Some(coord) = mv {
            let mut after_bot = board.clone();
            after_bot
                .add_move(Movement::Placement {
                    player: PlayerId::new(1),
                    coords: coord,
                })
                .unwrap();

            let remaining = after_bot.available_cells().clone();
            let human_wins_next = remaining.iter().any(|&idx| {
                let c = Coordinates::from_index(idx, after_bot.board_size());
                let mut sim = after_bot.clone();
                sim.add_move(Movement::Placement {
                    player: PlayerId::new(0),
                    coords: c,
                })
                .unwrap();
                sim.check_game_over()
            });

            assert!(
                !human_wins_next,
                "El bot no bloqueó la victoria inminente del humano"
            );
        }
    }

    #[test]
    fn bot_takes_winning_move() {
        use crate::GameStatus;

        let mut board = GameY::new(3);
        for &(x, y, z) in &[(0u32, 0u32, 2u32), (0, 2, 0), (1, 1, 0)] {
            board
                .add_move(Movement::Placement {
                    player: PlayerId::new(1),
                    coords: Coordinates::new(x, y, z),
                })
                .unwrap();
        }

        assert!(
            !board.check_game_over(),
            "El tablero no debería estar terminado antes del movimiento ganador"
        );

        let winning_cells: Vec<Coordinates> = board
            .available_cells()
            .iter()
            .map(|&idx| Coordinates::from_index(idx, board.board_size()))
            .filter(|&c| {
                let mut sim = board.clone();
                sim.add_move(Movement::Placement {
                    player: PlayerId::new(1),
                    coords: c,
                })
                .unwrap();
                sim.check_game_over()
            })
            .collect();

        assert!(
            !winning_cells.is_empty(),
            "La posición de test no tiene movimiento ganador para el bot"
        );

        let mv = bot().choose_move(&board).unwrap();
        let mut after = board.clone();
        after
            .add_move(Movement::Placement {
                player: PlayerId::new(1),
                coords: mv,
            })
            .unwrap();

        assert!(
            after.check_game_over(),
            "El bot tenía jugadas ganadoras {:?} pero eligió {:?}",
            winning_cells,
            mv
        );
        if let GameStatus::Finished { winner } = after.status() {
            assert_eq!(winner.id(), 1, "El ganador debe ser el bot (player 1)");
        }
    }

    #[test]
    fn returned_move_is_always_legal() {
        let mut board = GameY::new(4);

        let coords_seq: &[(u32, u32, u32)] =
            &[(0, 3, 0), (3, 0, 0), (0, 0, 3), (1, 2, 0), (0, 1, 2), (2, 1, 0)];

        for (i, &(x, y, z)) in coords_seq.iter().enumerate() {
            if board.check_game_over() {
                break;
            }
            let player = PlayerId::new(i as u32 % 2);
            board
                .add_move(Movement::Placement {
                    player,
                    coords: Coordinates::new(x, y, z),
                })
                .unwrap();

            if i % 2 == 0 && !board.check_game_over() {
                let mv = bot().choose_move(&board).unwrap();
                let idx = mv.to_index(board.board_size());

                assert!(
                    board.available_cells().contains(&idx),
                    "El bot propuso una celda no disponible: {:?}",
                    mv
                );

                let mut tmp = board.clone();
                tmp.add_move(Movement::Placement {
                    player: PlayerId::new(1),
                    coords: mv,
                })
                .expect("El movimiento del bot falló al aplicarse");
            }
        }
    }

    #[test]
    fn nonempty_board_near_full_returns_some() {
        let mut board = GameY::new(3);
        let moves: &[(u32, u32, u32, u32)] = &[
            (0, 0, 2, 0),
            (0, 2, 0, 1),
            (2, 0, 0, 0),
            (0, 1, 1, 1),
        ];
        for &(x, y, z, p) in moves {
            if board.check_game_over() {
                return;
            }
            board
                .add_move(Movement::Placement {
                    player: PlayerId::new(p),
                    coords: Coordinates::new(x, y, z),
                })
                .unwrap();
        }

        if !board.check_game_over() {
            assert!(
                bot().choose_move(&board).is_some(),
                "El bot devolvió None con celdas disponibles"
            );
        }
    }

    #[test]
    fn deterministic_same_position() {
        let mut board = GameY::new(4);
        apply_moves(&mut board, &[(0, 3, 0), (3, 0, 0), (0, 2, 1), (1, 2, 0)], 0);

        if board.check_game_over() {
            return;
        }

        let mv1 = bot().choose_move(&board);
        let mv2 = bot().choose_move(&board);
        assert_eq!(mv1, mv2, "choose_move no es determinista para el mismo estado");
    }

    #[test]
    fn board_with_only_bot_pieces() {
        let mut board = GameY::new(5);
        board
            .add_move(Movement::Placement {
                player: PlayerId::new(0),
                coords: Coordinates::new(0, 0, 4),
            })
            .unwrap();
        board
            .add_move(Movement::Placement {
                player: PlayerId::new(1),
                coords: Coordinates::new(2, 1, 1),
            })
            .unwrap();

        assert!(bot().choose_move(&board).is_some());
    }
}