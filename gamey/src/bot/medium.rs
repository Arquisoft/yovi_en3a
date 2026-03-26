use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot};
use std::collections::VecDeque;

pub const MAX_NUMBER: i32 = i32::MAX / 2;
pub const MIN_NUMBER: i32 = i32::MIN / 2;

// ─── Transposition Table ────────────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq)]
enum TTFlag {
    Exact,
    LowerBound,
    UpperBound,
}

#[derive(Clone, Copy)]
struct TTEntry {
    hash:      u64,
    depth:     usize,
    score:     i32,
    flag:      TTFlag,
    best_move: Option<u32>,
}

// ─── Search context (reutilizado en todo el árbol, sin allocations extra) ───

struct SearchContext {
    deque:        VecDeque<u32>,
    visited:      Vec<bool>,
    player_cells: Vec<bool>,
    visitable:    Vec<bool>,
    dist_a:       Vec<u32>,
    dist_b:       Vec<u32>,
    dist_c:       Vec<u32>,
    tt:           Vec<Option<TTEntry>>,
    zobrist:      Vec<[u64; 2]>,
}

impl SearchContext {
    fn new(total_cells: usize) -> Self {
        // Splitmix64 para generar los valores Zobrist de forma determinista
        let mut state: u64 = 0x9e3779b97f4a7c15;
        let mut next = || -> u64 {
            state = state.wrapping_add(0x9e3779b97f4a7c15);
            let mut z = state;
            z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
            z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
            z ^ (z >> 31)
        };

        let mut zobrist = vec![[0u64; 2]; total_cells];
        for cell in zobrist.iter_mut() {
            cell[0] = next();
            cell[1] = next();
        }

        Self {
            deque:        VecDeque::with_capacity(total_cells),
            visited:      vec![false; total_cells],
            player_cells: vec![false; total_cells],
            visitable:    vec![false; total_cells],
            dist_a:       vec![u32::MAX; total_cells],
            dist_b:       vec![u32::MAX; total_cells],
            dist_c:       vec![u32::MAX; total_cells],
            // ~1M de entradas ≈ 40 MB; suficiente para no tener demasiadas colisiones
            tt:           vec![None; 1 << 20],
            zobrist,
        }
    }

    fn compute_initial_hash(&self, board: &GameY) -> u64 {
        let mut hash: u64 = 0;
        for idx in 0..(board.total_cells() as usize) {
            let coord = Coordinates::from_index(idx as u32, board.board_size());
            if let Some(owner) = board.get_cell_owner(&coord) {
                hash ^= self.zobrist[idx][owner.id() as usize];
            }
        }
        hash
    }

    #[inline(always)]
    fn update_hash(&self, hash: u64, cell_index: u32, player_id: u32) -> u64 {
        hash ^ self.zobrist[cell_index as usize][player_id as usize]
    }
}

// ─── Bot ─────────────────────────────────────────────────────────────────────

pub struct MediumBot;

impl MediumBot {
    // ── Núcleo minimax con poda alfa-beta y TT ───────────────────────────────

