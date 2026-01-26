import type { Room, Point } from '../types/Room'
import './RoomOverlay.css'

interface RoomOverlayProps {
  rooms: Room[]
  isEditing: boolean
  editingRoomId: string | null
  drawingPoints: Point[]
  onRoomClick?: (roomId: string) => void
}

export function RoomOverlay({
  rooms,
  isEditing,
  editingRoomId,
  drawingPoints,
  onRoomClick,
}: RoomOverlayProps) {
  const pointsToPolyline = (points: Point[]): string => {
    return points.map(p => `${p.x}%,${p.y}%`).join(' ')
  }

  return (
    <svg className="room-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
      {/* Existing rooms */}
      {rooms.map(room => (
        <g key={room.id} className={`room ${editingRoomId === room.id ? 'editing' : ''}`}>
          <polygon
            points={room.points.map(p => `${p.x},${p.y}`).join(' ')}
            fill={room.color}
            fillOpacity={isEditing ? 0.3 : 0.15}
            stroke={room.color}
            strokeWidth={isEditing ? 0.5 : 0.3}
            onClick={() => isEditing && onRoomClick?.(room.id)}
            style={{ cursor: isEditing ? 'pointer' : 'default', pointerEvents: isEditing ? 'auto' : 'none' }}
          />
          {/* Room label */}
          {room.points.length >= 3 && (
            <text
              x={room.points.reduce((sum, p) => sum + p.x, 0) / room.points.length}
              y={room.points.reduce((sum, p) => sum + p.y, 0) / room.points.length}
              className="room-label"
              fill={room.color}
            >
              {room.name}
            </text>
          )}
        </g>
      ))}

      {/* Currently drawing room */}
      {drawingPoints.length > 0 && (
        <g className="drawing-room">
          <polyline
            points={pointsToPolyline(drawingPoints)}
            fill="none"
            stroke="#2ed573"
            strokeWidth="0.4"
            strokeDasharray="1,1"
          />
          {drawingPoints.map((point, i) => (
            <circle
              key={i}
              cx={`${point.x}%`}
              cy={`${point.y}%`}
              r="1"
              fill={i === 0 ? '#ff6b6b' : '#2ed573'}
              stroke="#fff"
              strokeWidth="0.3"
              className={i === 0 && drawingPoints.length >= 3 ? 'closeable' : ''}
            />
          ))}
        </g>
      )}
    </svg>
  )
}
