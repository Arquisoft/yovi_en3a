// src/server/check_win.rs

use crate::{GameY, YEN, check_api_version, error::ErrorResponse};
use axum::{Json, extract::Path};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CheckWinParams {
    pub api_version: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct CheckWinResponse {
    pub api_version: String,
    pub game_over: bool,
    pub winner: Option<u32>, // None si sigue en curso, Some(0) o Some(1) si hay ganador
}

#[axum::debug_handler]
pub async fn check_win(
    Path(params): Path<CheckWinParams>,
    Json(yen): Json<YEN>,
) -> Result<Json<CheckWinResponse>, Json<ErrorResponse>> {
    check_api_version(&params.api_version)?;

    let game = match GameY::try_from(yen) {
        Ok(g) => g,
        Err(err) => {
            return Err(Json(ErrorResponse::error(
                &format!("Invalid YEN format: {}", err),
                Some(params.api_version),
                None,
            )));
        }
    };

    let (game_over, winner) = match game.status() {
        crate::game::GameStatus::Finished { winner } => (true, Some(winner.id())),
        crate::game::GameStatus::Ongoing { .. } => (false, None),
    };

    Ok(Json(CheckWinResponse {
        api_version: params.api_version,
        game_over,
        winner,
    }))
}