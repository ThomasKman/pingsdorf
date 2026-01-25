export interface Point {
  x: number  // X coordinate as percentage of image width (0-100)
  y: number  // Y coordinate as percentage of image height (0-100)
}

export interface Room {
  id: string
  name: string
  color: string  // Hex color for room boundary/fill
  points: Point[]  // Polygon points defining room boundary
}
