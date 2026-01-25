import { useState, useRef, useCallback, useEffect } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
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

function App() {
  const [pings, setPings] = useState<Ping[]>([])
  const [selectedPingId, setSelectedPingId] = useState<string | null>(null)
  const [placingPingId, setPlacingPingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState(MOCK_USERS[0].id)
  const imageRef = useRef<HTMLImageElement>(null)

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
  }

  const handleConfirmPing = useCallback(() => {
    // Assign room to the ping when confirmed
    if (placingPingId) {
      setPings(prev => prev.map(ping =>
        ping.id === placingPingId ? assignRoomToPing(ping) : ping
      ))
    }
    setPlacingPingId(null)
  }, [placingPingId, assignRoomToPing])

  const handleCancelPing = useCallback(() => {
    if (placingPingId) {
      setPings(prev => prev.filter(p => p.id !== placingPingId))
      setPlacingPingId(null)
      setSelectedPingId(null)
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
          <UserSelector
            users={MOCK_USERS}
            currentUserId={currentUserId}
            onSelectUser={setCurrentUserId}
          />
        </div>
      </header>

      <div className="main-content">
        <div className="map-container">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit={true}
            panning={{ disabled: placingPingId !== null || isDrawingRoom }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="map-controls">
                  <button
                    className="add-ping-btn"
                    onClick={handleAddPing}
                    disabled={placingPingId !== null || isDrawingRoom}
                  >
                    + Add Ping
                  </button>
                  <button onClick={() => zoomIn()}>+ Zoom In</button>
                  <button onClick={() => zoomOut()}>- Zoom Out</button>
                  <button onClick={() => resetTransform()}>Reset</button>
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
                  <div className="floor-plan-container" onClick={handleMapClick}>
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
                    {pings.map(ping => (
                      <PingMarker
                        key={ping.id}
                        ping={ping}
                        userColor={MOCK_USERS.find(u => u.id === ping.userId)?.color}
                        isSelected={ping.id === selectedPingId}
                        isPlacing={ping.id === placingPingId}
                        imageRef={imageRef}
                        onClick={() => handleSelectPing(ping.id)}
                        onDrag={(x, y) => handlePingDrag(ping.id, x, y)}
                        onUpdate={(updates) => handleUpdatePing(ping.id, updates)}
                        onConfirm={handleConfirmPing}
                        onCancel={handleCancelPing}
                      />
                    ))}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>

          {showRoomEditor && (
            <RoomEditor
              rooms={rooms}
              isDrawing={isDrawingRoom}
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
          onSelectPing={handleSelectPing}
          onUpdatePing={handleUpdatePing}
          onDeletePing={handleDeletePing}
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
