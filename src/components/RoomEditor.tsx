import { useState } from 'react'
import type { Room } from '../types/Room'
import { generateRoomColor } from '../utils/geometry'
import './RoomEditor.css'

interface RoomEditorProps {
  rooms: Room[]
  isDrawing: boolean
  editingRoomId: string | null
  onStartDrawing: (name: string, color: string) => void
  onCancelDrawing: () => void
  onSelectRoom: (roomId: string | null) => void
  onUpdateRoom: (roomId: string, updates: Partial<Pick<Room, 'name' | 'color'>>) => void
  onDeleteRoom: (roomId: string) => void
  onClose: () => void
}

export function RoomEditor({
  rooms,
  isDrawing,
  editingRoomId,
  onStartDrawing,
  onCancelDrawing,
  onSelectRoom,
  onUpdateRoom,
  onDeleteRoom,
  onClose,
}: RoomEditorProps) {
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomColor, setNewRoomColor] = useState(generateRoomColor())
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')

  const handleStartDrawing = () => {
    if (!newRoomName.trim()) {
      alert('Please enter a room name')
      return
    }
    onStartDrawing(newRoomName.trim(), newRoomColor)
    setNewRoomName('')
    setNewRoomColor(generateRoomColor())
  }

  const startEditingName = (room: Room) => {
    setEditingName(room.id)
    setEditNameValue(room.name)
  }

  const saveEditingName = () => {
    if (editingName && editNameValue.trim()) {
      onUpdateRoom(editingName, { name: editNameValue.trim() })
    }
    setEditingName(null)
  }

  return (
    <div className="room-editor">
      <div className="room-editor-header">
        <h3>Room Settings</h3>
        <button className="close-btn" onClick={onClose} title="Close">✕</button>
      </div>

      <div className="room-editor-content">
        {/* Add new room section */}
        <div className="new-room-section">
          <h4>Add New Room</h4>
          {isDrawing ? (
            <div className="drawing-instructions">
              <p>Click on the map to draw room corners.</p>
              <p>Click the <span className="red-dot">first point</span> to close the room.</p>
              <button className="btn-cancel" onClick={onCancelDrawing}>Cancel Drawing</button>
            </div>
          ) : (
            <div className="new-room-form">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name (e.g., Kitchen)"
                onKeyDown={(e) => e.key === 'Enter' && handleStartDrawing()}
              />
              <div className="color-picker">
                <label>Color:</label>
                <input
                  type="color"
                  value={newRoomColor}
                  onChange={(e) => setNewRoomColor(e.target.value)}
                />
              </div>
              <button className="btn-draw" onClick={handleStartDrawing}>
                Draw Room
              </button>
            </div>
          )}
        </div>

        {/* Existing rooms list */}
        <div className="rooms-list-section">
          <h4>Rooms ({rooms.length})</h4>
          {rooms.length === 0 ? (
            <p className="no-rooms">No rooms defined yet</p>
          ) : (
            <ul className="rooms-list">
              {rooms.map(room => (
                <li
                  key={room.id}
                  className={`room-item ${editingRoomId === room.id ? 'selected' : ''}`}
                  onClick={() => onSelectRoom(editingRoomId === room.id ? null : room.id)}
                >
                  <div
                    className="room-color-indicator"
                    style={{ backgroundColor: room.color }}
                  />
                  {editingName === room.id ? (
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onBlur={saveEditingName}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditingName()}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="room-name">{room.name}</span>
                  )}
                  <div className="room-actions">
                    <input
                      type="color"
                      value={room.color}
                      onChange={(e) => onUpdateRoom(room.id, { color: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      title="Change color"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditingName(room)
                      }}
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete room "${room.name}"?`)) {
                          onDeleteRoom(room.id)
                        }
                      }}
                      title="Delete"
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
