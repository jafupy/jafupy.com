import type { Dims, Enemy, Point, SaveState } from "./types";
import { farthestPoint, floodReachable, inBounds, keyOf, mulberry32, randomInt, roomDistance, samePoint } from "./grid";
import { buildBoard, assignRoomRoles, carveRoomRoleGeometry } from "./rooms";
import { placePushPuzzles, placePushVaults } from "./puzzles";

export function generateLevel(
  level: number,
  dims: Dims,
  paused: boolean,
): SaveState {
  const seed = level * 9973 + dims.width * 101 + dims.height * 17;
  const random = mulberry32(seed);
  const startHint = {
    x: Math.max(1, Math.floor(dims.width * 0.12)),
    y: Math.max(1, Math.floor(dims.height * 0.18)),
  };

  let { board, rooms } = buildBoard(dims.width, dims.height, random);
  rooms = assignRoomRoles(rooms, startHint, level, random);
  let startRoom = rooms.find((room) => room.role === "start") ?? rooms[0];
  let capsuleRoom =
    rooms.find((room) => room.role === "capsule") ?? rooms[rooms.length - 1];
  let player = startRoom?.center ?? startHint;

  board[player.y][player.x] = " ";
  for (let y = player.y - 2; y <= player.y + 2; y++) {
    for (let x = player.x - 2; x <= player.x + 2; x++) {
      if (inBounds({ x, y }, dims.width, dims.height)) board[y][x] = " ";
    }
  }

  let { reachable, points } = floodReachable(board, player);

  for (let y = 1; y < dims.height - 1; y++) {
    for (let x = 1; x < dims.width - 1; x++) {
      if (board[y][x] === " " && !reachable.has(`${x},${y}`)) board[y][x] = "#";
    }
  }

  ({ reachable, points } = floodReachable(board, player));
  if (points.length < Math.min(180, Math.max(70, rooms.length * 12))) {
    ({ board, rooms } = buildBoard(dims.width, dims.height, random));
    rooms = assignRoomRoles(rooms, startHint, level, random);
    startRoom = rooms.find((room) => room.role === "start") ?? rooms[0];
    capsuleRoom =
      rooms.find((room) => room.role === "capsule") ?? rooms[rooms.length - 1];
    player = startRoom?.center ?? startHint;
    board[player.y][player.x] = " ";
    ({ reachable, points } = floodReachable(board, player));
  }

  carveRoomRoleGeometry(board, rooms, random);
  for (let y = player.y - 2; y <= player.y + 2; y++) {
    for (let x = player.x - 2; x <= player.x + 2; x++) {
      if (inBounds({ x, y }, dims.width, dims.height)) board[y][x] = " ";
    }
  }
  ({ points } = floodReachable(board, player));

  const blockPuzzleRooms = rooms.filter((room) => room.role === "block-puzzle");
  const puzzleRooms =
    blockPuzzleRooms.length > 0
      ? blockPuzzleRooms
      : rooms.filter((room) => room.role !== "start" && room.role !== "capsule");
  const puzzleCount = Math.min(Math.max(1, Math.ceil(level / 3)), 3);
  const puzzles = placePushPuzzles(
    board,
    player,
    random,
    puzzleRooms,
    puzzleCount,
  );
  const vaultCount = puzzles.screws > 0 ? 1 : Math.min(Math.max(1, Math.ceil(level / 2)), 3);
  let vaults = placePushVaults(
    board,
    player,
    random,
    puzzleRooms,
    vaultCount,
  );
  if (vaults.screws === 0) {
    vaults = placePushVaults(
      board,
      player,
      random,
      rooms.filter((room) => room.role !== "start" && room.role !== "capsule"),
      Math.max(2, Math.min(vaultCount, 3)),
    );
  }
  ({ points } = floodReachable(board, player));

  const used = new Set<string>([
    keyOf(player),
    ...puzzles.reserved,
    ...vaults.reserved,
  ]);
  const pickFloor = (minDistance = 0, roomPool = rooms) => {
    const eligiblePoints = points.filter((point) => {
      if (used.has(keyOf(point))) return false;
      if (board[point.y]?.[point.x] !== " ") return false;
      return roomPool.some(
        (room) =>
          point.x >= room.x &&
          point.x < room.x + room.width &&
          point.y >= room.y &&
          point.y < room.y + room.height,
      );
    });

    for (let attempt = 0; attempt < 500; attempt++) {
      const source = eligiblePoints.length > 0 ? eligiblePoints : points;
      const point = source[randomInt(random, 0, source.length - 1)];
      if (!point || used.has(keyOf(point))) continue;
      if (board[point.y]?.[point.x] !== " ") continue;
      const distance =
        Math.abs(point.x - player.x) + Math.abs(point.y - player.y);
      if (distance < minDistance) continue;
      used.add(keyOf(point));
      return point;
    }

    const fallback =
      points.find(
        (point) => !used.has(keyOf(point)) && board[point.y]?.[point.x] === " ",
      ) ?? player;
    used.add(keyOf(fallback));
    return fallback;
  };

  const capsulePoints = points.filter(
    (point) =>
      capsuleRoom &&
      !used.has(keyOf(point)) &&
      board[point.y]?.[point.x] === " " &&
      point.x >= capsuleRoom.x &&
      point.x < capsuleRoom.x + capsuleRoom.width &&
      point.y >= capsuleRoom.y &&
      point.y < capsuleRoom.y + capsuleRoom.height,
  );
  const exit = farthestPoint(capsulePoints.length > 0 ? capsulePoints : points, player);
  used.add(keyOf(exit));
  board[exit.y][exit.x] = "X";

  const screwRooms = rooms.filter((room) => room.role === "screw");
  const looseScrews = Math.min(Math.max(2, 3 + Math.floor(level / 3)), 5);
  const screws = looseScrews + puzzles.screws + vaults.screws;
  for (let i = 0; i < looseScrews; i++) {
    const screw = pickFloor(
      Math.floor(Math.min(dims.width, dims.height) / 5),
      screwRooms.length > 0 ? screwRooms : rooms,
    );
    board[screw.y][screw.x] = "*";
  }

  const rockCount = Math.min(3 + Math.floor(level / 2), 6);
  for (let i = 0; i < rockCount; i++) {
    const rock = pickFloor(6);
    if (board[rock.y][rock.x] === " ") board[rock.y][rock.x] = "O";
  }

  const portals: { a: Point; b: Point }[] = [];
  const portalRooms = rooms
    .filter(
      (room) =>
        room.role !== "start" &&
        room.role !== "capsule" &&
        room.width >= 9 &&
        room.height >= 7,
    )
    .toSorted((a, b) => roomDistance(b, player) - roomDistance(a, player));
  if (portalRooms.length >= 2 && level % 3 !== 2) {
    const firstPortalRoom = portalRooms[0];
    const secondPortalRoom =
      portalRooms.find(
        (room) => roomDistance(room, firstPortalRoom.center) > Math.min(dims.width, dims.height) / 3,
      ) ?? portalRooms[portalRooms.length - 1];
    const a = pickFloor(8, [firstPortalRoom]);
    const b = pickFloor(8, [secondPortalRoom]);
    if (!samePoint(a, b) && board[a.y]?.[a.x] === " " && board[b.y]?.[b.x] === " ") {
      board[a.y][a.x] = "P";
      board[b.y][b.x] = "P";
      portals.push({ a, b });
    }
  }

  const enemies: Enemy[] = [];
  const hazardRooms = rooms.filter((room) => room.role === "hazard");
  const enemyCount = Math.min(Math.max(2, hazardRooms.length), 7);
  for (let i = 0; i < enemyCount; i++) {
    const enemy = pickFloor(
      Math.floor(Math.min(dims.width, dims.height) / 3),
      hazardRooms.length > 0 ? hazardRooms : rooms,
    );
    if (board[enemy.y][enemy.x] !== " ") continue;
    const horizontal =
      board[enemy.y]?.[enemy.x - 1] === " " || board[enemy.y]?.[enemy.x + 1] === " ";
    enemies.push({
      ...enemy,
      dx: horizontal ? (random() < 0.5 ? -1 : 1) : 0,
      dy: horizontal ? 0 : random() < 0.5 ? -1 : 1,
    });
  }

  return {
    board,
    player,
    enemies,
    portals,
    screwsLeft: screws,
    moves: 0,
    tick: 0,
    paused,
    level,
    width: dims.width,
    height: dims.height,
  };
}
