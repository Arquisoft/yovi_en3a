import React, { type ForwardRefExoticComponent, type RefAttributes } from "react";
import StandardBoard from "./StandardBoard";
import MasterBoard from "./MasterBoard";
import FortuneBoard from "./FortuneBoard";
import TabuBoard from "./TabuBoard";
import WhyNotBoard from "./WhyNotBoard";
import HoleyBoard from "./HoleyBoard";
import { type BoardProps, type GameBoardRef } from "./Types";

export const BOARD_MAP: Record <
  string,
  ForwardRefExoticComponent<BoardProps & RefAttributes<GameBoardRef>>
> = {
  standard: StandardBoard,
  master: MasterBoard,
  fortune: FortuneBoard,
  tabu: TabuBoard,
  whynot: WhyNotBoard,
  holey: HoleyBoard,
};