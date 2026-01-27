import { useState, useRef, useCallback, useEffect } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { Sidebar } from './components/Sidebar'
import { PingMarker } from './components/PingMarker'
import { RoomOverlay } from './components/RoomOverlay'
import { RoomEditor } from './components/RoomEditor'
import { UserSelector } from './components/UserSelector'
import type { Ping } from './types/Ping'
import type { Room, Point } from './types/Room'
import { MOCK_USERS } from './types/User'
import { findRoomForPoint } from './utils/geometry'
import './App.css'

const FLOOR_PLAN_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Sample_Floorplan.jpg'

// Mobile-specific ping placement form component
interface MobilePingFormProps {
  ping: Ping
  onUpdate: (updates: Partial<Pick<Ping, 'name' | 'description' | 'image'>>) => void
  onConfirm: () => void
  onCancel: () => void
}

function MobilePingForm({ ping, onUpdate, onConfirm, onCancel }: MobilePingFormProps) {
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

function App() {
  const [pings, setPings] = useState<Ping[]>([])
  const [selectedPingId, setSelectedPingId] = useState<string | null>(null)
  const [placingPingId, setPlacingPingId] = useState<string | null>(null)
  const [directPlacement, setDirectPlacement] = useState(false) // true when placed via double-tap
  const [currentUserId, setCurrentUserId] = useState(MOCK_USERS[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Room state
  const [rooms, setRooms] = useState<Room[]>([])
  const [showRoomEditor, setShowRoomEditor] = useState(false)
  const [isDrawingRoom, setIsDrawingRoom] = useState(false)
  const [drawingRoomName, setDrawingRoomName] = useState('')
  const [drawingRoomColor, setDrawingRoomColor] = useState('')
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([])
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)

  // Helper to assign room to a ping based on its position
  const assignRoomToPing = useCallback((ping: Ping): Ping => {
    const room = findRoomForPoint({ x: ping.x, y: ping.y }, rooms)
    return { ...ping, roomId: room?.id }
  }, [rooms])

  // Recalculate room assignments when rooms change
  useEffect(() => {
    setPings(prev => prev.map(ping => assignRoomToPing(ping)))
  }, [rooms, assignRoomToPing])

  // Calculate position under the crosshair (top third of map container on mobile)
  const getCrosshairPosition = useCallback((): { x: number; y: number } | null => {
    if (!imageRef.current || !mapContainerRef.current || !transformRef.current) {
      return null
    }

    const containerRect = mapContainerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()

    // Get crosshair position (center X, but top third Y to avoid being behind the form)
    const crosshairX = containerRect.left + containerRect.width / 2
    const crosshairY = containerRect.top + containerRect.height * 0.3 // Top third

    // Calculate position relative to the image
    const x = ((crosshairX - imageRect.left) / imageRect.width) * 100
    const y = ((crosshairY - imageRect.top) / imageRect.height) * 100

    // Clamp to valid range
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    }
  }, [])

  // Double-tap detection for mobile
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null)

  const handleDoubleTapPing = useCallback((e: React.TouchEvent) => {
    if (!isMobile || placingPingId || isDrawingRoom || !imageRef.current) return

    const touch = e.touches[0] || e.changedTouches[0]
    const now = Date.now()
    const lastTap = lastTapRef.current

    if (lastTap && now - lastTap.time < 300 &&
        Math.abs(touch.clientX - lastTap.x) < 30 &&
        Math.abs(touch.clientY - lastTap.y) < 30) {
      // Double tap detected - add ping at this location
      e.preventDefault()
      const rect = imageRef.current.getBoundingClientRect()
      const x = ((touch.clientX - rect.left) / rect.width) * 100
      const y = ((touch.clientY - rect.top) / rect.height) * 100

      // Clamp to valid range
      const clampedX = Math.max(0, Math.min(100, x))
      const clampedY = Math.max(0, Math.min(100, y))

      const newPing: Ping = {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        x: clampedX,
        y: clampedY,
        userId: currentUserId,
        createdAt: new Date(),
      }

      setPings(prev => [...prev, newPing])
      setPlacingPingId(newPing.id)
      setSelectedPingId(newPing.id)
      setDirectPlacement(true)
      lastTapRef.current = null
    } else {
      lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY }
    }
  }, [isMobile, placingPingId, isDrawingRoom, currentUserId])

  const handleAddPing = () => {
    const newPing: Ping = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      x: 50,
      y: 50,
      userId: currentUserId,
      createdAt: new Date(),
    }

    setPings(prev => [...prev, newPing])
    setPlacingPingId(newPing.id)
    setSelectedPingId(newPing.id)
    setDirectPlacement(false)
  }

  const handleConfirmPing = useCallback(() => {
    if (placingPingId) {
      // On mobile crosshair mode (not double-tap), update position from crosshair
      if (isMobile && !directPlacement) {
        const pos = getCrosshairPosition()
        if (pos) {
          setPings(prev => prev.map(ping =>
            ping.id === placingPingId
              ? assignRoomToPing({ ...ping, x: pos.x, y: pos.y })
              : ping
          ))
        }
      } else {
        // Desktop or direct placement: just assign room at current position
        setPings(prev => prev.map(ping =>
          ping.id === placingPingId ? assignRoomToPing(ping) : ping
        ))
      }
    }
    setPlacingPingId(null)
    setDirectPlacement(false)
  }, [placingPingId, isMobile, directPlacement, getCrosshairPosition, assignRoomToPing])

  const handleCancelPing = useCallback(() => {
    if (placingPingId) {
      setPings(prev => prev.filter(p => p.id !== placingPingId))
      setPlacingPingId(null)
      setSelectedPingId(null)
      setDirectPlacement(false)
    }
  }, [placingPingId])

  const handlePingDrag = useCallback((id: string, x: number, y: number) => {
    setPings(prev => prev.map(ping =>
      ping.id === id ? { ...ping, x, y } : ping
    ))
  }, [])

  const handleSelectPing = useCallback((id: string) => {
    if (!placingPingId) {
      setSelectedPingId(id)
      // On mobile, open the sidebar to show ping details
      if (window.innerWidth <= 768) {
        setSidebarOpen(true)
      }
    }
  }, [placingPingId])

  const handleUpdatePing = useCallback((id: string, updates: Partial<Pick<Ping, 'name' | 'description' | 'image'>>) => {
    setPings(prev => prev.map(ping =>
      ping.id === id ? { ...ping, ...updates } : ping
    ))
  }, [])

  const handleDeletePing = useCallback((id: string) => {
    setPings(prev => prev.filter(ping => ping.id !== id))
    if (selectedPingId === id) {
      setSelectedPingId(null)
    }
  }, [selectedPingId])

  const handleCleanUpPing = useCallback((id: string) => {
    setPings(prev => prev.map(ping =>
      ping.id === id
        ? { ...ping, cleanedUpBy: currentUserId, cleanedUpAt: new Date() }
        : ping
    ))
    if (selectedPingId === id) {
      setSelectedPingId(null)
    }
  }, [currentUserId, selectedPingId])

  // Room handlers
  const handleStartDrawingRoom = useCallback((name: string, color: string) => {
    setIsDrawingRoom(true)
    setDrawingRoomName(name)
    setDrawingRoomColor(color)
    setDrawingPoints([])
  }, [])

  const handleCancelDrawingRoom = useCallback(() => {
    setIsDrawingRoom(false)
    setDrawingRoomName('')
    setDrawingRoomColor('')
    setDrawingPoints([])
  }, [])

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (!isDrawingRoom || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Check if clicking on first point to close the polygon
    if (drawingPoints.length >= 3) {
      const firstPoint = drawingPoints[0]
      const distance = Math.sqrt((x - firstPoint.x) ** 2 + (y - firstPoint.y) ** 2)
      if (distance < 3) {
        // Close the room
        const newRoom: Room = {
          id: crypto.randomUUID(),
          name: drawingRoomName,
          color: drawingRoomColor,
          points: drawingPoints,
        }
        setRooms(prev => [...prev, newRoom])
        handleCancelDrawingRoom()
        return
      }
    }

    // Add new point
    setDrawingPoints(prev => [...prev, { x, y }])
  }, [isDrawingRoom, drawingPoints, drawingRoomName, drawingRoomColor, handleCancelDrawingRoom])

  const handleUpdateRoom = useCallback((roomId: string, updates: Partial<Pick<Room, 'name' | 'color'>>) => {
    setRooms(prev => prev.map(room =>
      room.id === roomId ? { ...room, ...updates } : room
    ))
  }, [])

  const handleDeleteRoom = useCallback((roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId))
    if (editingRoomId === roomId) {
      setEditingRoomId(null)
    }
  }, [editingRoomId])

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Pingsdorf</h1>
            <p className="subtitle">Ping items on a map that your SO forgot to put away</p>
          </div>
          <div className="header-actions">
            <UserSelector
              users={MOCK_USERS}
              currentUserId={currentUserId}
              onSelectUser={setCurrentUserId}
            />
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <span className="hamburger-icon">☰</span>
              {pings.filter(p => !p.cleanedUpAt).length > 0 && (
                <span className="ping-badge">{pings.filter(p => !p.cleanedUpAt).length}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="map-container" ref={mapContainerRef}>
          <TransformWrapper
            ref={transformRef}
            initialScale={isMobile ? 0.6 : 0.9}
            minScale={0.3}
            maxScale={4}
            centerOnInit={true}
            limitToBounds={false}
            panning={{ disabled: !isMobile && (placingPingId !== null || isDrawingRoom) }}
          >
            {({ centerView }) => (
              <>
                <div className="map-controls">
                  <button
                    className="add-ping-btn"
                    onClick={handleAddPing}
                    disabled={placingPingId !== null || isDrawingRoom}
                  >
                    + Add Ping
                  </button>
                  <button onClick={() => centerView(isMobile ? 0.6 : 0.9)}>Reset View</button>
                  <button
                    className="settings-btn"
                    onClick={() => setShowRoomEditor(!showRoomEditor)}
                    title="Room Settings"
                  >
                    ⚙️ Rooms
                  </button>
                </div>
                <TransformComponent
                  wrapperStyle={{
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <div className="floor-plan-container" onClick={handleMapClick} onTouchStart={handleDoubleTapPing}>
                    <img
                      ref={imageRef}
                      src={FLOOR_PLAN_URL}
                      alt="Floor Plan"
                      className="floor-plan-image"
                      draggable={false}
                    />
                    <RoomOverlay
                      rooms={rooms}
                      isEditing={showRoomEditor}
                      editingRoomId={editingRoomId}
                      drawingPoints={drawingPoints}
                      onRoomClick={setEditingRoomId}
                    />
                    {pings.filter(p => !p.cleanedUpAt).map(ping => {
                      // On mobile crosshair mode, don't render the marker (crosshair is used instead)
                      // But for double-tap (directPlacement), show the dot immediately
                      if (isMobile && ping.id === placingPingId && !directPlacement) {
                        return null
                      }
                      return (
                        <PingMarker
                          key={ping.id}
                          ping={ping}
                          userColor={MOCK_USERS.find(u => u.id === ping.userId)?.color}
                          isSelected={ping.id === selectedPingId}
                          isPlacing={ping.id === placingPingId}
                          hideForm={isMobile}
                          imageRef={imageRef}
                          onClick={() => handleSelectPing(ping.id)}
                          onDrag={(x, y) => handlePingDrag(ping.id, x, y)}
                          onUpdate={(updates) => handleUpdatePing(ping.id, updates)}
                          onConfirm={handleConfirmPing}
                          onCancel={handleCancelPing}
                        />
                      )
                    })}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>

          {/* Mobile crosshair for ping placement (not shown for double-tap) */}
          {isMobile && placingPingId && !directPlacement && (
            <div className="mobile-crosshair">
              <div className="crosshair-vertical" />
              <div className="crosshair-horizontal" />
              <div className="crosshair-center" />
            </div>
          )}

          {/* Mobile placement form */}
          {isMobile && placingPingId && (
            <MobilePingForm
              ping={pings.find(p => p.id === placingPingId)!}
              onUpdate={(updates) => handleUpdatePing(placingPingId, updates)}
              onConfirm={handleConfirmPing}
              onCancel={handleCancelPing}
            />
          )}

          {showRoomEditor && (
            <RoomEditor
              rooms={rooms}
              isDrawing={isDrawingRoom}
              drawingPointsCount={drawingPoints.length}
              editingRoomId={editingRoomId}
              onStartDrawing={handleStartDrawingRoom}
              onCancelDrawing={handleCancelDrawingRoom}
              onSelectRoom={setEditingRoomId}
              onUpdateRoom={handleUpdateRoom}
              onDeleteRoom={handleDeleteRoom}
              onClose={() => {
                setShowRoomEditor(false)
                setEditingRoomId(null)
                handleCancelDrawingRoom()
              }}
            />
          )}
        </div>

        <Sidebar
          pings={pings.filter(p => p.id !== placingPingId)}
          rooms={rooms}
          users={MOCK_USERS}
          currentUserId={currentUserId}
          selectedPingId={selectedPingId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectPing={(id) => {
            handleSelectPing(id)
            // Close sidebar on mobile after selecting
            if (window.innerWidth <= 768) {
              setSidebarOpen(false)
            }
          }}
          onUpdatePing={handleUpdatePing}
          onDeletePing={handleDeletePing}
          onCleanUpPing={handleCleanUpPing}
        />
      </div>

      <footer className="app-footer">
        <p>
          {isDrawingRoom
            ? 'Click on the map to add room corners • Click the first point (red) to close the room'
            : placingPingId
              ? 'Drag the ping to position • Fill in the details • Press Enter or click ✓ Add'
              : 'Click "Add Ping" to place a new ping • Drag to pan • Scroll to zoom'
          }
        </p>
      </footer>
    </div>
  )
}

export default App
