import { useState, useRef, useCallback, useEffect } from 'react'
import type { Ping } from '../types/Ping'
import './PingMarker.css'

interface PingMarkerProps {
  ping: Ping
  userColor?: string
  isSelected: boolean
  isPlacing: boolean
  hideForm?: boolean
  mapRotation?: number
  imageRef: React.RefObject<HTMLImageElement | null>
  onClick: () => void
  onDrag: (x: number, y: number) => void
  onUpdate: (updates: Partial<Pick<Ping, 'name' | 'description' | 'image'>>) => void
  onConfirm: () => void
  onCancel: () => void
}

export function PingMarker({
  ping,
  userColor,
  isSelected,
  isPlacing,
  hideForm,
  mapRotation = 0,
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
  const [image, setImage] = useState<string | undefined>(ping.image)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Touch support for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isPlacing) return

    // Don't start drag if touching the form
    if ((e.target as HTMLElement).closest('.ping-placement-form')) return

    e.stopPropagation()
    isDragging.current = true

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDragging.current || !imageRef.current) return
      moveEvent.preventDefault() // Prevent scrolling while dragging

      const touch = moveEvent.touches[0]
      const rect = imageRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100))

      onDrag(x, y)
    }

    const handleTouchEnd = () => {
      isDragging.current = false
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }, [isPlacing, imageRef, onDrag])

  const handleConfirm = () => {
    onUpdate({ name, description, image })
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setImage(result)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImage(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div
      className={`ping-marker ${isSelected ? 'selected' : ''} ${isPlacing ? 'placing' : ''}`}
      style={{
        left: `${ping.x}%`,
        top: `${ping.y}%`,
        '--ping-color': userColor || '#ff6b6b',
        transform: `translate(-50%, -50%)${mapRotation ? ` rotate(${-mapRotation}deg)` : ''}`,
      } as React.CSSProperties}
      onClick={(e) => {
        e.stopPropagation()
        if (!isPlacing) {
          onClick()
        }
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      title={isPlacing ? 'Drag to position' : ping.name || 'Unnamed ping'}
    >
      <div className="ping-dot">
        {ping.image && !isPlacing && <span className="ping-has-image">📷</span>}
      </div>
      <div className="ping-pulse" />

      {isPlacing && !hideForm && (
        <div
          className="ping-placement-form"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
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

          <div className="ping-image-section">
            {image ? (
              <div className="ping-image-preview">
                <img src={image} alt="Preview" />
                <button
                  type="button"
                  className="ping-image-remove"
                  onClick={removeImage}
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="ping-image-upload">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
                <span className="ping-image-upload-btn">📷 Add Photo</span>
              </label>
            )}
          </div>

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
