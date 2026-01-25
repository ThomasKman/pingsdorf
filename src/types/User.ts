export interface User {
  id: string
  name: string
  color: string  // Color to identify user's pings on the map
  avatar?: string  // Optional emoji or image URL
}

// Mock users for development (will be replaced with real auth later)
export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'You',
    color: '#ff6b6b',
    avatar: '👤',
  },
  {
    id: 'user-2',
    name: 'Partner',
    color: '#4ecdc4',
    avatar: '💕',
  },
]
