<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { MemoryFileSystem, ZeroPerl } from "@6over3/zeroperl-ts";
  import zeroperlUrl from "@6over3/zeroperl-ts/zeroperl.wasm?url";
  import "@xterm/xterm/css/xterm.css";

  type TerminalLike = import("@xterm/xterm").Terminal;
  type FitAddonLike = import("@xterm/addon-fit").FitAddon;

  type DirectoryLike = {
    createDir(path: string): Promise<void>;
    writeFile(path: string, contents: Uint8Array): Promise<void>;
  };

  type WasmerSdk = {
    init(): Promise<void>;
    Directory: new () => DirectoryLike;
    runWasix(
      module: Uint8Array,
      options: {
        program: string;
        args: string[];
        mount: Record<string, DirectoryLike>;
      },
    ): Promise<{
      wait(): Promise<{
        ok: boolean;
        code: number;
        stdout: string;
        stderr: string;
      }>;
    }>;
  };

  type ArchiveFile = {
    path: string;
    contents: Uint8Array;
  };

  type CountResult = {
    elapsed: number;
    files: number | null;
    lines: number | null;
    code: number | null;
  };

  type BenchmarkResult = {
    tally: CountResult;
    cloc: CountResult;
    speedup: number | null;
  };

  const SDK_URL = "https://unpkg.com/@wasmer/sdk@0.10.0/dist/index.mjs";
  const MAX_FILES = 60_000;
  const MAX_UNPACKED_BYTES = 300 * 1024 * 1024;
  const decoder = new TextDecoder();

  let input = "https://github.com/BurntSushi/ripgrep";
  let terminalElement: HTMLDivElement;
  let terminal: TerminalLike | null = null;
  let fitAddon: FitAddonLike | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let sdkPromise: Promise<WasmerSdk> | null = null;
  let running = false;
  let status = "Ready";
  let threads = 1;
  let result: BenchmarkResult | null = null;

  function terminalLine(value = "") {
    terminal?.writeln(value.replaceAll("\n", "\r\n"));
  }

  function terminalWrite(value: string) {
    terminal?.write(value.replaceAll("\n", "\r\n"));
  }

  function resetTerminal() {
    terminal?.reset();
    terminal?.write("\x1b[?25l");
  }

  function decodeOutput(value: string | Uint8Array) {
    return typeof value === "string" ? value : decoder.decode(value);
  }

  function normaliseRepository(value: string) {
    const trimmed = value.trim();
    const shorthand = trimmed.match(
      /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/,
    );
    if (shorthand) return `${shorthand[1]}/${shorthand[2]}`;

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error("Enter a GitHub URL or owner/repo.");
    }

    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
      throw new Error("Only public GitHub repositories are supported.");
    }

    const [owner, rawRepository] = parsed.pathname.split("/").filter(Boolean);
    const repository = rawRepository?.replace(/\.git$/, "");
    if (!owner || !repository) {
      throw new Error("That GitHub repository URL is incomplete.");
    }
    return `${owner}/${repository}`;
  }

  function readString(bytes: Uint8Array, start: number, length: number) {
    const section = bytes.subarray(start, start + length);
    const end = section.indexOf(0);
    return decoder.decode(end === -1 ? section : section.subarray(0, end));
  }

  function readOctal(bytes: Uint8Array, start: number, length: number) {
    const value = readString(bytes, start, length).trim();
    return value ? Number.parseInt(value, 8) : 0;
  }

  function parsePax(contents: Uint8Array) {
    const values = new Map<string, string>();
    const text = decoder.decode(contents);
    let offset = 0;

    while (offset < text.length) {
      const space = text.indexOf(" ", offset);
      if (space === -1) break;
      const length = Number.parseInt(text.slice(offset, space), 10);
      if (!Number.isFinite(length) || length <= 0) break;
      const record = text.slice(space + 1, offset + length - 1);
      const equals = record.indexOf("=");
      if (equals !== -1) {
        values.set(record.slice(0, equals), record.slice(equals + 1));
      }
      offset += length;
    }

    return values;
  }

  function stripArchiveRoot(path: string) {
    const normalised = path.replace(/^\.\//, "");
    const slash = normalised.indexOf("/");
    if (slash === -1) return "";
    return normalised.slice(slash + 1).replace(/^\/+/, "");
  }

  async function unpackTarGz(compressed: Uint8Array): Promise<ArchiveFile[]> {
    if (!("DecompressionStream" in window)) {
      throw new Error("This browser cannot unpack gzip archives.");
    }

    const stream = new Blob([compressed.slice().buffer])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    const tar = new Uint8Array(await new Response(stream).arrayBuffer());
    const files: ArchiveFile[] = [];
    let totalBytes = 0;
    let offset = 0;
    let paxPath: string | null = null;
    let longPath: string | null = null;

    while (offset + 512 <= tar.length) {
      const header = tar.subarray(offset, offset + 512);
      if (header.every((byte) => byte === 0)) break;

      const name = readString(header, 0, 100);
      const prefix = readString(header, 345, 155);
      const headerPath = prefix ? `${prefix}/${name}` : name;
      const size = readOctal(header, 124, 12);
      const type = String.fromCharCode(header[156] || 48);
      const dataStart = offset + 512;
      const dataEnd = dataStart + size;
      if (dataEnd > tar.length) {
        throw new Error("GitHub returned a truncated archive.");
      }
      const contents = tar.subarray(dataStart, dataEnd);

      if (type === "x") {
        paxPath = parsePax(contents).get("path") ?? null;
      } else if (type === "L") {
        longPath = decoder.decode(contents).replace(/\0+$/, "");
      } else {
        const archivePath = paxPath ?? longPath ?? headerPath;
        paxPath = null;
        longPath = null;

        if (type === "0" || type === "\0") {
          const path = stripArchiveRoot(archivePath);
          if (path) {
            totalBytes += contents.byteLength;
            if (files.length >= MAX_FILES) {
              throw new Error(
                `Repository contains more than ${MAX_FILES.toLocaleString()} files.`,
              );
            }
            if (totalBytes > MAX_UNPACKED_BYTES) {
              throw new Error("Repository expands beyond the 300 MB browser limit.");
            }
            files.push({ path, contents: contents.slice() });
          }
        }
      }

      offset = dataStart + Math.ceil(size / 512) * 512;
    }

    return files;
  }

  async function writeWasmerArchive(
    directory: DirectoryLike,
    files: ArchiveFile[],
  ) {
    const directories = new Set<string>();
    for (const file of files) {
      const parts = file.path.split("/");
      parts.pop();
      let current = "";
      for (const part of parts) {
        current += `/${part}`;
        directories.add(current);
      }
    }

    for (const path of [...directories].sort(
      (left, right) => left.split("/").length - right.split("/").length,
    )) {
      await directory.createDir(path);
    }

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      await directory.writeFile(`/${file.path}`, file.contents);
      if (index % 250 === 0) {
        status = `Loading ${index.toLocaleString()} / ${files.length.toLocaleString()} files`;
      }
    }
  }

  function createPerlFileSystem(files: ArchiveFile[], clocScript: Uint8Array) {
    const fileSystem = new MemoryFileSystem({ "/": "" });
    fileSystem.addFile("/cloc", clocScript);
    fileSystem.addFile("/cloc-runtime/Regexp/Common/.keep", "");
    fileSystem.addFile(
      "/files.txt",
      `${files.map((file) => `/repo/${file.path}`).join("\n")}\n`,
    );

    for (const file of files) {
      fileSystem.addFile(`/repo/${file.path}`, file.contents);
    }

    return fileSystem;
  }

  function parseTallyTotal(output: string): Omit<CountResult, "elapsed"> {
    const total = output
      .split(/\r?\n/)
      .find((line) => /^Total\s+/i.test(line.trim()));
    if (!total) return { files: null, lines: null, code: null };

    const numbers =
      total.match(/[\d,]+/g)?.map((value) => Number(value.replaceAll(",", ""))) ?? [];
    return {
      files: numbers[0] ?? null,
      lines: numbers[1] ?? null,
      code: numbers[4] ?? null,
    };
  }

  function parseClocTotal(output: string): Omit<CountResult, "elapsed"> {
    const total = output
      .split(/\r?\n/)
      .find((line) => /^SUM:\s+/i.test(line.trim()));
    if (!total) return { files: null, lines: null, code: null };

    const numbers =
      total.match(/[\d,]+/g)?.map((value) => Number(value.replaceAll(",", ""))) ?? [];
    const files = numbers[0] ?? null;
    const blank = numbers[1] ?? null;
    const comment = numbers[2] ?? null;
    const code = numbers[3] ?? null;
    const lines =
      blank === null || comment === null || code === null
        ? null
        : blank + comment + code;
    return { files, lines, code };
  }

  function formatDuration(milliseconds: number) {
    return milliseconds < 1_000
      ? `${milliseconds.toFixed(1)} ms`
      : `${(milliseconds / 1_000).toFixed(2)} s`;
  }

  function loadSdk() {
    sdkPromise ??= (async () => {
      const sdk = (await import(/* @vite-ignore */ SDK_URL)) as WasmerSdk;
      await sdk.init();
      return sdk;
    })();
    return sdkPromise;
  }

  async function run() {
    if (running) return;
    running = true;
    result = null;
    resetTerminal();

    try {
      const repository = normaliseRepository(input);
      if (!window.crossOriginIsolated) {
        throw new Error(
          "The page is not cross-origin isolated; WASIX threads cannot start.",
        );
      }

      status = "Downloading repository";
      terminalLine(`\x1b[38;2;118;124;147mrepository\x1b[0m  ${repository}`);
      terminalLine(
        "\x1b[38;2;118;124;147mclone\x1b[0m       downloading the default branch…",
      );

      const [archiveResponse, runtimeResponse, clocResponse, perlResponse, sdk] =
        await Promise.all([
          fetch(`/api/tally/repository?repo=${encodeURIComponent(repository)}`),
          fetch("/api/tally/runtime"),
          fetch("/api/tally/cloc"),
          fetch(zeroperlUrl),
          loadSdk(),
        ]);

      if (!archiveResponse.ok) {
        throw new Error(
          (await archiveResponse.text()) || "Could not download that repository.",
        );
      }
      if (!runtimeResponse.ok) {
        throw new Error(
          (await runtimeResponse.text()) || "The Tally WASIX binary is unavailable.",
        );
      }
      if (!clocResponse.ok) {
        throw new Error((await clocResponse.text()) || "The cloc script is unavailable.");
      }
      if (!perlResponse.ok) {
        throw new Error("The browser Perl runtime is unavailable.");
      }

      const compressed = new Uint8Array(await archiveResponse.arrayBuffer());
      const tallyBinary = new Uint8Array(await runtimeResponse.arrayBuffer());
      const clocScript = new Uint8Array(await clocResponse.arrayBuffer());
      const perlBinary = await perlResponse.arrayBuffer();

      status = "Unpacking repository";
      const files = await unpackTarGz(compressed);
      terminalLine(
        `\x1b[38;2;118;124;147mclone\x1b[0m       ${files.length.toLocaleString()} files ready`,
      );

      const directory = new sdk.Directory();
      await writeWasmerArchive(directory, files);
      const perlFileSystem = createPerlFileSystem(files, clocScript);

      terminalLine();
      terminalLine("\x1b[38;2;93;228;199m$ tally /repo\x1b[0m");
      status = "Running Tally";
      const tallyStarted = performance.now();
      const tallyInstance = await sdk.runWasix(tallyBinary, {
        program: "tally",
        args: ["/repo"],
        mount: { "/repo": directory },
      });
      const tallyOutput = await tallyInstance.wait();
      const tallyElapsed = performance.now() - tallyStarted;

      if (tallyOutput.stdout) terminalWrite(tallyOutput.stdout);
      if (tallyOutput.stderr) {
        terminalWrite(`\x1b[38;2;208;103;157m${tallyOutput.stderr}\x1b[0m`);
      }
      if (!tallyOutput.ok) {
        throw new Error(`Tally exited with code ${tallyOutput.code}.`);
      }
      terminalLine();
      terminalLine(
        `\x1b[38;2;118;124;147mfinished in ${formatDuration(tallyElapsed)}\x1b[0m`,
      );

      terminalLine();
      terminalLine(
        "\x1b[38;2;199;146;234m$ perl /cloc --list-file=/files.txt\x1b[0m",
      );
      status = "Running cloc";
      let clocStdout = "";
      let clocStderr = "";
      const clocStarted = performance.now();
      const perl = await ZeroPerl.create({
        fileSystem: perlFileSystem,
        env: {
          TMPDIR: "/repo",
          TEMP: "/repo",
          TMP: "/repo",
        },
        fetch: () => Promise.resolve(new Response(perlBinary)),
        stdout: (value) => {
          const text = decodeOutput(value);
          clocStdout += text;
          terminalWrite(text);
        },
        stderr: (value) => {
          const text = decodeOutput(value);
          clocStderr += text;
          terminalWrite(`\x1b[38;2;208;103;157m${text}\x1b[0m`);
        },
      });

      try {
        const clocRun = await perl.runFile("/cloc", ["--list-file=/files.txt"]);
        perl.flush();
        if (!clocRun.success) {
          throw new Error(
            clocRun.error || `cloc exited with code ${clocRun.exitCode}.`,
          );
        }
      } finally {
        perl.dispose();
      }
      const clocElapsed = performance.now() - clocStarted;

      if (clocStderr.trim()) {
        terminalLine("\x1b[38;2;118;124;147mcloc wrote to stderr\x1b[0m");
      }
      terminalLine();
      terminalLine(
        `\x1b[38;2;118;124;147mfinished in ${formatDuration(clocElapsed)}\x1b[0m`,
      );

      const tally = {
        ...parseTallyTotal(tallyOutput.stdout),
        elapsed: tallyElapsed,
      };
      const cloc = { ...parseClocTotal(clocStdout), elapsed: clocElapsed };
      result = {
        tally,
        cloc,
        speedup: tallyElapsed > 0 ? clocElapsed / tallyElapsed : null,
      };
      status = "Complete";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      status = "Failed";
      terminalLine();
      terminalLine(`\x1b[38;2;208;103;157merror: ${message}\x1b[0m`);
    } finally {
      running = false;
      fitAddon?.fit();
    }
  }

  onMount(async () => {
    const [{ Terminal }, { FitAddon }] = await Promise.all([
      import("@xterm/xterm"),
      import("@xterm/addon-fit"),
    ]);

    threads = Math.min(window.navigator.hardwareConcurrency || 1, 4);
    terminal = new Terminal({
      fontFamily: '"JetBrains Mono Variable", "JetBrains Mono", monospace',
      fontSize: 13,
      lineHeight: 1.55,
      convertEol: true,
      cursorBlink: false,
      disableStdin: true,
      scrollback: 4_000,
      theme: {
        background: "#17151b",
        foreground: "#d7d3dc",
        cursor: "#17151b",
        selectionBackground: "#4a424f",
        black: "#17151b",
        red: "#d0679d",
        green: "#5de4c7",
        yellow: "#fffac2",
        blue: "#89ddff",
        magenta: "#c792ea",
        cyan: "#add7ff",
        white: "#f2eef4",
        brightBlack: "#77707d",
        brightRed: "#e784b5",
        brightGreen: "#7af0d6",
        brightYellow: "#fffbd2",
        brightBlue: "#a4e5ff",
        brightMagenta: "#d9a8f1",
        brightCyan: "#c8e8ff",
        brightWhite: "#ffffff",
      },
    });

    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalElement);
    terminal.write("\x1b[?25l");
    terminalLine(
      "\x1b[38;2;118;124;147mEnter a public GitHub repository to race Tally against cloc.\x1b[0m",
    );

    resizeObserver = new ResizeObserver(() => fitAddon?.fit());
    resizeObserver.observe(terminalElement);
    await document.fonts.ready;
    fitAddon.fit();
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    terminal?.dispose();
  });
