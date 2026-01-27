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

/**
 * Convert screen coordinates to image-local percentage coordinates,
 * accounting for CSS rotation on the image container.
 *
 * When the container is rotated via CSS `rotate(Ndeg)`,
 * getBoundingClientRect() returns the axis-aligned bounding box in screen space.
 * We need to inverse-rotate screen offsets back to the image's local coordinate system.
 */
export function screenToImagePercent(
  clientX: number,
  clientY: number,
  imageEl: HTMLElement,
  mapRotation: number
): { x: number; y: number } {
  const rect = imageEl.getBoundingClientRect()

  if (!mapRotation) {
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    }
  }

  // Center of the image in screen space
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  // Offset from center in screen space
  const dx = clientX - cx
  const dy = clientY - cy

  // Apply inverse rotation
  const rad = (-mapRotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const ux = dx * cos - dy * sin
  const uy = dx * sin + dy * cos

  // Un-rotated image dimensions (swap back if rotated 90°/270°)
  const isRotated = mapRotation === 90 || mapRotation === 270
  const imgW = isRotated ? rect.height : rect.width
  const imgH = isRotated ? rect.width : rect.height

  return {
    x: Math.max(0, Math.min(100, ((ux + imgW / 2) / imgW) * 100)),
    y: Math.max(0, Math.min(100, ((uy + imgH / 2) / imgH) * 100)),
  }
}
