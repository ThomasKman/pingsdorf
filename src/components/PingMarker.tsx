import { useRef, useCallback } from 'react'
import type { Ping } from '../types/Ping'
import './PingMarker.css'

interface PingMarkerProps {
  ping: Ping
  isSelected: boolean
  isPlacing: boolean
  imageRef: React.RefObject<HTMLImageElement | null>
  onClick: () => void
  onDrag: (x: number, y: number) => void
  onConfirm: () => void
  onCancel: () => void
}

export function PingMarker({
  ping,
  isSelected,
  isPlacing,
  imageRef,
  onClick,
  onDrag,
  onConfirm,
  onCancel,
}: PingMarkerProps) {
  const isDragging = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isPlacing) return

    e.preventDefault()
    e.stopPropagation()
    isDragging.current = true

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !imageRef.current) return

      const rect = imageRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100))

      onDrag(x, y)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [isPlacing, imageRef, onDrag])

  return (
    <div
      className={`ping-marker ${isSelected ? 'selected' : ''} ${isPlacing ? 'placing' : ''}`}
      style={{
        left: `${ping.x}%`,
        top: `${ping.y}%`,
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (!isPlacing) {
          onClick()
        }
      }}
      onMouseDown={handleMouseDown}
      title={isPlacing ? 'Drag to position' : ping.name || 'Unnamed ping'}
    >
      <div className="ping-dot" />
      <div className="ping-pulse" />

      {isPlacing && (
        <div className="ping-placement-controls">
          <button
            className="ping-confirm"
            onClick={(e) => {
              e.stopPropagation()
              onConfirm()
            }}
            title="Confirm placement"
          >
            ✓
          </button>
          <button
            className="ping-cancel"
            onClick={(e) => {
              e.stopPropagation()
              onCancel()
            }}
            title="Cancel"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