</script>

<div
  class="overflow-hidden rounded-2xl border border-mauve-950/10 bg-mauve-950 shadow-2xl shadow-mauve-950/15 dark:border-mauve-100/10"
>
  <form
    class="flex flex-col gap-2 border-b border-white/10 p-3 sm:flex-row"
    onsubmit={(event) => {
      event.preventDefault();
      void run();
    }}
  >
    <label class="sr-only" for="tally-repository">GitHub repository</label>
    <input
      id="tally-repository"
      class="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-mauve-500 focus:border-old-rose/70 focus:ring-3 focus:ring-old-rose/15"
      bind:value={input}
      disabled={running}
      autocomplete="url"
      spellcheck="false"
      placeholder="github.com/owner/repository"
    />
    <button
      class="inline-flex min-h-11 items-center justify-center rounded-xl bg-old-rose px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
      type="submit"
      disabled={running}
    >
      {running ? "Running…" : "Go"}
    </button>
  </form>

  <div
    class="flex items-center justify-between border-b border-white/10 px-4 py-2 font-mono text-[11px] text-mauve-400"
    aria-live="polite"
  >
    <span>{status}</span>
    <span>WASIX · {threads} {threads === 1 ? "thread" : "threads"}</span>
  </div>

  <div bind:this={terminalElement} class="h-[26rem] w-full p-4"></div>

  {#if result}
    <div
      class="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4"
    >
      <div class="bg-mauve-950 px-4 py-3">
        <div class="font-mono text-xs text-mauve-500">Tally</div>
        <div class="mt-1 text-lg font-semibold text-white">
          {formatDuration(result.tally.elapsed)}
        </div>
      </div>
      <div class="bg-mauve-950 px-4 py-3">
        <div class="font-mono text-xs text-mauve-500">cloc</div>
        <div class="mt-1 text-lg font-semibold text-white">
          {formatDuration(result.cloc.elapsed)}
        </div>
      </div>
      <div class="bg-mauve-950 px-4 py-3">
        <div class="font-mono text-xs text-mauve-500">Speedup</div>
        <div class="mt-1 text-lg font-semibold text-old-rose">
          {result.speedup?.toFixed(1) ?? "—"}×
        </div>
      </div>
      <div class="bg-mauve-950 px-4 py-3">
        <div class="font-mono text-xs text-mauve-500">Code</div>
        <div class="mt-1 text-lg font-semibold text-white">
          {result.tally.code?.toLocaleString() ?? "—"}
        </div>
      </div>
    </div>
  {/if}
</div>
