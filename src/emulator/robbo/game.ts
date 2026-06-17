import type { Terminal } from "@xterm/xterm";
import { ACCENT, HUD, RESET, getDims, renderMixedCell } from "./display";
import { getNeighbors, inBounds, keyOf, samePoint } from "./grid";
import { generateLevel } from "./level";
import { SAVE_KEY, type Cell, type Point, type SaveState } from "./types";

export function startGame(
  terminal: Terminal,
  onDeath: (level: number, moves: number, screwsLeft: number) => void,
  options?: { paused?: boolean; onExit?: () => void },
) {
  let dims = getDims(terminal);
  let state = generateLevel(1, dims, options?.paused ?? false);
  let path: Point[] = [];
  let prevLines: string[] = [];
  let loopHandle: ReturnType<typeof setTimeout>;
  let running = true;
  let blinkState = true;

  terminal.write("\x1b[?25l");

  function autosave() {
    try {
      localStorage.setItem(SAVE_KEY, String(state.level));
    } catch {
      // Saving is opportunistic; gameplay should continue if storage is unavailable.
    }
  }

  function isEnemyAt(point: Point) {
    return state.enemies.some((enemy) => samePoint(enemy, point));
  }

  function canWalk(cell: Cell) {
    return cell === " " || cell === "*" || cell === "x" || cell === "X" || cell === "P";
  }

  function cellAt(x: number, y: number): Cell {
    if (samePoint(state.player, { x, y })) return blinkState ? "@" : " ";
    if (state.enemies.some((enemy) => enemy.x === x && enemy.y === y))
      return "E";
    return state.board[y]?.[x] ?? ".";
  }

  function refreshDims() {
    const nextDims = getDims(terminal);
    if (
      nextDims.width === dims.width &&
      nextDims.height === dims.height &&
      nextDims.padX === dims.padX &&
      nextDims.padTop === dims.padTop
    )
      return;
    dims = nextDims;
    state = generateLevel(state.level, dims, state.paused);
    path = [];
    prevLines = [];
    autosave();
  }

  function buildFrame(): string[] {
    refreshDims();
    const lines: string[] = [];
    const blankLine = " ".repeat(terminal.cols);
    for (let i = 0; i < dims.padTop; i++) lines.push(blankLine);
    const leftPad = " ".repeat(dims.padX);

    for (let ty = 0; ty < dims.boardRows; ty++) {
      let line = leftPad;
      const topY = ty * 2;
      const bottomY = topY + 1;

      for (let x = 0; x < dims.width; x++) {
        line += renderMixedCell(
          topY < dims.height ? cellAt(x, topY) : " ",
          bottomY < dims.height ? cellAt(x, bottomY) : " ",
        );
      }

      lines.push(line);
    }

    const exitState = state.screwsLeft === 0 ? "open" : "sealed";
    const pathState = path.length > 0 ? `  Path: ${path.length}` : "";
    lines.push(
      `${leftPad}${HUD}Level: ${ACCENT}${state.level}${HUD}  Screws: ${ACCENT}${state.screwsLeft}${HUD}  Moves: ${state.moves}  Capsule: ${exitState}${pathState}  Click/WASD  [Space] Pause [F] Save [Esc] Back${RESET}`,
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

  function die() {
    stop();
    onDeath(state.level, state.moves, state.screwsLeft);
  }

  function nextLevel() {
    state = generateLevel(state.level + 1, dims, false);
    path = [];
    prevLines = [];
    autosave();
    draw();
  }

  function movePlayer(dx: number, dy: number, fromPath = false) {
    if (state.paused) return false;

    const next = { x: state.player.x + dx, y: state.player.y + dy };
    if (isEnemyAt(next)) {
      die();
      return false;
    }

    const target = state.board[next.y]?.[next.x] ?? "#";
    if (target === "O") {
      if (fromPath) return false;
      const pushed = { x: next.x + dx, y: next.y + dy };
      const pushedCell = state.board[pushed.y]?.[pushed.x] ?? "#";
      if (pushedCell !== " " || isEnemyAt(pushed)) return false;
      state.board[pushed.y][pushed.x] = "O";
      state.board[next.y][next.x] = " ";
    } else if (!canWalk(target)) return false;

    state.player = next;
    state.moves++;

    if (target === "*") {
      state.board[next.y][next.x] = " ";
      state.screwsLeft--;
    }

    if (target === "P") {
      const exit = portalExit(next);
      if (exit && !isEnemyAt(exit)) state.player = { ...exit };
    }

    if (target === "X" && state.screwsLeft === 0) {
      nextLevel();
      return true;
    }

    autosave();
    draw();
    return true;
  }

  function canPathThrough(point: Point) {
    if (!inBounds(point, state.width, state.height)) return false;
    if (isEnemyAt(point)) return false;
    const cell = state.board[point.y][point.x];
    return canWalk(cell);
  }

  function portalExit(point: Point) {
    for (const portal of state.portals) {
      if (samePoint(point, portal.a)) return portal.b;
      if (samePoint(point, portal.b)) return portal.a;
    }
    return null;
  }

  function findPath(target: Point) {
    if (!canPathThrough(target)) return [];
    const finalTarget = portalExit(target) ?? target;
    const queue = [state.player];
    const previous = new Map<string, string | null>([[keyOf(state.player), null]]);
    const actions = new Map<string, Point>();
    const points = new Map<string, Point>([[keyOf(state.player), state.player]]);

    for (let i = 0; i < queue.length; i++) {
      const point = queue[i];
      if (samePoint(point, finalTarget)) break;

      for (const next of getNeighbors(point)) {
        if (!canPathThrough(next)) continue;
        const landing = portalExit(next) ?? next;
        const key = keyOf(landing);
        if (previous.has(key)) continue;
        previous.set(key, keyOf(point));
        actions.set(key, next);
        points.set(key, landing);
        queue.push(landing);
      }
    }

    const targetKey = keyOf(finalTarget);
    if (!previous.has(targetKey)) return [];

    const route: Point[] = [];
    let cursor: string | null = targetKey;
    while (cursor) {
      const point = actions.get(cursor) ?? points.get(cursor);
      if (point) route.push(point);
      cursor = previous.get(cursor) ?? null;
    }

    route.reverse();
    route.shift();
    return route;
  }

  function moveEnemies() {
    const occupied = new Set(
      state.enemies.map((enemy) => `${enemy.x},${enemy.y}`),
    );

    for (const enemy of state.enemies) {
      occupied.delete(`${enemy.x},${enemy.y}`);

      let next = { x: enemy.x + enemy.dx, y: enemy.y + enemy.dy };
      const blocked =
        !canWalk(state.board[next.y]?.[next.x] ?? "#") ||
        state.board[next.y]?.[next.x] === "X" ||
        state.board[next.y]?.[next.x] === "P" ||
        occupied.has(`${next.x},${next.y}`);

      if (blocked) {
        enemy.dx *= -1;
        enemy.dy *= -1;
        next = { x: enemy.x + enemy.dx, y: enemy.y + enemy.dy };
      }

      const nextCell = state.board[next.y]?.[next.x] ?? "#";
      if (
        canWalk(nextCell) &&
        nextCell !== "X" &&
        nextCell !== "P" &&
        !occupied.has(`${next.x},${next.y}`)
      ) {
        enemy.x = next.x;
        enemy.y = next.y;
      }

      occupied.add(`${enemy.x},${enemy.y}`);
      if (samePoint(enemy, state.player)) {
        die();
        return false;
      }
    }

    return true;
  }

  function save() {
    autosave();
  }

  function load(): boolean {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const legacySave = JSON.parse(raw) as Partial<SaveState>;
      const rawLevel = Number.isFinite(Number(raw))
        ? Number(raw)
        : legacySave.level;
      const savedLevel =
        typeof rawLevel === "number" && Number.isFinite(rawLevel)
          ? Math.max(1, Math.floor(rawLevel))
          : 1;
      state = generateLevel(savedLevel, dims, state.paused);
      path = [];
      prevLines = [];
      autosave();
      draw();
      return true;
    } catch {
      return false;
    }
  }

  function clickToCell(event: MouseEvent): Point | null {
    const screen = terminal.element?.querySelector(".xterm-screen");
    if (!screen) return null;

    const rect = screen.getBoundingClientRect();
    const cellWidth = rect.width / terminal.cols;
    const cellHeight = rect.height / terminal.rows;
    const termX = Math.floor((event.clientX - rect.left) / cellWidth);
    const termY = Math.floor((event.clientY - rect.top) / cellHeight);
    const yInCell = event.clientY - rect.top - termY * cellHeight;
    const half = yInCell >= cellHeight / 2 ? 1 : 0;

    const x = termX - dims.padX;
    const y = (termY - dims.padTop) * 2 + half;
    if (!inBounds({ x, y }, state.width, state.height)) return null;
    return { x, y };
  }

  const mouseTarget = terminal.element;
  const mouseListener = (event: MouseEvent) => {
    if (event.button !== 0) return;
    const target = clickToCell(event);
    if (!target) return;
    event.preventDefault();
    terminal.focus();
    state.paused = false;
    autosave();
    path = findPath(target);
    draw();
  };
  mouseTarget?.addEventListener("mousedown", mouseListener);

  const keyListener = terminal.onKey(({ domEvent }) => {
    const key = domEvent.key.toLowerCase();

    if (key === "arrowleft" || key === "a") {
      path = [];
      movePlayer(-1, 0);
    }
    if (key === "arrowright" || key === "d") {
      path = [];
      movePlayer(1, 0);
    }
    if (key === "arrowup" || key === "w") {
      path = [];
      movePlayer(0, -1);
    }
    if (key === "arrowdown" || key === "s") {
      path = [];
      movePlayer(0, 1);
    }
    if (key === " ") {
      domEvent.preventDefault();
      state.paused = !state.paused;
      autosave();
      draw();
    }
    if (key === "escape") {
      stop();
      options?.onExit?.();
    }
    if (key === "f" || (domEvent.ctrlKey && key === "s")) {
      domEvent.preventDefault();
      save();
      draw();
    }
    if (key === "l") load();
  });

  function followPath() {
    if (path.length === 0 || state.paused) return;
    const next = path.shift()!;
    const dx = next.x - state.player.x;
    const dy = next.y - state.player.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1 || !movePlayer(dx, dy, true)) {
      path = [];
    }
  }

  function loop() {
    if (!running) return;
    blinkState = state.paused ? !blinkState : true;

    if (!state.paused) {
      state.tick++;
      followPath();
      if (state.tick % 6 === 0 && !moveEnemies()) return;
      if (state.tick % 6 === 0) autosave();
    }

    draw();
    loopHandle = setTimeout(loop, 90);
  }

  function stop() {
    running = false;
    clearTimeout(loopHandle);
    keyListener.dispose();
    mouseTarget?.removeEventListener("mousedown", mouseListener);
    terminal.write("\x1b[?25h");
  }

  loop();
  autosave();

  return { stop, redraw: draw, load };
}
