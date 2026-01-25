import type { Ping } from '../types/Ping'
import './PingMarker.css'

interface PingMarkerProps {
  ping: Ping
  isSelected: boolean
  onClick: () => void
}

export function PingMarker({ ping, isSelected, onClick }: PingMarkerProps) {
  return (
    <div
      className={`ping-marker ${isSelected ? 'selected' : ''}`}
      style={{
        left: `${ping.x}%`,
        top: `${ping.y}%`,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={ping.name}
    >
      <div className="ping-dot" />
      <div className="ping-pulse" />
    </div>
  )
}
