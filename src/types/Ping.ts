export interface Ping {
  id: string
  name: string
  description: string
  image?: string  // Optional base64 data URL for attached image
  x: number  // X coordinate as percentage of image width (0-100)
  y: number  // Y coordinate as percentage of image height (0-100)
  roomId?: string  // ID of the room this ping is in (auto-detected)
  userId: string  // ID of the user who created this ping
  createdAt: Date
  // Cleanup tracking
  cleanedUpBy?: string  // ID of the user who cleaned this up
  cleanedUpAt?: Date  // When it was cleaned up
}
