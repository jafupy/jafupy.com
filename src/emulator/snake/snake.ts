import type { Terminal } from "@xterm/xterm";
import { centerLine, renderScreen } from "../terminal";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const GREEN_BG = "\x1b[42m";
const RED_BG = "\x1b[41m";
const RESET = "\x1b[0m";
const HALF = [" ", "▄", "▀", "█"]; // none, bottom, top, both
const EDGE_SHADE_FG = [
  "\x1b[38;2;166;172;205m",
  "\x1b[38;2;142;148;180m",
  "\x1b[38;2;118;124;147m",
  "\x1b[38;2;98;104;130m",
  "\x1b[38;2;79;85;112m",
];
const EDGE_RADIUS = 15;
const SAVE_KEY = "snake_save";
const OUTER_PADDING_X = 2;
const OUTER_PADDING_Y = 1;

interface SaveState {
  snake: { x: number; y: number }[];
  direction: { x: number; y: number };
  food: { x: number; y: number };
  score: number;
}

type SnakeTerminal = Pick<
  Terminal,
  "cols" | "rows" | "write" | "clear" | "onKey" | "onResize"
>;

function buildMenuScreen(terminal: SnakeTerminal) {
  const width = Math.max(terminal.cols, 1);
  const hasSave = !!localStorage.getItem(SAVE_KEY);
  const controls = hasSave
    ? "[Enter/Space] Play  [L] Load Save"
    : "[Enter/Space] Play";

  return [
    centerLine("SNAKE", width),
    centerLine("jafupy.com", width),
    "",
    centerLine("WASD / Arrows to move", width),
    centerLine("Space to pause  F to save  Esc to back", width),
    "",
    centerLine(controls, width),
  ];
}

function buildDeathScreen(terminal: SnakeTerminal, score: number) {
  const width = Math.max(terminal.cols, 1);
  return [
    centerLine("GAME OVER", width),
    centerLine(`Score: ${score}`, width),
    "",
    centerLine("[Enter/Space/R] Try again", width),
    centerLine("[H] Home", width),
  ];
}

function getCellColors(value: number) {
  if (value === 3) return { fg: RED, bg: RED_BG };
  if (value >= 1) return { fg: GREEN, bg: GREEN_BG };
  return null;
}

function renderMixedCell(topVal: number, botVal: number) {
  const top = getCellColors(topVal);
  const bottom = getCellColors(botVal);

  if (!top && !bottom) return " ";
  if (top && bottom) {
    if (top.fg === bottom.fg) return `${top.fg}${HALF[3]}${RESET}`;
    return `${top.fg}${bottom.bg}${HALF[2]}${RESET}`;
  }
  if (top) return `${top.fg}${HALF[2]}${RESET}`;
  return `${bottom!.fg}${HALF[1]}${RESET}`;
}

function shadeLevelForDistance(distance: number) {
  if (distance <= 3) return 0;
  if (distance <= 6) return 1;
  if (distance <= 9) return 2;
  if (distance <= 12) return 3;
  if (distance <= EDGE_RADIUS) return 4;
  return -1;
}

function renderHalfShade(level: number, half: "top" | "bottom") {
  if (level < 0) return " ";
  return `${EDGE_SHADE_FG[level]}${half === "top" ? "▀" : "▄"}${RESET}`;
}

function renderFullShade(level: number) {
  if (level < 0) return " ";
  return `${EDGE_SHADE_FG[level]}█${RESET}`;
}

