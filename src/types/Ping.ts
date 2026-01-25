export interface Ping {
  id: string
  name: string
  description: string
  image?: string  // Optional base64 data URL for attached image
  x: number  // X coordinate as percentage of image width (0-100)
  y: number  // Y coordinate as percentage of image height (0-100)
  createdAt: Date
}
