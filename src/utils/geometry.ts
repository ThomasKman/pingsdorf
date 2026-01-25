import type { Point, Room } from '../types/Room'

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false

  let inside = false
  const { x, y } = point

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }

  return inside
}

/**
 * Find which room a ping belongs to
 */
export function findRoomForPoint(point: Point, rooms: Room[]): Room | null {
  for (const room of rooms) {
    if (isPointInPolygon(point, room.points)) {
      return room
    }
  }
  return null
}

/**
 * Generate a random color for a new room
 */
export function generateRoomColor(): string {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
    '#ffeaa7', '#dfe6e9', '#a29bfe', '#fd79a8',
    '#00b894', '#e17055', '#0984e3', '#6c5ce7'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
