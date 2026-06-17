import type { Terminal } from "@xterm/xterm";
import { renderScreen } from "../terminal";
import { buildDeathScreen, buildMenuScreen } from "./display";
import { startGame } from "./game";
import { SAVE_KEY, type Mode, type RobboTerminal } from "./types";

export function startRobboApp(
  terminal: RobboTerminal,
  options?: {
    directStart?: boolean;
    paused?: boolean;
    onExit?: () => void;
    onStateChange?: (mode: Mode) => void;
  },
) {
  let mode: Mode = "menu";
  let moves = 0;
  let screwsLeft = 0;
  let level = 1;
  let game: ReturnType<typeof startGame> | null = null;

  function drawMenu() {
    renderScreen(terminal, buildMenuScreen(terminal));
  }

  function drawDeath() {
    renderScreen(terminal, buildDeathScreen(terminal, level, moves, screwsLeft));
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
      (nextLevel, nextMoves, nextScrewsLeft) => {
        level = nextLevel;
        moves = nextMoves;
        screwsLeft = nextScrewsLeft;
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

    if (mode === "dead" && (key === "h" || key === "escape")) {
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

