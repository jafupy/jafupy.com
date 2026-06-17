import type { Cell, Point, Rect, Room } from "./types";
import { centerOf, getNeighbors, randomInt } from "./grid";

export function buildBoard(width: number, height: number, random: () => number) {
  const board: Cell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "."),
  );
  const rooms: Room[] = [];

  const carveRoom = (rect: Rect) => {
    for (let y = rect.y; y < rect.y + rect.height; y++) {
      for (let x = rect.x; x < rect.x + rect.width; x++) {
        if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) continue;
        const border =
          x === rect.x ||
          y === rect.y ||
          x === rect.x + rect.width - 1 ||
          y === rect.y + rect.height - 1;
        board[y][x] = border ? "#" : " ";
      }
    }
  };

  const carveFloor = (x: number, y: number) => {
    if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return;
    board[y][x] = " ";
    for (const neighbor of getNeighbors({ x, y })) {
      if (
        neighbor.x > 0 &&
        neighbor.x < width - 1 &&
        neighbor.y > 0 &&
        neighbor.y < height - 1 &&
        board[neighbor.y][neighbor.x] === "."
      ) {
        board[neighbor.y][neighbor.x] = "#";
      }
    }
  };

  const carveCorridor = (from: Point, to: Point) => {
    const bend =
      random() < 0.5
        ? { x: to.x, y: from.y }
        : { x: from.x, y: to.y };
    const points = [from, bend, to];

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const xStep = Math.sign(b.x - a.x);
      const yStep = Math.sign(b.y - a.y);
      let x = a.x;
      let y = a.y;

      while (x !== b.x || y !== b.y) {
        carveFloor(x, y);
        if (x !== b.x) x += xStep;
        else if (y !== b.y) y += yStep;
      }
      carveFloor(b.x, b.y);
    }
  };

  const doorwayBetween = (from: Room, to: Rect, direction: Point) => {
    if (direction.x !== 0) {
      const minY = Math.max(from.y + 2, to.y + 2);
      const maxY = Math.min(from.y + from.height - 3, to.y + to.height - 3);
      const y =
        minY <= maxY
          ? randomInt(random, minY, maxY)
          : Math.floor((from.center.y + centerOf(to).y) / 2);

      return {
        from: { x: direction.x > 0 ? from.x + from.width - 1 : from.x, y },
        to: { x: direction.x > 0 ? to.x : to.x + to.width - 1, y },
      };
    }

    const minX = Math.max(from.x + 2, to.x + 2);
    const maxX = Math.min(from.x + from.width - 3, to.x + to.width - 3);
    const x =
      minX <= maxX
        ? randomInt(random, minX, maxX)
        : Math.floor((from.center.x + centerOf(to).x) / 2);

    return {
      from: { x, y: direction.y > 0 ? from.y + from.height - 1 : from.y },
      to: { x, y: direction.y > 0 ? to.y : to.y + to.height - 1 },
    };
  };

  const overlaps = (candidate: Rect) =>
    rooms.some(
      (room) =>
        candidate.x < room.x + room.width + 1 &&
        candidate.x + candidate.width + 1 > room.x &&
        candidate.y < room.y + room.height + 1 &&
        candidate.y + candidate.height + 1 > room.y,
    );

  const addRoom = (rect: Rect) => {
    const room: Room = { ...rect, center: centerOf(rect), role: "connector" };
    rooms.push(room);
    carveRoom(room);
    return room;
  };

  const roomTarget = Math.min(
    Math.max(7, Math.floor((width * height) / 850)),
    13,
  );
  const firstWidth = randomInt(random, 10, 18);
  const firstHeight = randomInt(random, 7, 12);
  const firstRoom = addRoom({
    width: firstWidth,
    height: firstHeight,
    x: Math.floor(width / 2 - firstWidth / 2),
    y: Math.floor(height / 2 - firstHeight / 2),
  });

  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  for (let attempt = 0; rooms.length < roomTarget && attempt < 500; attempt++) {
    const anchor = rooms[randomInt(random, 0, rooms.length - 1)] ?? firstRoom;
    const direction = directions[randomInt(random, 0, directions.length - 1)];
    const roomWidth = randomInt(random, 9, 20);
    const roomHeight = randomInt(random, 7, 14);
    const gap = randomInt(random, 2, 6);
    const offset = direction.x === 0
      ? randomInt(random, -Math.floor(anchor.width / 2), Math.floor(anchor.width / 2))
      : randomInt(random, -Math.floor(anchor.height / 2), Math.floor(anchor.height / 2));
    const candidate = {
      width: roomWidth,
      height: roomHeight,
      x:
        direction.x > 0
          ? anchor.x + anchor.width + gap
          : direction.x < 0
            ? anchor.x - roomWidth - gap
            : anchor.center.x - Math.floor(roomWidth / 2) + offset,
      y:
        direction.y > 0
          ? anchor.y + anchor.height + gap
          : direction.y < 0
            ? anchor.y - roomHeight - gap
            : anchor.center.y - Math.floor(roomHeight / 2) + offset,
    };

    if (
      candidate.x < 2 ||
      candidate.y < 2 ||
      candidate.x + candidate.width >= width - 2 ||
      candidate.y + candidate.height >= height - 2 ||
      overlaps(candidate)
    ) {
      continue;
    }

    const room = addRoom(candidate);
    const doorway = doorwayBetween(anchor, room, direction);
    carveCorridor(doorway.from, doorway.to);
  }

  return { board, rooms };
}