    fn minimax(
        &self,
        board:             &GameY,
        depth:             usize,
        mut alpha:         i32,
        mut beta:          i32,
        maximizing_player: bool,
        ctx:               &mut SearchContext,
        current_hash:      u64,
    ) -> i32 {
        let alpha_orig = alpha;
        let tt_index   = (current_hash & ((1 << 20) - 1)) as usize;

        // 1. Consultar la caché
        if let Some(entry) = ctx.tt[tt_index] {
            if entry.hash == current_hash && entry.depth >= depth {
                match entry.flag {
                    TTFlag::Exact      => return entry.score,
                    TTFlag::LowerBound => alpha = alpha.max(entry.score),
                    TTFlag::UpperBound => beta  = beta.min(entry.score),
                }
                if alpha >= beta {
                    return entry.score;
                }
            }
        }

        // 2. Casos base
        if board.check_game_over() {
            return self.evaluate_terminal(board);
        }
        if depth == 0 {
            return self.evaluate_board(board, ctx);
        }

        // 3. Candidatos + ordenación por TT
        let mut candidates = self.relevant_cells(board);
        if candidates.is_empty() {
            return self.evaluate_board(board, ctx);
        }
        self.order_moves(&mut candidates, tt_index, current_hash, ctx);

        let player_id  = if maximizing_player { 1u32 } else { 0u32 };
        let mut best_score = if maximizing_player { MIN_NUMBER } else { MAX_NUMBER };
        let mut best_move  = None;

        for cell_index in &candidates {
            let cell_index = *cell_index;
            let coord      = Coordinates::from_index(cell_index, board.board_size());
            let mut tmp    = board.clone();
            tmp.add_move(Movement::Placement {
                player: PlayerId::new(player_id),
                coords: coord,
            }).unwrap();

            let next_hash = ctx.update_hash(current_hash, cell_index, player_id);
            let score     = self.minimax(&tmp, depth - 1, alpha, beta, !maximizing_player, ctx, next_hash);

            if maximizing_player {
                if score > best_score {
                    best_score = score;
                    best_move  = Some(cell_index);
                }
                alpha = alpha.max(best_score);
            } else {
                if score < best_score {
                    best_score = score;
                    best_move  = Some(cell_index);
                }
                beta = beta.min(best_score);
            }

            if beta <= alpha {
                break; // Poda alfa-beta
            }
        }

        // 4. Guardar en la caché
        let flag = if best_score <= alpha_orig {
            TTFlag::UpperBound
        } else if best_score >= beta {
            TTFlag::LowerBound
        } else {
            TTFlag::Exact
        };

        ctx.tt[tt_index] = Some(TTEntry {
            hash: current_hash,
            depth,
            score: best_score,
            flag,
            best_move,
        });

        best_score
    }

    // Mueve al principio el mejor movimiento conocido de la TT (mejora la poda)
    fn order_moves(&self, candidates: &mut Vec<u32>, tt_index: usize, hash: u64, ctx: &SearchContext) {
        if let Some(entry) = ctx.tt[tt_index] {
            if entry.hash == hash {
                if let Some(best) = entry.best_move {
                    if let Some(pos) = candidates.iter().position(|&m| m == best) {
                        candidates.swap(0, pos);
                    }
                }
            }
        }
    }

    // ── Búsqueda raíz con Iterative Deepening ───────────────────────────────

    fn chose_best_move(&self, board: &GameY) -> Option<Coordinates> {
        let total        = board.total_cells() as usize;
        let mut ctx      = SearchContext::new(total);
        let root_hash    = ctx.compute_initial_hash(board);
        let target_depth = 6;

        let mut absolute_best = None;

        for current_depth in 1..=target_depth {
            let mut alpha      = MIN_NUMBER;
            let beta           = MAX_NUMBER;
            let mut best_score = MIN_NUMBER;
            let mut best_move  = None;

            let mut candidates = self.relevant_cells(board);
            if candidates.is_empty() {
                break;
            }

            let tt_index = (root_hash & ((1 << 20) - 1)) as usize;
            self.order_moves(&mut candidates, tt_index, root_hash, &ctx);

            for &cell_index in &candidates {
                let coord = Coordinates::from_index(cell_index, board.board_size());
                let mut tmp = board.clone();
                tmp.add_move(Movement::Placement {
                    player: PlayerId::new(1),
                    coords: coord,
                }).unwrap();

                // Victoria inmediata → no hace falta seguir buscando
                if tmp.check_game_over() {
                    return Some(coord);
                }

                let next_hash = ctx.update_hash(root_hash, cell_index, 1);
                let score     = self.minimax(&tmp, current_depth - 1, alpha, beta, false, &mut ctx, next_hash);

                if score > best_score {
                    best_score = score;
                    best_move  = Some(coord);
                    alpha      = alpha.max(best_score);
                }
            }

            // Guardar la raíz en la TT para informar a la siguiente iteración
            ctx.tt[tt_index] = Some(TTEntry {
                hash:      root_hash,
                depth:     current_depth,
                score:     best_score,
                flag:      TTFlag::Exact,
                best_move: best_move.map(|c| c.to_index(board.board_size())),
            });

            if let Some(m) = best_move {
                absolute_best = Some(m);
            }
        }

        absolute_best
    }

    // ── Evaluación ──────────────────────────────────────────────────────────

