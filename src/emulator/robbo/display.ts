import type { Terminal } from "@xterm/xterm";
import { centerLine } from "../terminal";
import { HUD_ROWS, SAVE_KEY, type Cell, type Dims, type RobboTerminal } from "./types";

export const RESET = "\x1b[0m";
const HALF = [" ", "▄", "▀", "█"];

const COLORS: Record<Cell, { fg: string; bg: string }> = {
  ".": { fg: "", bg: "" },
  " ": { fg: "", bg: "" },
  "#": { fg: "\x1b[38;2;118;124;147m", bg: "\x1b[48;2;118;124;147m" },
  "*": { fg: "\x1b[38;2;255;250;194m", bg: "\x1b[48;2;255;250;194m" },
  "@": { fg: "\x1b[38;2;137;221;255m", bg: "\x1b[48;2;137;221;255m" },
  "O": { fg: "\x1b[38;2;166;172;205m", bg: "\x1b[48;2;166;172;205m" },
  "E": { fg: "\x1b[38;2;208;103;157m", bg: "\x1b[48;2;208;103;157m" },
  "X": { fg: "\x1b[38;2;91;228;199m", bg: "\x1b[48;2;91;228;199m" },
  "P": { fg: "\x1b[38;2;199;146;234m", bg: "\x1b[48;2;199;146;234m" },
  "x": { fg: "\x1b[38;2;79;85;112m", bg: "\x1b[48;2;79;85;112m" },
};

export const HUD = "\x1b[38;2;166;172;205m";
export const ACCENT = "\x1b[38;2;255;250;194m";

export function buildMenuScreen(terminal: RobboTerminal) {
  const width = Math.max(terminal.cols, 1);
  const hasSave = !!localStorage.getItem(SAVE_KEY);

  return [
    centerLine("ROBBO", width),
    centerLine("jafupy.com", width),
    "",
    centerLine("Collect screws, push rocks, dodge bots", width),
    centerLine("Click reachable cells to auto-walk there", width),
    centerLine("WASD / Arrows move   Space pause   F save", width),
    "",
    centerLine(
      `[Enter/Space] Play${hasSave ? "   [L] Load Save" : ""}`,
      width,
    ),
  ];
}

export function buildDeathScreen(
  terminal: RobboTerminal,
  level: number,
  moves: number,
  screwsLeft: number,
) {
  const width = Math.max(terminal.cols, 1);

  return [
    centerLine("ROBOT LOST", width),
    centerLine(`Level: ${level}   Moves: ${moves}   Screws left: ${screwsLeft}`, width),
    "",
    centerLine("[Enter/Space/R] Try again", width),
    centerLine("[H] Home", width),
  ];
}

export function getDims(terminal: Pick<Terminal, "cols" | "rows">): Dims {
  const width = Math.max(terminal.cols, 24);
  const height = Math.max((terminal.rows - HUD_ROWS) * 2, 16);

  return {
    width,
    height,
    boardRows: Math.ceil(height / 2),
    padX: 0,
    padTop: 0,
  };
}


export function renderMixedCell(topVal: Cell, bottomVal: Cell) {
  const top = topVal === " " || topVal === "." ? null : COLORS[topVal];
  const bottom = bottomVal === " " || bottomVal === "." ? null : COLORS[bottomVal];

  if (!top && !bottom) return " ";
  if (top && bottom) {
    if (top.fg === bottom.fg) return `${top.fg}${HALF[3]}${RESET}`;
    return `${top.fg}${bottom.bg}${HALF[2]}${RESET}`;
  }
  if (top) return `${top.fg}${HALF[2]}${RESET}`;
  return `${bottom!.fg}${HALF[1]}${RESET}`;
}

