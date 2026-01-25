import { useState, useRef, useCallback, useEffect } from 'react'
import type { Ping } from '../types/Ping'
import './PingMarker.css'

interface PingMarkerProps {
  ping: Ping
  isSelected: boolean
  isPlacing: boolean
  imageRef: React.RefObject<HTMLImageElement | null>
  onClick: () => void
  onDrag: (x: number, y: number) => void
  onUpdate: (updates: Partial<Pick<Ping, 'name' | 'description'>>) => void
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
  onUpdate,
  onConfirm,
  onCancel,
}: PingMarkerProps) {
  const isDragging = useRef(false)
  const [name, setName] = useState(ping.name)
  const [description, setDescription] = useState(ping.description)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isPlacing && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [isPlacing])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isPlacing) return

    // Don't start drag if clicking on the form
    if ((e.target as HTMLElement).closest('.ping-placement-form')) return

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

  const handleConfirm = () => {
    onUpdate({ name, description })
    onConfirm()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

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
        <div className="ping-placement-form" onClick={(e) => e.stopPropagation()}>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Name (e.g., Dirty socks)"
            className="ping-input"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Description (optional)"
            className="ping-textarea"
            rows={2}
          />
          <div className="ping-placement-buttons">
            <button
              className="ping-confirm"
              onClick={handleConfirm}
              title="Confirm (Enter)"
            >
              ✓ Add
            </button>
            <button
              className="ping-cancel"
              onClick={onCancel}
              title="Cancel (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
