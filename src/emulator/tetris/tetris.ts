import type { Terminal } from "@xterm/xterm";

const RESET = "\x1b[0m";
const BLOCK = "███";
const TOP_HALF = "▀▀▀";
const BOTTOM_HALF = "▄▄▄";
const GHOST = "░░░";
const EMPTY = "   ";
const PANEL_WIDTH = 18;
const BOARD_WIDTH = 15;
const BOARD_HEIGHT = 20;
const SAVE_KEY = "tetris_save";

const PANEL_TEXT = "\x1b[38;2;166;172;205m";
const PANEL_MUTED = "\x1b[38;2;118;124;147m";
const PANEL_ACCENT = "\x1b[38;2;245;93;173m";
const BORDER = "\x1b[38;2;137;221;255m";

const COLORS = {
  I: "\x1b[38;2;137;221;255m",
  O: "\x1b[38;2;255;250;194m",
  T: "\x1b[38;2;199;146;234m",
  S: "\x1b[38;2;91;228;199m",
  Z: "\x1b[38;2;208;103;157m",
  J: "\x1b[38;2;173;215;255m",
  L: "\x1b[38;2;232;193;160m",
} as const;

type PieceId = keyof typeof COLORS;
type Point = [number, number];
type Shape = Point[];
type Board = number[][];

type TetrisTerminal = Pick<
  Terminal,
  "cols" | "rows" | "write" | "clear" | "onKey" | "onResize"
>;

interface ActivePiece {
  id: PieceId;
  rotation: number;
  x: number;
  y: number;
}

interface SaveState {
  board: Board;
  active: ActivePiece | null;
  nextPiece: PieceId;
  score: number;
  linesCleared: number;
  level: number;
  paused: boolean;
  halfStepActive: boolean;
}

interface UndoState extends SaveState {}