function startGame(
  terminal: Terminal,
  onDeath: (score: number) => void,
  options?: { paused?: boolean; onExit?: () => void },
) {
  function getDims() {
    const padX = Math.min(
      OUTER_PADDING_X,
      Math.max(Math.floor((terminal.cols - 4) / 2), 0),
    );
    const maxInnerCols = Math.max(terminal.cols - padX * 2, 4);

    const preferredPadY = Math.min(
      OUTER_PADDING_Y,
      Math.max(Math.floor((terminal.rows - 4) / 2), 0),
    );
    const maxInnerRows = Math.max(terminal.rows - preferredPadY * 2 - 1, 4);

    const tcols = maxInnerCols;
    const trows = maxInnerRows;
    const pwidth = tcols;
    const pheight = trows * 2;
    const padTop = preferredPadY;
    const padBottom = preferredPadY;

    return { tcols, trows, pwidth, pheight, padX, padTop, padBottom };
  }

  let { tcols, trows, pwidth, pheight, padX, padTop, padBottom } = getDims();

  let snake = [{ x: Math.floor(pwidth / 2), y: Math.floor(pheight / 2) }];
  let direction = { x: 1, y: 0 };
  let dirQueue: { x: number; y: number }[] = [];
  let paused = options?.paused ?? false;
  let score = 0;
  let loopHandle: ReturnType<typeof setTimeout>;
  let prevLines: string[] = [];
  let blinkState = true;
  let running = true;

  terminal.write("\x1b[?25l");

  function getRandomFoodPosition() {
    const cx = pwidth / 2;
    const cy = pheight / 2;
    const hx = snake[0].x;
    const hy = snake[0].y;

    let best: { x: number; y: number } | null = null;
    let bestScore = -Infinity;

    for (let i = 0; i < 20; i++) {
      const pos = {
        x: Math.floor(Math.random() * (pwidth - 6)) + 3,
        y: Math.floor(Math.random() * (pheight - 6)) + 3,
      };

      if (snake.some((s) => s.x === pos.x && s.y === pos.y)) continue;

      const distCenter = Math.hypot(pos.x - cx, pos.y - cy);
      const distHead = Math.hypot(pos.x - hx, pos.y - hy);

      // closer to center = better, closer to head = better
      const score = -distCenter * 0.6 - distHead * 0.4;

      if (score > bestScore) {
        bestScore = score;
        best = pos;
      }
    }

    // fallback if all candidates landed on snake
    if (!best) best = { x: Math.floor(cx), y: Math.floor(cy) };
    return best;
  }

  let food = getRandomFoodPosition();

  function save() {
    const state: SaveState = { snake: [...snake], direction, food, score };
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function load(): boolean {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const state: SaveState = JSON.parse(raw);
      snake = state.snake;
      direction = state.direction;
      food = state.food;
      score = state.score;
      dirQueue = [];
      prevLines = [];
      return true;
    } catch {
      return false;
    }
  }

  const keyListener = terminal.onKey(({ domEvent }) => {
    const k = domEvent.key;
    const last =
      dirQueue.length > 0 ? dirQueue[dirQueue.length - 1] : direction;

    if (dirQueue.length < 3) {
      if ((k === "ArrowLeft" || k === "a") && last.x === 0)
        dirQueue.push({ x: -1, y: 0 });
      if ((k === "ArrowRight" || k === "d") && last.x === 0)
        dirQueue.push({ x: 1, y: 0 });
      if ((k === "ArrowUp" || k === "w") && last.y === 0)
        dirQueue.push({ x: 0, y: -1 });
      if ((k === "ArrowDown" || k === "s") && last.y === 0)
        dirQueue.push({ x: 0, y: 1 });
    }

    if (k === " " || k === "p") paused = !paused;
    if (k === "Escape") {
      stop();
      options?.onExit?.();
      return;
    }
    if (k === "f" || (domEvent.ctrlKey && k === "s")) {
      domEvent.preventDefault();
      save();
    }
    if (k === "l") load();
  });

  function buildFrame(): string[] {
    ({ tcols, trows, pwidth, pheight, padX, padTop, padBottom } = getDims());
    const gutter = " ".repeat(padX);

    function closestSnakeDistance(x: number, y: number) {
      let closest = Infinity;
      for (const segment of snake) {
        closest = Math.min(closest, Math.hypot(x - segment.x, y - segment.y));
      }
      return closest;
    }

    function shadeLevelAt(x: number, y: number) {
      return shadeLevelForDistance(closestSnakeDistance(x, y));
    }

    function renderSideShade(x: number, y: number) {
      const levels = [shadeLevelAt(x, y), shadeLevelAt(x, y + 1)].filter(
        (level) => level >= 0,
      );
      const level = levels.length ? Math.min(...levels) : -1;
      return renderFullShade(level);
    }

    const grid = new Uint8Array(pwidth * pheight);
    for (let i = snake.length - 1; i >= 0; i--) {
      const { x, y } = snake[i];
      if (x >= 0 && x < pwidth && y >= 0 && y < pheight)
        grid[y * pwidth + x] = i === 0 ? 2 : 1;
    }
    if (food.x < pwidth && food.y < pheight) grid[food.y * pwidth + food.x] = 3;

    const lines: string[] = [];
    for (let i = 0; i < padTop; i++) {
      let line = "";
      for (let tx = -padX; tx < pwidth + padX; tx++) {
        const isOuterPad = tx === -padX || tx === pwidth + padX - 1;
        line += isOuterPad
          ? " "
          : renderHalfShade(shadeLevelAt(tx, -1), "bottom");
      }
      lines.push(line);
    }

    for (let ty = 0; ty < trows; ty++) {
      const y = ty * 2;
      let line = `${padX > 1 ? " " : ""}${renderSideShade(-1, y)}`;
      for (let tx = 0; tx < tcols; tx++) {
        const topVal = ty * 2 < pheight ? grid[ty * 2 * pwidth + tx] : 0;
        const botVal =
          ty * 2 + 1 < pheight ? grid[(ty * 2 + 1) * pwidth + tx] : 0;

        const visibleTop = topVal === 2 && !blinkState ? 0 : topVal;
        const visibleBottom = botVal === 2 && !blinkState ? 0 : botVal;
        line += renderMixedCell(visibleTop, visibleBottom);
      }
      line += `${renderSideShade(pwidth, y)}${padX > 1 ? " " : ""}`;
      lines.push(line);
    }

    for (let i = 0; i < padBottom; i++) {
      let line = "";
      for (let tx = -padX; tx < pwidth + padX; tx++) {
        const isOuterPad = tx === -padX || tx === pwidth + padX - 1;
        line += isOuterPad
          ? " "
          : renderHalfShade(shadeLevelAt(tx, pheight), "top");
      }
      lines.push(line);
    }

    const hasSave = !!localStorage.getItem(SAVE_KEY);
    lines.push(
      `${gutter}Score: ${score}  [WASD/Arrows] [Space: Pause] [F: Save]${hasSave ? " [L: Load]" : ""} [Esc: Back]`,
    );

    return lines;
  }

  function draw() {
    const lines = buildFrame();
    if (prevLines.length === 0) {
      terminal.write(
        "\x1b[H" +
          lines.map((line, i) => `\x1b[${i + 1};1H${line}\x1b[K`).join(""),
      );
    } else {
      const maxLines = Math.max(lines.length, prevLines.length);
      for (let i = 0; i < maxLines; i++) {
        const nextLine = lines[i] ?? "";
        if (nextLine !== prevLines[i])
          terminal.write(`\x1b[${i + 1};1H${nextLine}\x1b[K`);
      }
    }
    prevLines = lines;
  }

  function update() {
    if (!running || paused) return true;
    if (dirQueue.length > 0) direction = dirQueue.shift()!;

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (
      head.x < 0 ||
      head.x >= pwidth ||
      head.y < 0 ||
      head.y >= pheight ||
      snake.some((s) => s.x === head.x && s.y === head.y)
    ) {
      stop();
      onDeath(score);
      return false;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      food = getRandomFoodPosition();
      score++;
    } else {
      snake.pop();
    }

    return true;
  }

  function loop() {
    if (!running) return;
    if (paused) blinkState = !blinkState;
    else blinkState = true;
    const alive = update();
    if (!alive || !running) return;
    draw();
    loopHandle = setTimeout(loop, 75);
  }

  function stop() {
    running = false;
    clearTimeout(loopHandle);
    keyListener.dispose();
    terminal.write("\x1b[?25h");
  }

  loop();

  return { stop, redraw: draw, load };
}

