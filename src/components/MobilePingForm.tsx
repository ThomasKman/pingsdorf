import { useRef, useState } from 'react'
import type { Ping } from '../types/Ping'

interface MobilePingFormProps {
  ping: Ping
  onUpdate: (updates: Partial<Pick<Ping, 'name' | 'description' | 'image'>>) => void
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Bottom-sheet form shown on mobile while placing a ping. The user positions
 * the map under the crosshair (or has placed via double-tap) and fills in
 * name / description / optional photo here.
 */
export function MobilePingForm({ ping, onUpdate, onConfirm, onCancel }: MobilePingFormProps) {
  const [name, setName] = useState(ping.name)
  const [description, setDescription] = useState(ping.description)
  const [image, setImage] = useState<string | undefined>(ping.image)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    <div className="mobile-ping-form">
      <div className="mobile-ping-form-header">
        <span>Position the crosshair, then add details</span>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Name (e.g., Dirty socks)"
        className="mobile-ping-input"
        autoFocus
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Description (optional)"
        className="mobile-ping-textarea"
        rows={2}
      />

      <div className="mobile-ping-image-section">
        {image ? (
          <div className="mobile-ping-image-preview">
            <img src={image} alt="Preview" />
            <button
              type="button"
              className="mobile-ping-image-remove"
              onClick={removeImage}
              title="Remove image"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="mobile-ping-image-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
            <span className="mobile-ping-image-upload-btn">📷 Add Photo</span>
          </label>
        )}
      </div>

      <div className="mobile-ping-buttons">
        <button className="mobile-ping-confirm" onClick={handleConfirm}>
          ✓ Add Ping
        </button>
        <button className="mobile-ping-cancel" onClick={onCancel}>
          ✕
        </button>
      </div>
    </div>
  )
}
