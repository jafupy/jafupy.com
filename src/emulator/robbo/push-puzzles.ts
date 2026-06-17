import type { Cell, Point, Room } from "./types";
import { keyOf, randomInt, samePoint } from "./grid";

export function placePushPuzzles(
  board: Cell[][],
  player: Point,
  random: () => number,
  rooms: Room[],
  count: number,
) {
  const reserved = new Set<string>();
  let screws = 0;

  const reserveRect = (x: number, y: number, rectWidth: number, rectHeight: number) => {
    for (let cy = y - 1; cy <= y + rectHeight; cy++) {
      for (let cx = x - 1; cx <= x + rectWidth; cx++) reserved.add(`${cx},${cy}`);
    }
  };

  const canUseRect = (x: number, y: number, rectWidth: number, rectHeight: number) => {
    for (let cy = y - 1; cy <= y + rectHeight; cy++) {
      for (let cx = x - 1; cx <= x + rectWidth; cx++) {
        if (reserved.has(`${cx},${cy}`)) return false;
        const cell = board[cy]?.[cx];
        if (cell !== " ") return false;
        if (samePoint(player, { x: cx, y: cy })) return false;
      }
    }

    return true;
  };

  const drawHorizontalPuzzle = (
    x: number,
    y: number,
    rectWidth: number,
    rectHeight: number,
  ) => {
    const upperY = y + 2;
    const lowerY = y + rectHeight - 3;
    const farX = x + rectWidth - 2;

    for (let cy = y; cy < y + rectHeight; cy++) {
      for (let cx = x; cx < x + rectWidth; cx++) board[cy][cx] = "#";
    }

    for (let cx = x + 1; cx <= farX; cx++) {
      board[upperY][cx] = " ";
      board[lowerY][cx] = " ";
    }
    for (let cy = upperY; cy <= lowerY; cy++) board[cy][farX] = " ";

    board[y + 1][farX - 1] = " ";
    board[y + rectHeight - 2][farX - 1] = " ";
    board[upperY][x] = " ";
    board[lowerY][x] = " ";
    board[upperY][x + 1] = "O";
    board[lowerY][x + 1] = "O";
    const screwPoints = [
      { x: farX, y: upperY + 1 },
      { x: farX, y: lowerY - 1 },
    ];
    const placed = new Set<string>();
    for (const screw of screwPoints) {
      placed.add(keyOf(screw));
      board[screw.y][screw.x] = "*";
    }

    return placed.size;
  };

  const candidates = rooms
    .filter((room) => room.width >= 11 && room.height >= 8)
    .toSorted((a, b) => b.width * b.height - a.width * a.height);

  for (const room of candidates) {
    if (screws >= count * 2) break;
    const rectWidth = Math.min(room.width - 4, randomInt(random, 9, 13));
    const rectHeight = Math.min(room.height - 4, randomInt(random, 7, 9));
    if (rectWidth < 9 || rectHeight < 7) continue;

    for (let attempt = 0; attempt < 20; attempt++) {
      const x = randomInt(random, room.x + 2, room.x + room.width - rectWidth - 2);
      const y = randomInt(random, room.y + 2, room.y + room.height - rectHeight - 2);
      if (!canUseRect(x, y, rectWidth, rectHeight)) continue;

      const placedScrews = drawHorizontalPuzzle(x, y, rectWidth, rectHeight);
      reserveRect(x, y, rectWidth, rectHeight);
      screws += placedScrews;
      break;
    }
  }

  return { reserved, screws };
}

