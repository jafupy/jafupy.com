export type ScreenTerminal = {
  cols: number;
  rows: number;
  write: (data: string) => void;
};

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

export function visibleLength(text: string) {
  return text.replace(ANSI_PATTERN, "").length;
}

export function centerLine(text: string, width: number) {
  const length = visibleLength(text);
  if (length >= width) return text;

  const left = Math.floor((width - length) / 2);
  return `${" ".repeat(left)}${text}${" ".repeat(width - length - left)}`;
}

export function padAnsi(text: string, width: number) {
  const length = visibleLength(text);
  return length >= width ? text : text + " ".repeat(width - length);
}

export function renderScreen(
  terminal: ScreenTerminal,
  lines: string[],
  options: { hideCursor?: boolean } = {},
) {
  const width = Math.max(terminal.cols, 1);
  const height = Math.max(terminal.rows, 1);
  const topPad = Math.max(Math.floor((height - lines.length) / 2), 0);
  const frame = Array.from({ length: height }, () => " ".repeat(width));

  for (let i = 0; i < lines.length && i + topPad < height; i++) {
    frame[i + topPad] = padAnsi(lines[i], width);
  }

  terminal.write(
    `\x1b[2J\x1b[H${options.hideCursor ? "\x1b[?25l" : ""}${frame.join("\r\n")}`,
  );
}

