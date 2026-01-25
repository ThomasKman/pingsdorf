import type { User } from '../types/User'
import './UserSelector.css'

interface UserSelectorProps {
  users: User[]
  currentUserId: string
  onSelectUser: (userId: string) => void
}

export function UserSelector({ users, currentUserId, onSelectUser }: UserSelectorProps) {
  const currentUser = users.find(u => u.id === currentUserId)

  return (
    <div className="user-selector">
      <span className="user-label">Playing as:</span>
      <div className="user-buttons">
        {users.map(user => (
          <button
            key={user.id}
            className={`user-button ${user.id === currentUserId ? 'active' : ''}`}
            onClick={() => onSelectUser(user.id)}
            style={{
              '--user-color': user.color,
            } as React.CSSProperties}
          >
            <span className="user-avatar">{user.avatar}</span>
            <span className="user-name">{user.name}</span>
          </button>
        ))}
      </div>
      {currentUser && (
        <span className="current-user-hint">
          Your pings will be <span style={{ color: currentUser.color }}>{currentUser.color}</span>
        </span>
      )}
    </div>
  )
}
