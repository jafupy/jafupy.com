import type { Cell, Point, Room } from "./types";
import { randomInt, samePoint } from "./grid";

export function placePushVaults(
  board: Cell[][],
  player: Point,
  random: () => number,
  rooms: Room[],
  count: number,
) {
  const height = board.length;
  const width = board[0]?.length ?? 0;
  const reserved = new Set<string>();
  let screws = 0;

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  const reserveRect = (x: number, y: number, rectWidth: number, rectHeight: number) => {
    for (let cy = y; cy < y + rectHeight; cy++) {
      for (let cx = x; cx < x + rectWidth; cx++) reserved.add(`${cx},${cy}`);
    }
  };

  const canUseRect = (x: number, y: number, rectWidth: number, rectHeight: number) => {
    if (x < 2 || y < 2 || x + rectWidth >= width - 2 || y + rectHeight >= height - 2)
      return false;

    for (let cy = y - 1; cy <= y + rectHeight; cy++) {
      for (let cx = x - 1; cx <= x + rectWidth; cx++) {
        if (board[cy]?.[cx] !== " " || reserved.has(`${cx},${cy}`)) return false;
      }
    }

    return true;
  };

  const drawVault = (
    x: number,
    y: number,
    rectWidth: number,
    rectHeight: number,
    entrance: Point,
    rockTarget: Point,
    screw: Point,
  ) => {
    for (let cy = y; cy < y + rectHeight; cy++) {
      for (let cx = x; cx < x + rectWidth; cx++) {
        const border =
          cx === x ||
          cy === y ||
          cx === x + rectWidth - 1 ||
          cy === y + rectHeight - 1;
        board[cy][cx] = border ? "#" : " ";
      }
    }

    board[entrance.y][entrance.x] = "O";
    board[rockTarget.y][rockTarget.x] = " ";
    board[screw.y][screw.x] = "*";
    reserveRect(x - 1, y - 1, rectWidth + 2, rectHeight + 2);
    screws++;
  };

  const candidates = rooms
    .filter((room) => room.width >= 12 && room.height >= 10)
    .toSorted((a, b) => b.width * b.height - a.width * a.height);

  for (const room of candidates) {
    if (screws >= count) break;
    const rectWidth = Math.min(randomInt(random, 7, 11), room.width - 4);
    const rectHeight = Math.min(randomInt(random, 6, 9), room.height - 4);
    const x = randomInt(random, room.x + 2, room.x + room.width - rectWidth - 2);
    const y = randomInt(random, room.y + 2, room.y + room.height - rectHeight - 2);
    if (!canUseRect(x, y, rectWidth, rectHeight)) continue;

    const options = directions
      .map((direction) => {
        if (direction.dx === 1) {
          const entrance = { x, y: y + Math.floor(rectHeight / 2) };
          return {
            entrance,
            stand: { x: x - 1, y: entrance.y },
            rockTarget: { x: x + 1, y: entrance.y },
            screw: { x: x + rectWidth - 2, y: y + 1 },
          };
        }
        if (direction.dx === -1) {
          const entrance = { x: x + rectWidth - 1, y: y + Math.floor(rectHeight / 2) };
          return {
            entrance,
            stand: { x: x + rectWidth, y: entrance.y },
            rockTarget: { x: x + rectWidth - 2, y: entrance.y },
            screw: { x: x + 1, y: y + 1 },
          };
        }
        if (direction.dy === 1) {
          const entrance = { x: x + Math.floor(rectWidth / 2), y };
          return {
            entrance,
            stand: { x: entrance.x, y: y - 1 },
            rockTarget: { x: entrance.x, y: y + 1 },
            screw: { x: x + 1, y: y + rectHeight - 2 },
          };
        }

        const entrance = { x: x + Math.floor(rectWidth / 2), y: y + rectHeight - 1 };
        return {
          entrance,
          stand: { x: entrance.x, y: y + rectHeight },
          rockTarget: { x: entrance.x, y: y + rectHeight - 2 },
          screw: { x: x + 1, y: y + 1 },
        };
      })
      .filter(
        ({ stand, entrance, rockTarget, screw }) =>
          board[stand.y]?.[stand.x] === " " &&
          board[rockTarget.y]?.[rockTarget.x] === " " &&
          !samePoint(player, stand) &&
          !samePoint(player, entrance) &&
          !samePoint(player, rockTarget) &&
          !samePoint(player, screw),
      );

    if (options.length === 0) continue;
    const option = options[randomInt(random, 0, options.length - 1)];
    drawVault(
      x,
      y,
      rectWidth,
      rectHeight,
      option.entrance,
      option.rockTarget,
      option.screw,
    );
  }

  return { reserved, screws };
}
