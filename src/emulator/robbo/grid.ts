import type { Cell, Point, Rect, Room } from "./types";

export function mulberry32(seed: number) {
  return () => {
    let next = (seed += 0x6d2b79f5);
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(random: () => number, min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function keyOf(point: Point) {
  return `${point.x},${point.y}`;
}

export function samePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

export function getNeighbors(point: Point) {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 },
  ];
}

export function inBounds(point: Point, width: number, height: number) {
  return point.x >= 0 && point.x < width && point.y >= 0 && point.y < height;
}

export function floodReachable(board: Cell[][], start: Point) {
  const height = board.length;
  const width = board[0]?.length ?? 0;
  const queue = [start];
  const reachable = new Set<string>([keyOf(start)]);

  for (let i = 0; i < queue.length; i++) {
    for (const next of getNeighbors(queue[i])) {
      if (!inBounds(next, width, height)) continue;
      if (!isFloorCell(board[next.y][next.x])) continue;
      const key = keyOf(next);
      if (reachable.has(key)) continue;
      reachable.add(key);
      queue.push(next);
    }
  }

  return { reachable, points: queue };
}

function isFloorCell(cell: Cell | undefined) {
  return !!cell && cell !== "#" && cell !== ".";
}

export function farthestPoint(points: Point[], from: Point) {
  let best = points[0] ?? from;
  let bestDistance = -Infinity;

  for (const point of points) {
    const distance = Math.abs(point.x - from.x) + Math.abs(point.y - from.y);
    if (distance > bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }

  return best;
}

export function centerOf(rect: Rect): Point {
  return {
    x: Math.floor(rect.x + rect.width / 2),
    y: Math.floor(rect.y + rect.height / 2),
  };
}

export function roomDistance(room: Room, point: Point) {
  return Math.abs(room.center.x - point.x) + Math.abs(room.center.y - point.y);
}

