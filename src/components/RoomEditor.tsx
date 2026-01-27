import { useState, useEffect } from 'react'
import type { Room } from '../types/Room'
import { generateRoomColor } from '../utils/geometry'
import './RoomEditor.css'

interface RoomEditorProps {
  rooms: Room[]
  isDrawing: boolean
  drawingPointsCount: number
  editingRoomId: string | null
  mapRotation: number
  onRotateMap: (degrees: number) => void
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
  drawingPointsCount,
  editingRoomId,
  mapRotation,
  onRotateMap,
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
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleStartDrawing = () => {
    if (!newRoomName.trim()) {
      alert('Please enter a room name')
      return
    }
    onStartDrawing(newRoomName.trim(), newRoomColor)
    setNewRoomName('')
    setNewRoomColor(generateRoomColor())
    // Auto-minimize on mobile when starting to draw
    if (isMobile) {
      setIsMinimized(true)
    }
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

  // On mobile when drawing, show minimized view by default
  const showMinimized = isMobile && isMinimized

  return (
    <div className={`room-editor ${showMinimized ? 'minimized' : ''}`}>
      <div
        className={`room-editor-header ${isMobile ? 'clickable' : ''}`}
        onClick={(e) => {
          // On mobile, clicking the header (but not the close button) toggles minimize
          if (isMobile && !(e.target as HTMLElement).closest('.close-btn')) {
            setIsMinimized(!isMinimized)
          }
        }}
      >
        <h3>Room Settings {isMobile && <span className="minimize-hint">{isMinimized ? '▲' : '▼'}</span>}</h3>
        <div className="room-editor-header-actions">
          <button className="close-btn" onClick={(e) => { e.stopPropagation(); onClose() }} title="Close">✕</button>
        </div>
      </div>

      {/* Minimized drawing indicator for mobile */}
      {showMinimized && isDrawing && (
        <div className="minimized-drawing-info">
          <span className="drawing-status">
            Drawing: {drawingPointsCount} point{drawingPointsCount !== 1 ? 's' : ''}
            {drawingPointsCount >= 3 && ' • Tap first point to close'}
          </span>
          <button className="btn-cancel-mini" onClick={onCancelDrawing}>Cancel</button>
        </div>
      )}

      {!showMinimized && (
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

        {/* Map rotation */}
        <div className="map-rotation-section">
          <h4>Map Orientation</h4>
          <div className="rotation-buttons">
            {[0, 90].map(deg => (
              <button
                key={deg}
                className={`rotation-btn ${mapRotation === deg ? 'active' : ''}`}
                onClick={() => onRotateMap(deg)}
              >
                {deg === 0 ? 'Default' : `${deg}°`}
              </button>
            ))}
          </div>
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
      )}
    </div>
  )
}