    /// Evaluación de nodos terminales (victoria/derrota confirmada)
    fn evaluate_terminal(&self, board: &GameY) -> i32 {
        match board.status() {
            GameStatus::Finished { winner } => {
                if winner.id() == 1 { 100_000 } else { -100_000 }
            }
            _ => 0,
        }
    }

    /// Evaluación heurística para nodos internos.
    ///
    /// `player_score` devuelve el coste mínimo del camino que conecta los
    /// tres lados — cuanto más bajo, mejor para ese jugador.
    ///
    /// La puntuación final es `score_human - score_bot`:
    ///   · positivo → el bot está en mejor posición (camino más corto)
    ///   · negativo → el humano está en mejor posición
    ///
    /// El multiplicador de urgencia se aplica cuando el humano está a punto
    /// de ganar (coste ≤ 2) para priorizar el bloqueo sobre el avance propio.
    fn evaluate_board(&self, board: &GameY, ctx: &mut SearchContext) -> i32 {
        // Coste del camino mínimo para cada jugador.
        // Valores altos (u32::MAX) significan que el jugador no tiene piezas aún.
        let score_bot   = self.player_score(board, PlayerId::new(1), ctx) as i32;
        let score_human = self.player_score(board, PlayerId::new(0), ctx) as i32;

        // Urgencia: si el humano puede ganar en muy pocos movimientos, el bloqueo
        // vale el triple que el avance propio.
        let urgency = if score_human <= 2 { 3 } else { 1 };

        // Bot maximiza esta expresión → quiere score_human alto y score_bot bajo
        score_human * urgency - score_bot
    }

    // ── Heurística de camino mínimo (0-1 BFS) ───────────────────────────────

    /// Calcula el número de celdas vacías que le faltan al jugador para
    /// conectar los tres lados (sus propias celdas tienen coste 0).
    fn player_score(&self, board: &GameY, player: PlayerId, ctx: &mut SearchContext) -> u32 {
        let total = board.total_cells() as usize;
        ctx.player_cells.fill(false);
        ctx.visitable.fill(false);

        let mut owns_any = false;

        for idx in 0..total {
            let coord = Coordinates::from_index(idx as u32, board.board_size());
            let owner = board.get_cell_owner(&coord);
            // Solo podemos pasar por celdas vacías o propias
            if owner.is_none() || owner == Some(player) {
                ctx.visitable[idx] = true;
                if owner == Some(player) {
                    ctx.player_cells[idx] = true;
                    owns_any = true;
                }
            }
        }

        // Sin piezas aún: devolvemos un coste muy alto pero no MAX para evitar
        // overflow al calcular la diferencia de scores.
        if !owns_any {
            return 9999;
        }

        // BFS 0-1 desde cada uno de los tres lados
        self.bfs_from_side(board, 0, ctx);
        // NOTA: guardamos los resultados en variables locales porque bfs_from_side
        // sobreescribe ctx.dist_* en cada llamada.
        let dist_a: Vec<u32> = ctx.dist_a.clone();

        self.bfs_from_side(board, 1, ctx);
        let dist_b: Vec<u32> = ctx.dist_b.clone();

        self.bfs_from_side(board, 2, ctx);
        // dist_c queda en ctx.dist_c, no hace falta clonar

        let mut min_score = u32::MAX;

        for idx in 0..total {
            if !ctx.visitable[idx] {
                continue;
            }
            let da = dist_a[idx];
            let db = dist_b[idx];
            let dc = ctx.dist_c[idx];

            if da == u32::MAX || db == u32::MAX || dc == u32::MAX {
                continue;
            }

            // La celda hub tiene coste 0 si es propia, 1 si está vacía.
            // Los BFS ya incorporan ese coste en los vecinos, pero la celda
            // hub en sí debe descontarse una vez para no contarla doble.
            let hub_cost = if ctx.player_cells[idx] { 0u32 } else { 1u32 };
            let total_cost = da
                .saturating_add(db)
                .saturating_add(dc)
                .saturating_sub(hub_cost.saturating_mul(2));

            if total_cost < min_score {
                min_score = total_cost;
            }
        }

        min_score
    }

