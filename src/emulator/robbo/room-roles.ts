import type { Cell, Point, Room, RoomRole } from "./types";
import { randomInt, roomDistance } from "./grid";

export function assignRoomRoles(
  rooms: Room[],
  startHint: Point,
  level: number,
  random: () => number,
) {
  for (const room of rooms) room.role = "connector";

  const startRoom =
    rooms.toSorted((a, b) => roomDistance(a, startHint) - roomDistance(b, startHint))[0] ??
    null;
  if (!startRoom) return rooms;

  startRoom.role = "start";
  const remaining = rooms.filter((room) => room !== startRoom);
  const capsuleRoom =
    remaining.toSorted(
      (a, b) => roomDistance(b, startRoom.center) - roomDistance(a, startRoom.center),
    )[0] ?? null;
  if (capsuleRoom) capsuleRoom.role = "capsule";

  const candidates = remaining.filter((room) => room !== capsuleRoom);
  const shuffled = candidates
    .map((room) => ({ room, rank: random() }))
    .toSorted((a, b) => a.rank - b.rank)
    .map(({ room }) => room);

  const rolePattern: RoomRole[] = [
    "block-puzzle",
    "hazard",
    "screw",
    "block-puzzle",
    "screw",
    "hazard",
    "block-puzzle",
    "screw",
  ];

  for (let i = 0; i < shuffled.length; i++) {
    const room = shuffled[i];
    const desiredRole = rolePattern[(i + level) % rolePattern.length];
    const canHoldBlockPuzzle = room.width >= 12 && room.height >= 10;
    room.role =
      desiredRole === "block-puzzle" && !canHoldBlockPuzzle
        ? random() < 0.55
          ? "screw"
          : "hazard"
        : desiredRole;
  }

  if (!shuffled.some((room) => room.role === "block-puzzle")) {
    const room = shuffled.find((candidate) => candidate.width >= 12 && candidate.height >= 10);
    if (room) room.role = "block-puzzle";
  }
  if (!shuffled.some((room) => room.role === "hazard")) {
    const room = shuffled.find((candidate) => candidate.role !== "block-puzzle");
    if (room) room.role = "hazard";
  }

  return rooms;
}

export function carveRoomRoleGeometry(
  board: Cell[][],
  rooms: Room[],
  random: () => number,
) {
  const carveWall = (points: Point[], gap: Point) => {
    for (const point of points) {
      if (Math.abs(point.x - gap.x) <= 1 && Math.abs(point.y - gap.y) <= 1)
        continue;
      if (board[point.y]?.[point.x] === " ") board[point.y][point.x] = "#";
    }
  };

  for (const room of rooms) {
    if (room.role === "start" || room.role === "capsule") continue;
    if (room.width < 10 || room.height < 8) continue;

    if (room.role === "connector") {
      if (room.width >= room.height) {
        const y = room.center.y;
        const start = room.x + 2;
        const end = room.x + room.width - 3;
        const gap = { x: randomInt(random, start + 2, end - 2), y };
        carveWall(
          Array.from({ length: end - start + 1 }, (_, i) => ({
            x: start + i,
            y,
          })),
          gap,
        );
      } else {
        const x = room.center.x;
        const start = room.y + 2;
        const end = room.y + room.height - 3;
        const gap = { x, y: randomInt(random, start + 2, end - 2) };
        carveWall(
          Array.from({ length: end - start + 1 }, (_, i) => ({
            x,
            y: start + i,
          })),
          gap,
        );
      }
    }

    if (room.role === "screw") {
      const shelfCount = 1;
      for (let i = 0; i < shelfCount; i++) {
        const horizontal = random() < 0.65;
        if (horizontal) {
          const y = randomInt(random, room.y + 2, room.y + room.height - 3);
          const start = randomInt(random, room.x + 2, room.x + Math.max(2, room.width - 9));
          const end = Math.min(start + randomInt(random, 5, 10), room.x + room.width - 3);
          const gap = { x: randomInt(random, start, end), y };
          carveWall(
            Array.from({ length: end - start + 1 }, (_, j) => ({
              x: start + j,
              y,
            })),
            gap,
          );
        } else {
          const x = randomInt(random, room.x + 2, room.x + room.width - 3);
          const start = randomInt(random, room.y + 2, room.y + Math.max(2, room.height - 7));
          const end = Math.min(start + randomInt(random, 4, 8), room.y + room.height - 3);
          const gap = { x, y: randomInt(random, start, end) };
          carveWall(
            Array.from({ length: end - start + 1 }, (_, j) => ({
              x,
              y: start + j,
            })),
            gap,
          );
        }
      }
    }

    if (room.role === "hazard") {
      const laneX = randomInt(random, room.x + 2, room.x + room.width - 3);
      for (let y = room.y + 2; y < room.y + room.height - 2; y++) {
        if (y % 4 !== 0 && board[y]?.[laneX] === " ") board[y][laneX] = "#";
      }
    }
  }
}
