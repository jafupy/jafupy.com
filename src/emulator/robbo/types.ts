import type { Terminal } from "@xterm/xterm";

export const SAVE_KEY = "robbo_save";
export const HUD_ROWS = 1;

export type RobboTerminal = Pick<
  Terminal,
  "cols" | "rows" | "write" | "clear" | "onKey" | "onResize"
>;

export type Cell = "." | " " | "#" | "*" | "@" | "O" | "E" | "X" | "P" | "x";
export type Point = { x: number; y: number };
export type Mode = "menu" | "game" | "dead" | "won";

export interface Enemy extends Point {
  dx: number;
  dy: number;
}

export interface SaveState {
  board: Cell[][];
  player: Point;
  enemies: Enemy[];
  portals: { a: Point; b: Point }[];
  screwsLeft: number;
  moves: number;
  tick: number;
  paused: boolean;
  level: number;
  width: number;
  height: number;
}

export interface Dims {
  width: number;
  height: number;
  boardRows: number;
  padX: number;
  padTop: number;
}

export type Rect = { x: number; y: number; width: number; height: number };
export type RoomRole =
  | "start"
  | "screw"
  | "block-puzzle"
  | "hazard"
  | "connector"
  | "capsule";

export interface Room extends Rect {
  center: Point;
  role: RoomRole;
}
