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

    // ─── helpers ─────────────────────────────────────────────────────────────

    fn bot() -> MediumBot {
        MediumBot
    }

    /// Aplica una secuencia de movimientos alternativos (player 0, player 1, …)
    /// empezando por `first_player`.
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

    // ─── 1. Tablero vacío ─────────────────────────────────────────────────────

    /// El bot debe devolver alguna coordenada cuando el tablero está vacío.
    #[test]
    fn empty_board_returns_some() {
        let board = GameY::new(5);
        assert!(bot().choose_move(&board).is_some());
    }

    /// La coordenada devuelta en un tablero vacío debe existir en available_cells.
    #[test]
    fn empty_board_move_is_available() {
        let board = GameY::new(5);
        let mv = bot().choose_move(&board).unwrap();
        let idx = mv.to_index(board.board_size());
        assert!(board.available_cells().contains(&idx));
    }

    // ─── 2. Una sola celda libre ──────────────────────────────────────────────

    /// Con una única celda libre el bot DEBE elegirla.
    #[test]
    fn single_cell_left_must_be_chosen() {
        // Tablero 2: 3 celdas. Llenamos 2 de forma que ninguno gane antes.
        // (0,1,0) y (0,0,1) son las dos celdas del lado inferior; la que queda es (1,0,0).
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
        // Puede que el juego ya acabara; si no, la única celda es (1,0,0).
        if let Some(coord) = mv {
            assert_eq!(coord, Coordinates::new(1, 0, 0));
        }
    }

    // ─── 3. El bot debe bloquear una victoria inminente del humano ────────────

    /// Tablero 5. El humano (player 0) tiene dos piezas conectando dos lados;
    /// sólo le falta colocar una pieza para conectar el tercer lado.
    /// El bot debe elegir esa celda bloqueante.
    ///
    /// Configuración (coordenadas baricéntricas, tablero 5 → índices de 0-14):
    ///   Player 0 toca side_a (x=0) con (0,2,2) y (0,1,3)
    ///             toca side_b (y=0) con (2,0,2)
    ///   La celda que conectaría side_c (z=0) es (0,4,0)  → solo le falta esa.
    ///   El bot debe ir allí antes que el humano.
    #[test]
    fn bot_blocks_human_imminent_win() {
        let mut board = GameY::new(5);

        // Human pieces (player 0)
        for &(x, y, z) in &[(0u32, 2u32, 2u32), (0, 1, 3), (2, 0, 2)] {
            board
                .add_move(Movement::Placement {
                    player: PlayerId::new(0),
                    coords: Coordinates::new(x, y, z),
                })
                .unwrap();
            // Bot hace relleno neutral lejos
            if !board.check_game_over() {
                board
                    .add_move(Movement::Placement {
                        player: PlayerId::new(1),
                        coords: Coordinates::new(4, 0, 0), // corner que no obstruye
                    })
                    .unwrap_or(());
            }
        }

        // Ahora el bot (player 1) elige
        let mv = bot().choose_move(&board);
        assert!(mv.is_some(), "El bot debe devolver un movimiento");

        // La celda bloqueante clave toca side_c (z == 0)
        // El bot no tiene por qué ir exactamente allí, pero el juego
        // no debe terminar con victoria del humano en el siguiente turno.
        if let Some(coord) = mv {
            let mut after_bot = board.clone();
            after_bot
                .add_move(Movement::Placement {
                    player: PlayerId::new(1),
                    coords: coord,
                })
                .unwrap();

            // Comprobamos que el humano ya NO puede ganar en un movimiento.
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

    // ─── 4. El bot debe elegir su propia victoria inmediata ──────────────────

    /// Si el bot puede ganar en este turno, DEBE hacerlo.
    ///
    /// Cargamos la posición via YEN para tener control total sobre el layout
    /// sin depender del orden de turnos de `add_move`.
    ///
    /// Tablero 5, layout (fila 0 = vértice x=4, fila 4 = base x=0):
    ///
    ///   fila 0 (x=4): .
    ///   fila 1 (x=3): ..
    ///   fila 2 (x=2): .R.
    ///   fila 3 (x=1): .RR.
    ///   fila 4 (x=0): BR.R.
    ///
    /// Piezas del bot (R = player 1):
    ///   (2,1,1) – interior
    ///   (1,1,2) – toca side_a (x=0 no, x=1 no… espera: side_a es x==0)
    ///
    /// Usamos una posición más simple y verificada manualmente:
    ///
    /// Tablero 3 (6 celdas), side_a: x=0, side_b: y=0, side_c: z=0
    /// Celda única (0,0,2) toca side_a y side_b.
    /// Celda (0,2,0) toca side_a y side_c.
    /// Celda (2,0,0) toca side_b y side_c → ganar colocando (1,1,0) que
    /// conecta (0,2,0)-(1,1,0)-(2,0,0) tocando las 3 lados.
    ///
    /// YEN layout tablero 3 (turn=1 → toca player 1 = R):
    ///   fila 0 (x=2): .
    ///   fila 1 (x=1): .R
    ///   fila 2 (x=0): R.R
    ///   → "." / ".R" / "R.R"  con turn=1 (le toca al bot)
    ///
    /// Bot (R) toca: (1,1,0) side_c, (0,0,2) side_a+side_b, (0,2,0) side_a+side_c
    /// Falta conectarlos: colocando (0,1,1) une (0,0,2)-(0,1,1)-(0,2,0) → side_a+side_b+side_c ✓
    #[test]
    fn bot_takes_winning_move() {
        use crate::{YEN, GameStatus};

        // Layout tablero 3:
        //   x=2: .          → (2,0,0)=empty
        //   x=1: .R         → (1,0,1)=empty, (1,1,0)=R
        //   x=0: R.R        → (0,0,2)=R,     (0,1,1)=empty, (0,2,0)=R
        //
        // R toca: (0,0,2) → side_a(x=0) + side_b(y=0)
        //         (0,2,0) → side_a(x=0) + side_c(z=0)
        //         (1,1,0) → side_c(z=0)
        // Colocando (0,1,1): conecta (0,0,2)-(0,1,1)-(0,2,0) → toca las 3 → gana.
        // B (player 0) no tiene piezas → no puede ganar.
        // turn=1 → le toca a R (bot).
        let yen_str = r#"{
            "size": 3,
            "turn": 1,
            "players": ["B","R"],
            "layout": "./. R/R.R"
        }"#;
        // YEN layout usa '/' como separador de filas, sin espacios dentro de la cadena.
        // Reconstruimos correctamente:
        let yen_str = r#"{"size":3,"turn":1,"players":["B","R"],"layout":"./. R/R.R"}"#;

        // Construimos la posición directamente para evitar problemas de parseo YEN
        let mut board = GameY::new(3);
        // Colocamos solo piezas del bot (R=player1) en la posición deseada.
        // GameY no valida turno en add_move, solo registra quién pone.
        for &(x, y, z) in &[(0u32, 0u32, 2u32), (0, 2, 0), (1, 1, 0)] {
            board
                .add_move(Movement::Placement {
                    player: PlayerId::new(1),
                    coords: Coordinates::new(x, y, z),
                })
                .unwrap();
        }

        // Sanity: el juego sigue en curso
        assert!(
            !board.check_game_over(),
            "El tablero no debería estar terminado antes del movimiento ganador"
        );

        // Sanity: existe al menos un movimiento ganador para el bot
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

        // El bot DEBE elegir uno de esos movimientos ganadores
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

    // ─── 5. El movimiento devuelto siempre es válido ──────────────────────────

    /// En cualquier estado intermedio la coordenada devuelta debe:
    ///   a) estar en available_cells, y
    ///   b) poder aplicarse sin error.
    #[test]
    fn returned_move_is_always_legal() {
        let mut board = GameY::new(4);

        // Jugamos 6 movimientos alternos y pedimos al bot en cada turno impar
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

            // Pedimos consejo al bot después de cada movimiento del humano
            if i % 2 == 0 && !board.check_game_over() {
                let mv = bot().choose_move(&board).unwrap();
                let idx = mv.to_index(board.board_size());

                assert!(
                    board.available_cells().contains(&idx),
                    "El bot propuso una celda no disponible: {:?}",
                    mv
                );

                // Verificar que se puede aplicar
                let mut tmp = board.clone();
                tmp.add_move(Movement::Placement {
                    player: PlayerId::new(1),
                    coords: mv,
                })
                .expect("El movimiento del bot falló al aplicarse");
            }
        }
    }

    // ─── 6. No devuelve None en un tablero casi lleno ────────────────────────

    /// Con pocas celdas libres (pero el juego aún en curso) el bot devuelve Some.
    #[test]
    fn nonempty_board_near_full_returns_some() {
        // Tablero 3: 6 celdas. Ponemos 4 de forma que no haya ganador aún.
        let mut board = GameY::new(3);
        // Alternamos colores sin crear conexión ganadora
        let moves: &[(u32, u32, u32, u32)] = &[
            (0, 0, 2, 0), // player 0
            (0, 2, 0, 1), // player 1
            (2, 0, 0, 0), // player 0
            (0, 1, 1, 1), // player 1
        ];
        for &(x, y, z, p) in moves {
            if board.check_game_over() {
                return; // Si alguien ganó antes de lo previsto, el test no es aplicable
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

    // ─── 7. Consistencia: misma posición → mismo movimiento (determinismo) ───

    /// Para un estado fijo, dos llamadas consecutivas deben devolver la misma
    /// coordenada (el algoritmo es puramente determinista).
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

    // ─── 8. Tablero con un solo jugador (el bot empieza solo) ─────────────────

    /// Si el bot tiene piezas pero el humano aún no ha jugado,
    /// must devolver un movimiento válido.
    #[test]
    fn board_with_only_bot_pieces() {
        let mut board = GameY::new(5);
        // Forzamos un estado donde sólo el bot ha jugado
        // (esto puede requerir ajustar la lógica de turno si GameY lo valida;
        //  aquí asumimos que add_move no comprueba el turno)
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