export function startSnakeApp(
  terminal: SnakeTerminal,
  options?: {
    directStart?: boolean;
    paused?: boolean;
    onExit?: () => void;
    onStateChange?: (mode: "menu" | "game" | "dead") => void;
  },
) {
  let mode: "menu" | "game" | "dead" = "menu";
  let score = 0;
  let game: ReturnType<typeof startGame> | null = null;

  function drawMenu() {
    renderScreen(terminal, buildMenuScreen(terminal));
  }

  function drawDeath() {
    renderScreen(terminal, buildDeathScreen(terminal, score));
  }

  function stopGame() {
    game?.stop();
    game = null;
  }

  function startNewGame(shouldLoad = false) {
    stopGame();
    terminal.clear();
    mode = "game";
    options?.onStateChange?.(mode);
    game = startGame(
      terminal as Terminal,
      (nextScore) => {
        score = nextScore;
        game = null;
        mode = "dead";
        options?.onStateChange?.(mode);
        drawDeath();
      },
      { paused: options?.paused, onExit: options?.onExit },
    );
    if (shouldLoad) {
      game.load();
      game.redraw();
    }
  }

  if (options?.directStart) startNewGame();
  else {
    options?.onStateChange?.(mode);
    drawMenu();
  }

  const menuListener = terminal.onKey(({ domEvent }) => {
    if (mode === "game") return;

    const key = domEvent.key.toLowerCase();

    if (key === "enter" || key === " ") {
      domEvent.preventDefault();
      startNewGame();
      return;
    }

    if (mode === "menu" && key === "l" && localStorage.getItem(SAVE_KEY)) {
      domEvent.preventDefault();
      startNewGame(true);
      return;
    }

    if (mode === "dead" && (key === "r" || key === "enter" || key === " ")) {
      domEvent.preventDefault();
      startNewGame();
      return;
    }

    if (mode === "dead" && (key === "h" || domEvent.key === "Escape")) {
      domEvent.preventDefault();
      if (options?.onExit) options.onExit();
      else {
        mode = "menu";
        options?.onStateChange?.(mode);
        drawMenu();
      }
    }
  });

  const resizeListener = terminal.onResize(() => {
    if (mode === "game") game?.redraw();
    else if (mode === "menu") drawMenu();
    else drawDeath();
  });

  return {
    stop() {
      stopGame();
      menuListener.dispose();
      resizeListener.dispose();
    },
  };
}