    /// 0-1 BFS desde uno de los tres lados del tablero.
    /// Las celdas propias del jugador tienen coste 0 (ya las "posee"),
    /// las vacías tienen coste 1 (habría que jugar ahí).
    fn bfs_from_side(&self, board: &GameY, side: u8, ctx: &mut SearchContext) {
        let dist_out: &mut Vec<u32> = match side {
            0 => &mut ctx.dist_a,
            1 => &mut ctx.dist_b,
            _ => &mut ctx.dist_c,
        };

        dist_out.fill(u32::MAX);
        ctx.visited.fill(false);
        ctx.deque.clear();

        // Semillas: todas las celdas visitables que tocan el lado elegido
        for idx in 0..(board.total_cells() as usize) {
            if !ctx.visitable[idx] {
                continue;
            }
            let coord = Coordinates::from_index(idx as u32, board.board_size());
            let on_side = match side {
                0 => coord.touches_side_a(),
                1 => coord.touches_side_b(),
                _ => coord.touches_side_c(),
            };
            if on_side {
                dist_out[idx] = 0;
                ctx.deque.push_front(idx as u32);
            }
        }

        while let Some(curr_idx) = ctx.deque.pop_front() {
            let curr = curr_idx as usize;
            if ctx.visited[curr] {
                continue;
            }
            ctx.visited[curr] = true;

            let current_dist = dist_out[curr];
            let curr_coord   = Coordinates::from_index(curr_idx, board.board_size());

            for neighbor in board.get_neighbors(&curr_coord) {
                let n_idx = neighbor.to_index(board.board_size()) as usize;
                if !ctx.visitable[n_idx] || ctx.visited[n_idx] {
                    continue;
                }

                // Coste 0 si el vecino ya es del jugador, 1 si está vacío
                let step_cost = if ctx.player_cells[n_idx] { 0u32 } else { 1u32 };
                let new_dist  = current_dist.saturating_add(step_cost);

                if new_dist < dist_out[n_idx] {
                    dist_out[n_idx] = new_dist;
                    // 0-1 BFS: coste 0 va al frente, coste 1 va al fondo
                    if step_cost == 0 {
                        ctx.deque.push_front(n_idx as u32);
                    } else {
                        ctx.deque.push_back(n_idx as u32);
                    }
                }
            }
        }
    }

    // ── Generación de candidatos ─────────────────────────────────────────────

    /// Devuelve las celdas más relevantes para explorar.
    ///
    /// - Tier 1: vecino directo de cualquier pieza (bot o humano) → máxima prioridad
    /// - Tier 2: vecino de un vecino del bot o del humano → segunda prioridad
    ///
    /// Si el tablero está vacío devuelve todas las celdas disponibles.
    fn relevant_cells(&self, board: &GameY) -> Vec<u32> {
        let n      = board.total_cells() as usize;
        let avail  = board.available_cells();

        let mut occupied      = vec![false; n];
        let mut any_frontier  = vec![false; n]; // frontera de CUALQUIER jugador
        let mut has_occupied  = false;

        for idx in 0..n {
            let coord = Coordinates::from_index(idx as u32, board.board_size());
            if board.get_cell_owner(&coord).is_some() {
                occupied[idx] = true;
                has_occupied  = true;
                for neighbor in board.get_neighbors(&coord) {
                    let n_idx = neighbor.to_index(board.board_size()) as usize;
                    any_frontier[n_idx] = true;
                }
            }
        }

        if !has_occupied {
            return avail.clone();
        }

        let mut candidates = Vec::new();

        for &idx in avail {
            let coord = Coordinates::from_index(idx, board.board_size());

            // Tier 1: vecino inmediato de alguna pieza
            let is_tier1 = board
                .get_neighbors(&coord)
                .iter()
                .any(|n| occupied[n.to_index(board.board_size()) as usize]);

            if is_tier1 {
                candidates.push(idx);
                continue;
            }

            // Tier 2: vecino de un vecino de cualquier jugador
            let is_tier2 = board
                .get_neighbors(&coord)
                .iter()
                .any(|n| any_frontier[n.to_index(board.board_size()) as usize]);

            if is_tier2 {
                candidates.push(idx);
            }
        }

        // Fallback: si los filtros dejan el conjunto vacío, usamos todos
        if candidates.is_empty() {
            avail.clone()
        } else {
            candidates
        }
    }
}

// ─── Implementación del trait YBot ──────────────────────────────────────────

impl YBot for MediumBot {
    fn name(&self) -> &str {
        "medium_bot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        self.chose_best_move(board)
    }
}