<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import "@fontsource-variable/jetbrains-mono";
  import "@xterm/xterm/css/xterm.css";
  import { centerLine, renderScreen } from "./terminal";

  type EmulatorApp = { stop: () => void };
  type EmulatorName = "snake" | "tetris";
  type TerminalLike = import("@xterm/xterm").Terminal;
  const RESET = "\x1b[0m";
  const BRIGHT = "\x1b[97m";
  const TEXT = "\x1b[38;2;166;172;205m";
  const MUTED = "\x1b[38;2;118;124;147m";

  let container: HTMLDivElement;
  let terminal: TerminalLike | null = null;
  let app: EmulatorApp | null = null;
  let fitResize: (() => void) | null = null;
  let menuKeyListener: { dispose: () => void } | null = null;
  let resizeListener: { dispose: () => void } | null = null;
  let selection: EmulatorName = "snake";
  let showBackButton = false;

  function getInitialSelection(): EmulatorName | null {
    const params = new URLSearchParams(window.location.search);
    if (params.has("snake")) return "snake";
    if (params.has("tetris")) return "tetris";
    return null;
  }

  function setQuery(selection: EmulatorName) {
    const url = new URL(window.location.href);
    url.search = `?${selection}`;
    window.history.replaceState({}, "", url);
  }

  function clearQuery() {
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url);
  }

  function renderMenu() {
    if (!terminal || app) return;

    const optionLabelWidth = 8;
    const optionBlockWidth = 24;
    const optionLeft = Math.max(
      Math.floor((terminal.cols - optionBlockWidth) / 2) - 2,
      0,
    );
    const renderOption = (
      name: string,
      hotkey: string,
      isSelected: boolean,
    ) => {
      const selector = isSelected ? `${BRIGHT}>${RESET}` : " ";
      const prefix = `${selector} ${TEXT}${name.padEnd(optionLabelWidth)}${RESET}`;
      const suffix = isSelected
        ? `${BRIGHT}[${hotkey}]${RESET}`
        : `${MUTED}[${hotkey}]${RESET}`;
      return `${" ".repeat(optionLeft)}${prefix}  ${suffix}`;
    };

    const lines = [
      centerLine(`${TEXT}EMULATOR${RESET}`, terminal.cols),
      centerLine(`${MUTED}jafupy.com${RESET}`, terminal.cols),
      "",
      renderOption("Snake", "S", selection === "snake"),
      renderOption("Tetris", "T", selection === "tetris"),
      "",
      centerLine(
        `${MUTED}[Arrow Keys] Select   [Enter] Launch${RESET}`,
        terminal.cols,
      ),
    ];

    renderScreen(terminal, lines, { hideCursor: true });
  }

  function attachMenuKeys() {
    if (!terminal) return;

    menuKeyListener?.dispose();
    menuKeyListener = terminal.onKey(async ({ domEvent }) => {
      const key = domEvent.key.toLowerCase();

      if (key === "arrowup" || key === "arrowleft") {
        selection = "snake";
        renderMenu();
        return;
      }

      if (key === "arrowdown" || key === "arrowright") {
        selection = "tetris";
        renderMenu();
        return;
      }

      if (key === "s") {
        selection = "snake";
        renderMenu();
        return;
      }

      if (key === "t") {
        selection = "tetris";
        renderMenu();
        return;
      }

      if (key === "enter" || key === " ") {
        domEvent.preventDefault();
        menuKeyListener?.dispose();
        menuKeyListener = null;
        await launch(selection);
      }
    });
  }

  function exitToRoot() {
    if (!terminal) return;
    app?.stop();
    app = null;
    showBackButton = false;
    clearQuery();
    terminal.clear();
    renderMenu();
    attachMenuKeys();
    terminal.focus();
  }

  async function launch(selection: EmulatorName) {
    if (!terminal || app) return;

    setQuery(selection);
    terminal.clear();

    if (selection === "snake") {
      const { startSnakeApp } = await import("./snake/snake.ts");
      app = startSnakeApp(terminal, {
        directStart: true,
        paused: true,
        onExit: exitToRoot,
        onStateChange: (mode) => {
          showBackButton = mode === "dead";
        },
      });
      return;
    }

    const { startTetrisApp } = await import("./tetris/tetris.ts");
    app = startTetrisApp(terminal, {
      directStart: true,
      paused: true,
      onExit: exitToRoot,
      onStateChange: (mode) => {
        showBackButton = mode === "dead";
      },
    });
  }

  onMount(async () => {
    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon } = await import("@xterm/addon-fit");

    terminal = new Terminal({
      fontFamily: '"JetBrains Mono Variable", "JetBrains Mono", monospace',
      fontSize: 14,
      allowTransparency: false,
      theme: {
        background: "#1b1e28",
        foreground: "#a6accd",
        cursor: "#a6accd",
        black: "#303340",
        red: "#d0679d",
        green: "#5de4c7",
        yellow: "#fffac2",
        blue: "#89ddff",
        magenta: "#c792ea",
        cyan: "#add7ff",
        white: "#e4f0fb",
        brightBlack: "#4f5570",
        brightRed: "#d0679d",
        brightGreen: "#5de4c7",
        brightYellow: "#fffac2",
        brightBlue: "#89ddff",
        brightMagenta: "#c792ea",
        brightCyan: "#add7ff",
        brightWhite: "#ffffff",
      },
    });

    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(container);
    fitResize = () => fit.fit();
    window.addEventListener("resize", fitResize);

    if ("fonts" in document) {
      await document.fonts.ready;
    }

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    fit.fit();
    terminal.focus();

    const initialSelection = getInitialSelection();
    if (initialSelection) {
      selection = initialSelection;
      await launch(initialSelection);
      return;
    }

    renderMenu();
    attachMenuKeys();

    resizeListener = terminal.onResize(() => {
      if (!app) renderMenu();
    });
  });

  onDestroy(() => {
    app?.stop();
    menuKeyListener?.dispose();
    resizeListener?.dispose();
    terminal?.write("\x1b[?25h");
    terminal?.dispose();
    if (fitResize) window.removeEventListener("resize", fitResize);
  });
</script>

<div class="emulator-shell h-full w-full">
  {#if showBackButton}
    <button class="terminal-back" type="button" onclick={exitToRoot}
      >back</button
    >
  {/if}
  <div bind:this={container} class="emulator-terminal h-full w-full" />
</div>

<style>
  .emulator-shell {
    position: relative;
    height: 100%;
    width: 100%;
  }

  .terminal-back {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 5;
    border: 1px solid rgb(166 172 205 / 0.18);
    background: rgb(27 30 40 / 0.82);
    color: rgb(166 172 205);
    padding: 2px 8px;
    font-family: "JetBrains Mono Variable", "JetBrains Mono", monospace;
    font-size: 12px;
    line-height: 1.4;
    text-transform: lowercase;
    cursor: pointer;
    transition:
      color 120ms ease,
      border-color 120ms ease,
      background-color 120ms ease;
  }

  .terminal-back:hover {
    color: rgb(208 103 157);
    border-color: rgb(208 103 157 / 0.32);
    background: rgb(27 30 40 / 0.92);
  }

  .emulator-terminal :global(.xterm),
  .emulator-terminal :global(.xterm-scrollable-element) {
    height: 100%;
  }

  .emulator-terminal :global(.xterm-viewport) {
    overflow: hidden;
  }

  .emulator-terminal :global(.xterm-screen canvas) {
    image-rendering: pixelated;
  }
</style>