const PIECES: Record<PieceId, Shape[]> = {
  I: [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  O: Array.from({ length: 4 }, () => [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ]),
  T: [
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  S: [
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  Z: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ],
  ],
  J: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  ],
  L: [
    [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  ],
};

function centerLine(text: string, width: number) {
  if (text.length >= width) return text.slice(0, width);
  const left = Math.floor((width - text.length) / 2);
  return `${" ".repeat(left)}${text}${" ".repeat(width - text.length - left)}`;
}

function visibleLength(text: string) {
  return text.replace(/\x1b\[[0-9;]*m/g, "").length;
}

function padAnsi(text: string, width: number) {
  const len = visibleLength(text);
  if (len >= width) return text;
  return text + " ".repeat(width - len);
}

function renderScreen(terminal: TetrisTerminal, lines: string[]) {
  const width = Math.max(terminal.cols, 1);
  const height = Math.max(terminal.rows, 1);
  const topPad = Math.max(Math.floor((height - lines.length) / 2), 0);
  const frame = Array.from({ length: height }, () => " ".repeat(width));

  for (let i = 0; i < lines.length && i + topPad < height; i++) {
    frame[i + topPad] = lines[i];
  }

  terminal.write("\x1b[2J\x1b[H" + frame.join("\r\n"));
}

function emptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

function pieceValue(id: PieceId) {
  return (Object.keys(COLORS) as PieceId[]).indexOf(id) + 1;
}

function pieceColor(value: number) {
  const id = (Object.keys(COLORS) as PieceId[])[value - 1];
  return id ? COLORS[id] : null;
}

function getCells(piece: ActivePiece) {
  return PIECES[piece.id][piece.rotation].map(([x, y]) => ({
    x: piece.x + x,
    y: piece.y + y,
  }));
}

function randomPieceId(): PieceId {
  const ids = Object.keys(PIECES) as PieceId[];
  return ids[Math.floor(Math.random() * ids.length)];
}

function gravityDelay(level: number) {
  return Math.max(1000 - (level - 1) * 85, 120);
}

function cloneBoard(board: Board) {
  return board.map((row) => [...row]);
}

function startGame(
  terminal: Terminal,
  onGameOver: (score: number, lines: number, level: number) => void,
  options?: { paused?: boolean; onExit?: () => void },
) {
  let board = emptyBoard();
  let active: ActivePiece | null = null;
  let nextPiece: PieceId = randomPieceId();
  let score = 0;
  let linesCleared = 0;
  let level = 1;
  let paused = options?.paused ?? false;
  let running = true;
  let prevLines: string[] = [];
  let loopHandle: ReturnType<typeof setTimeout>;
  let halfStepActive = false;
  let undoState: UndoState | null = null;

  terminal.write("\x1b[?25l");

  function fits(piece: ActivePiece) {
    return getCells(piece).every(({ x, y }) => {
      if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return false;
      if (y < 0) return true;
      return board[y][x] === 0;
    });
  }

  function save() {
    const state: SaveState = {
      board: cloneBoard(board),
      active: active ? { ...active } : null,
      nextPiece,
      score,
      linesCleared,
      level,
      paused,
      halfStepActive,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    try {
      const state: SaveState = JSON.parse(raw);
      const nextBoard = state.board.map((row) => [...row]);
      const nextActive = state.active ? { ...state.active } : null;

      if (
        nextBoard.length !== BOARD_HEIGHT ||
        nextBoard.some((row) => row.length !== BOARD_WIDTH)
      ) {
        return false;
      }

      const prevBoard = board;
      board = nextBoard;
      const activeFits = !nextActive || fits(nextActive);
      board = prevBoard;
      if (!activeFits) return false;

      board = nextBoard;
      active = nextActive;
      nextPiece = state.nextPiece;
      score = state.score;
      linesCleared = state.linesCleared;
      level = state.level;
      paused = state.paused;
      halfStepActive = state.halfStepActive;
      prevLines = [];

      return true;
    } catch {
      return false;
    }
  }

  function captureUndoState() {
    undoState = {
      board: cloneBoard(board),
      active: active ? { ...active } : null,
      nextPiece,
      score,
      linesCleared,
      level,
      paused,
      halfStepActive,
    };
  }

  function undoLastPiece() {
    if (!undoState) return false;

    board = cloneBoard(undoState.board);
    active = undoState.active ? { ...undoState.active } : null;
    nextPiece = undoState.nextPiece;
    score = undoState.score;
    linesCleared = undoState.linesCleared;
    level = undoState.level;
    paused = undoState.paused;
    halfStepActive = undoState.halfStepActive;
    prevLines = [];
    undoState = null;
    return true;
  }

  function spawnPiece() {
    const piece: ActivePiece = {
      id: nextPiece,
      rotation: 0,
      x: Math.floor(BOARD_WIDTH / 2) - 2,
      y: 0,
    };
    nextPiece = randomPieceId();
    active = piece;
    if (!fits(piece)) {
      stop();
      onGameOver(score, linesCleared, level);
    }
  }

  function lockPiece() {
    if (!active) return;
    captureUndoState();
    const value = pieceValue(active.id);
    for (const { x, y } of getCells(active)) {
      if (y >= 0) board[y][x] = value;
    }

    let cleared = 0;
    board = board.filter((row) => {
      const full = row.every(Boolean);
      if (full) cleared++;
      return !full;
    });

    while (board.length < BOARD_HEIGHT) {
      board.unshift(Array(BOARD_WIDTH).fill(0));
    }

    if (cleared > 0) {
      linesCleared += cleared;
      score += [0, 100, 300, 500, 800][cleared] * level;
      level = 1 + Math.floor(linesCleared / 10);
    }

    spawnPiece();
  }

  function move(dx: number, dy: number) {
    if (!active) return false;
    const next = { ...active, x: active.x + dx, y: active.y + dy };
    if (!fits(next)) return false;
    active = next;
    return true;
  }

  function rotate(direction: 1 | -1) {
    if (!active) return;
    const rotation =
      (active.rotation + direction + PIECES[active.id].length) %
      PIECES[active.id].length;
    for (const kick of [0, -1, 1, -2, 2]) {
      const next = { ...active, rotation, x: active.x + kick };
      if (fits(next)) {
        active = next;
        return;
      }
    }
  }

  function hardDrop() {
    if (!active) return;
    let distance = 0;
    if (halfStepActive && move(0, 1)) {
      halfStepActive = false;
      distance++;
    }
    while (move(0, 1)) distance++;
    score += distance * 2;
    lockPiece();
  }

  function buildLines() {
    const boardRenderWidth = BOARD_WIDTH * BLOCK.length;
    const previewWidth = 4 * BLOCK.length;
    const contentWidth = boardRenderWidth + 2 + 1 + PANEL_WIDTH;
    const opticalWidth =
      boardRenderWidth + 2 + 1 + Math.floor(PANEL_WIDTH * 0.45);
    const innerWidth = Math.max(terminal.cols - 2, 1);
    const innerHeight = Math.max(terminal.rows - 2, 1);

    if (innerWidth < contentWidth + 4 || innerHeight < BOARD_HEIGHT + 4) {
      return [
        centerLine("TETRIS", terminal.cols),
        "",
        centerLine("Terminal too small", terminal.cols),
        centerLine("Make the window larger", terminal.cols),
      ];
    }

    const activeCells = new Map<string, number>();
    const activeTopHalf = new Map<string, number>();
    const activeBottomHalf = new Map<string, number>();
    if (active) {
      const value = pieceValue(active.id);

      for (const { x, y } of getCells(active)) {
        if (y < 0) continue;
        if (halfStepActive && y + 1 < BOARD_HEIGHT) {
          activeBottomHalf.set(`${x},${y}`, value);
          activeTopHalf.set(`${x},${y + 1}`, value);
        } else {
          activeCells.set(`${x},${y}`, value);
        }
      }
    }

    const ghostCells = new Set<string>();
    if (active) {
      let ghost = { ...active };
      while (fits({ ...ghost, y: ghost.y + 1 })) {
        ghost = { ...ghost, y: ghost.y + 1 };
      }
      for (const { x, y } of getCells(ghost)) {
        if (y >= 0 && !activeCells.has(`${x},${y}`)) {
          ghostCells.add(`${x},${y}`);
        }
      }
    }

    const nextGrid = Array.from({ length: 4 }, () => Array(4).fill(0));
    for (const [x, y] of PIECES[nextPiece][0]) {
      if (nextGrid[y]?.[x] !== undefined) {
        nextGrid[y][x] = pieceValue(nextPiece);
      }
    }

    const panel: string[] = [
      `${PANEL_TEXT}Next${RESET}`,
      `${BORDER}┌${"─".repeat(previewWidth)}┐${RESET}`,
      ...nextGrid.map(
        (row) =>
          `${BORDER}│${RESET}${row
            .map((cell) => {
              const color = pieceColor(cell);
              return color ? `${color}${BLOCK}${RESET}` : EMPTY;
            })
            .join("")}${BORDER}│${RESET}`,
      ),
      `${BORDER}└${"─".repeat(previewWidth)}┘${RESET}`,
      "",
      `${PANEL_TEXT}Score ${score}${RESET}`,
      `${PANEL_TEXT}Lines ${linesCleared}${RESET}`,
      `${PANEL_TEXT}Lvl   ${level}${RESET}`,
      `${PANEL_TEXT}Drop  ${Math.round(1000 / gravityDelay(level))}/s${RESET}`,
      "",
      `${PANEL_MUTED}A/D move${RESET}`,
      `${PANEL_MUTED}S hard drop${RESET}`,
      `${PANEL_MUTED}R rotate${RESET}`,
      `${PANEL_MUTED}Space pause${RESET}`,
      `${PANEL_MUTED}Cmd+Z undo${RESET}`,
      `${PANEL_MUTED}F save${RESET}`,
      `${localStorage.getItem(SAVE_KEY) ? `${PANEL_MUTED}L load${RESET}` : ""}`,
      `${PANEL_MUTED}Esc back${RESET}`,
    ].filter(Boolean);
    const contentHeight = Math.max(BOARD_HEIGHT + 2, panel.length) + 1;
    const boardStartX = Math.max(
      Math.floor((innerWidth - opticalWidth) / 2),
      2,
    );
    const boardStartY = Math.max(
      Math.floor((innerHeight - contentHeight) / 2),
      1,
    );
    const lines = Array.from({ length: terminal.rows }, () =>
      " ".repeat(terminal.cols),
    );

    lines[boardStartY] =
      `${" ".repeat(boardStartX)}${BORDER}┌${"─".repeat(boardRenderWidth)}┐${RESET}`;

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const boardRow = Array.from({ length: BOARD_WIDTH }, (_, x) => {
        const activeValue = activeCells.get(`${x},${y}`);
        if (activeValue) {
          const color = pieceColor(activeValue);
          return `${color}${BLOCK}${RESET}`;
        }
        const topHalfValue = activeTopHalf.get(`${x},${y}`);
        const bottomHalfValue = activeBottomHalf.get(`${x},${y}`);
        if (topHalfValue && bottomHalfValue) {
          const color = pieceColor(topHalfValue);
          return `${color}${BLOCK}${RESET}`;
        }
        if (topHalfValue) {
          const color = pieceColor(topHalfValue);
          return `${color}${TOP_HALF}${RESET}`;
        }
        if (bottomHalfValue) {
          const color = pieceColor(bottomHalfValue);
          return `${color}${BOTTOM_HALF}${RESET}`;
        }
        if (ghostCells.has(`${x},${y}`))
          return `${PANEL_MUTED}${GHOST}${RESET}`;
        const value = board[y][x];
        const color = pieceColor(value);
        return color ? `${color}${BLOCK}${RESET}` : EMPTY;
      }).join("");

      const panelRow = panel[y] ?? "";
      lines[boardStartY + 1 + y] =
        `${" ".repeat(boardStartX)}${BORDER}│${RESET}${boardRow}${BORDER}│${RESET} ${padAnsi(panelRow, PANEL_WIDTH)}`;
    }

    lines[boardStartY + 1 + BOARD_HEIGHT] =
      `${" ".repeat(boardStartX)}${BORDER}└${"─".repeat(boardRenderWidth)}┘${RESET}`;

    const footer = paused
      ? `${PANEL_ACCENT}[Space] Resume${RESET}  ${PANEL_MUTED}[Esc] Back${RESET}`
      : `${PANEL_MUTED}[Space] Pause  [Esc] Back${RESET}`;
    const footerRow = Math.min(
      boardStartY + Math.max(BOARD_HEIGHT + 2, panel.length) + 1,
      terminal.rows - 1,
    );
    lines[footerRow] = `${" ".repeat(boardStartX)}${footer}`;

    if (paused) {
      const pauseBars = `${PANEL_ACCENT}▐ ▌${RESET}`;
      const overlayX =
        boardStartX +
        1 +
        Math.floor((boardRenderWidth - visibleLength(pauseBars)) / 2);
      const overlayRow = boardStartY + 1 + Math.floor(BOARD_HEIGHT / 2);
      lines[overlayRow] = `${" ".repeat(overlayX)}${pauseBars}`;
    }

    return lines;
  }

  function draw() {
    const lines = buildLines();
    if (prevLines.length === 0) {
      terminal.write("\x1b[2J\x1b[H" + lines.join("\r\n"));
    } else {
      const maxLines = Math.max(lines.length, prevLines.length);
      for (let i = 0; i < maxLines; i++) {
        const nextLine = lines[i] ?? "";
        if (nextLine !== prevLines[i]) {
          terminal.write(`\x1b[${i + 1};1H${nextLine}\x1b[K`);
        }
      }
    }
    prevLines = lines;
  }

  function tick() {
    if (!running) return false;
    if (paused) return true;
    if (halfStepActive) {
      halfStepActive = false;
      if (!move(0, 1)) {
        lockPiece();
        return running;
      }
      return true;
    }

    if (active && fits({ ...active, y: active.y + 1 })) {
      halfStepActive = true;
      return true;
    }

    lockPiece();
    return running;
  }

  function loop() {
    if (!running) return;
    if (!tick() || !running) return;
    draw();
    loopHandle = setTimeout(loop, gravityDelay(level) / 2);
  }

  const keyListener = terminal.onKey(({ domEvent }) => {
    if (!running || !active) return;
    const key = domEvent.key.toLowerCase();

    if (key === " ") {
      domEvent.preventDefault();
      paused = !paused;
      draw();
      return;
    }

    if (domEvent.key === "Escape") {
      stop();
      options?.onExit?.();
      return;
    }

    if (key === "f" || (domEvent.ctrlKey && key === "s")) {
      domEvent.preventDefault();
      save();
      draw();
      return;
    }

    if (key === "l") {
      domEvent.preventDefault();
      if (load()) draw();
      return;
    }

    if (domEvent.metaKey && key === "z") {
      domEvent.preventDefault();
      if (undoLastPiece()) draw();
      return;
    }

    if (paused) return;

    if (key === "arrowleft" || key === "a") move(-1, 0);
    if (key === "arrowright" || key === "d") move(1, 0);
    if (key === "arrowdown" || key === "s") hardDrop();
    if (key === "arrowup" || key === "r" || key === "w") rotate(1);

    draw();
  });

  spawnPiece();
  draw();
  loopHandle = setTimeout(loop, gravityDelay(level) / 2);

  function stop() {
    running = false;
    clearTimeout(loopHandle);
    keyListener.dispose();
    terminal.write("\x1b[?25h");
  }

  return {
    stop,
    redraw: draw,
    load,
  };
}

export function startTetrisApp(
  terminal: TetrisTerminal,
  options?: {
    directStart?: boolean;
    paused?: boolean;
    onExit?: () => void;
    onStateChange?: (mode: "menu" | "game" | "dead") => void;
  },
) {
  let mode: "menu" | "game" | "dead" = "menu";
  let score = 0;
  let lines = 0;
  let level = 1;
  let game: ReturnType<typeof startGame> | null = null;

  function drawMenu() {
    const hasSave = !!localStorage.getItem(SAVE_KEY);
    renderScreen(terminal, [
      centerLine("TETRIS", terminal.cols),
      centerLine("jafupy.com", terminal.cols),
      "",
      centerLine("A / D move   S hard drop", terminal.cols),
      centerLine("R rotate   Space pause   Cmd+Z undo", terminal.cols),
      centerLine(
        `${hasSave ? "F save   L load   " : "F save   "}Esc back`,
        terminal.cols,
      ),
      "",
      centerLine(
        `[Enter/Space] Play${hasSave ? "   [L] Load" : ""}`,
        terminal.cols,
      ),
    ]);
  }

  function drawDeath() {
    renderScreen(terminal, [
      centerLine("GAME OVER", terminal.cols),
      centerLine(`Score: ${score}`, terminal.cols),
      centerLine(`Lines: ${lines}   Level: ${level}`, terminal.cols),
      "",
      centerLine("[Enter/Space/R] Try again", terminal.cols),
      centerLine("[H] Home", terminal.cols),
    ]);
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
      (nextScore, nextLines, nextLevel) => {
        score = nextScore;
        lines = nextLines;
        level = nextLevel;
        mode = "dead";
        game = null;
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

  const keyListener = terminal.onKey(({ domEvent }) => {
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
      keyListener.dispose();
      resizeListener.dispose();
    },
  };
}
