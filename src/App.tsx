import { useCallback, useMemo, useRef, useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { Sidebar } from './components/Sidebar'
import { PingMarker } from './components/PingMarker'
import { RoomOverlay } from './components/RoomOverlay'
import { RoomEditor } from './components/RoomEditor'
import { UserSelector } from './components/UserSelector'
import { MobilePingForm } from './components/MobilePingForm'
import type { Ping } from './types/Ping'
import { MOCK_USERS } from './types/User'
import { screenToImagePercent } from './utils/geometry'
import { useMobileViewport } from './hooks/useMobileViewport'
import { useMapView } from './hooks/useMapView'
import { useRooms } from './hooks/useRooms'
import { usePings } from './hooks/usePings'
import './App.css'

const FLOOR_PLAN_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Sample_Floorplan.jpg'

// Ping colors: own = blue, other = red
const OWN_PING_COLOR = '#4a9eff'
const OTHER_PING_COLOR = '#ff6b6b'

// Cluster nearby pings within this percentage distance
const CLUSTER_THRESHOLD = 4
// Spread radius (percentage) when fanning out an expanded cluster
const CLUSTER_SPREAD_RADIUS = 5
// Tap-to-close-polygon proximity threshold (percentage)
const POLYGON_CLOSE_THRESHOLD = 3
// Double-tap detection window
const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_PX = 30

interface PingCluster {
  id: string
  pings: Ping[]
  centerX: number
  centerY: number
}

function getSpreadPosition(
  index: number,
  total: number,
  cx: number,
  cy: number
): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return {
    x: cx + CLUSTER_SPREAD_RADIUS * Math.cos(angle),
    y: cy + CLUSTER_SPREAD_RADIUS * Math.sin(angle),
  }
}

function App() {
  const [currentUserId, setCurrentUserId] = useState(MOCK_USERS[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showRoomEditor, setShowRoomEditor] = useState(false)
  const [spreadClusterId, setSpreadClusterId] = useState<string | null>(null)

  const isMobile = useMobileViewport()
  const {
    imageRef,
    transformRef,
    mapContainerRef,
    mapRotation,
    setMapRotation,
    fitScale,
    handleImageLoad,
  } = useMapView()

  const {
    rooms,
    isDrawingRoom,
    drawingPoints,
    editingRoomId,
    setEditingRoomId,
    startDrawing,
    cancelDrawing,
    addDrawingPoint,
    finishDrawing,
    updateRoom,
    deleteRoom,
  } = useRooms()

  const {
    pings,
    selectedPingId,
    setSelectedPingId,
    placingPingId,
    directPlacement,
    startPlacing,
    confirmPlacement,
    cancelPlacement,
    dragPing,
    updatePing,
    deletePing,
    cleanUpPing,
  } = usePings(currentUserId, rooms)

  // ---------- Cluster computation ----------
  const activePings = useMemo(() => pings.filter(p => !p.cleanedUpAt), [pings])

  const clusters = useMemo((): PingCluster[] => {
    const result: PingCluster[] = []
    const assigned = new Set<string>()

    for (const ping of activePings) {
      if (assigned.has(ping.id)) continue
      if (ping.id === placingPingId) {
        // Don't cluster the ping being placed
        result.push({ id: ping.id, pings: [ping], centerX: ping.x, centerY: ping.y })
        assigned.add(ping.id)
        continue
      }

      const cluster: Ping[] = [ping]
      assigned.add(ping.id)

      for (const other of activePings) {
        if (assigned.has(other.id) || other.id === placingPingId) continue
        const dist = Math.sqrt((ping.x - other.x) ** 2 + (ping.y - other.y) ** 2)
        if (dist < CLUSTER_THRESHOLD) {
          cluster.push(other)
          assigned.add(other.id)
        }
      }

      const cx = cluster.reduce((s, p) => s + p.x, 0) / cluster.length
      const cy = cluster.reduce((s, p) => s + p.y, 0) / cluster.length
      result.push({
        id: cluster.map(p => p.id).join('-'),
        pings: cluster,
        centerX: cx,
        centerY: cy,
      })
    }
    return result
  }, [activePings, placingPingId])

  // ---------- Mobile placement helpers ----------
  const getCrosshairPosition = useCallback((): { x: number; y: number } | null => {
    if (!imageRef.current || !mapContainerRef.current || !transformRef.current) {
      return null
    }
    const containerRect = mapContainerRef.current.getBoundingClientRect()
    // Crosshair sits horizontally centered, vertically in the top third
    // (so the bottom-sheet form doesn't cover it).
    const crosshairX = containerRect.left + containerRect.width / 2
    const crosshairY = containerRect.top + containerRect.height * 0.3
    return screenToImagePercent(crosshairX, crosshairY, imageRef.current, mapRotation)
  }, [mapRotation, imageRef, mapContainerRef, transformRef])

  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null)

  const handleDoubleTapPing = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || placingPingId || isDrawingRoom || !imageRef.current) return

      const touch = e.touches[0] || e.changedTouches[0]
      const now = Date.now()
      const lastTap = lastTapRef.current

      if (
        lastTap &&
        now - lastTap.time < DOUBLE_TAP_MS &&
        Math.abs(touch.clientX - lastTap.x) < DOUBLE_TAP_PX &&
        Math.abs(touch.clientY - lastTap.y) < DOUBLE_TAP_PX
      ) {
        e.preventDefault()
        const { x, y } = screenToImagePercent(
          touch.clientX,
          touch.clientY,
          imageRef.current,
          mapRotation
        )
        startPlacing({ x, y, direct: true })
        lastTapRef.current = null
      } else {
        lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY }
      }
    },
    [isMobile, placingPingId, isDrawingRoom, mapRotation, imageRef, startPlacing]
  )

  // ---------- Ping placement orchestration ----------
  const handleAddPing = useCallback(() => {
    startPlacing()
  }, [startPlacing])

  const handleConfirmPing = useCallback(() => {
    // On mobile crosshair mode (not double-tap), snap to crosshair before saving.
    const override =
      isMobile && !directPlacement ? getCrosshairPosition() ?? undefined : undefined
    confirmPlacement(override)
  }, [isMobile, directPlacement, getCrosshairPosition, confirmPlacement])

  const handleSelectPing = useCallback(
    (id: string) => {
      if (!placingPingId) {
        setSelectedPingId(id)
        // On mobile, open the sidebar to show ping details
        if (window.innerWidth <= 768) {
          setSidebarOpen(true)
        }
      }
    },
    [placingPingId, setSelectedPingId]
  )

  // ---------- Room drawing click integration ----------
  const handleMapClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawingRoom || !imageRef.current) return

      const { x, y } = screenToImagePercent(e.clientX, e.clientY, imageRef.current, mapRotation)

      // Click near the first point to close the polygon
      if (drawingPoints.length >= 3) {
        const first = drawingPoints[0]
        const distance = Math.sqrt((x - first.x) ** 2 + (y - first.y) ** 2)
        if (distance < POLYGON_CLOSE_THRESHOLD) {
          finishDrawing()
          return
        }
      }

      addDrawingPoint({ x, y })
    },
    [isDrawingRoom, drawingPoints, mapRotation, imageRef, addDrawingPoint, finishDrawing]
  )

  const activePingCount = activePings.length

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
              {activePingCount > 0 && (
                <span className="ping-badge">{activePingCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="map-container" ref={mapContainerRef}>
          <TransformWrapper
            ref={transformRef}
            initialScale={fitScale}
            minScale={0.1}
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
                  <button onClick={() => centerView(fitScale)}>Reset View</button>
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
                  <div
                    className="floor-plan-container"
                    style={{ transform: mapRotation ? `rotate(${mapRotation}deg)` : undefined }}
                    onClick={(e) => {
                      handleMapClick(e)
                      setSpreadClusterId(null)
                    }}
                    onTouchStart={handleDoubleTapPing}
                  >
                    <img
                      ref={imageRef}
                      src={FLOOR_PLAN_URL}
                      alt="Floor Plan"
                      className="floor-plan-image"
                      draggable={false}
                      onLoad={handleImageLoad}
                    />
                    <RoomOverlay
                      rooms={rooms}
                      isEditing={showRoomEditor}
                      editingRoomId={editingRoomId}
                      drawingPoints={drawingPoints}
                      mapRotation={mapRotation}
                      onRoomClick={setEditingRoomId}
                    />
                    {clusters.map(cluster => {
                      const isSpread = spreadClusterId === cluster.id

                      // Single ping, or expanded cluster: render individual markers
                      if (cluster.pings.length === 1 || isSpread) {
                        return cluster.pings.map((ping, i) => {
                          // On mobile crosshair mode, don't render the in-flight ping
                          if (isMobile && ping.id === placingPingId && !directPlacement) {
                            return null
                          }
                          const displayPing =
                            isSpread && cluster.pings.length > 1
                              ? {
                                  ...ping,
                                  ...getSpreadPosition(
                                    i,
                                    cluster.pings.length,
                                    cluster.centerX,
                                    cluster.centerY
                                  ),
                                }
                              : ping
                          return (
                            <PingMarker
                              key={ping.id}
                              ping={displayPing}
                              userColor={
                                ping.userId === currentUserId
                                  ? OWN_PING_COLOR
                                  : OTHER_PING_COLOR
                              }
                              isSelected={ping.id === selectedPingId}
                              isPlacing={ping.id === placingPingId}
                              hideForm={isMobile}
                              mapRotation={mapRotation}
                              imageRef={imageRef}
                              onClick={() => {
                                handleSelectPing(ping.id)
                                // Collapse spread after selecting
                                if (isSpread) setSpreadClusterId(null)
                              }}
                              onDrag={(x, y) => dragPing(ping.id, x, y)}
                              onUpdate={(updates) => updatePing(ping.id, updates)}
                              onConfirm={handleConfirmPing}
                              onCancel={cancelPlacement}
                            />
                          )
                        })
                      }

                      // Multi-ping cluster: render cluster marker
                      return (
                        <div
                          key={cluster.id}
                          className="ping-cluster"
                          style={{
                            left: `${cluster.centerX}%`,
                            top: `${cluster.centerY}%`,
                            transform: `translate(-50%, -50%)${
                              mapRotation ? ` rotate(${-mapRotation}deg)` : ''
                            }`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSpreadClusterId(cluster.id)
                          }}
                          title={`${cluster.pings.length} pings`}
                        >
                          <div className="cluster-dot" />
                          <span className="cluster-count">{cluster.pings.length}</span>
                        </div>
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
              onUpdate={(updates) => updatePing(placingPingId, updates)}
              onConfirm={handleConfirmPing}
              onCancel={cancelPlacement}
            />
          )}

          {showRoomEditor && (
            <RoomEditor
              rooms={rooms}
              isDrawing={isDrawingRoom}
              drawingPointsCount={drawingPoints.length}
              editingRoomId={editingRoomId}
              mapRotation={mapRotation}
              onRotateMap={setMapRotation}
              onStartDrawing={startDrawing}
              onCancelDrawing={cancelDrawing}
              onSelectRoom={setEditingRoomId}
              onUpdateRoom={updateRoom}
              onDeleteRoom={deleteRoom}
              onClose={() => {
                setShowRoomEditor(false)
                setEditingRoomId(null)
                cancelDrawing()
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
          onUpdatePing={updatePing}
          onDeletePing={deletePing}
          onCleanUpPing={cleanUpPing}
        />
      </div>

      <footer className="app-footer">
        <p>
          {isDrawingRoom
            ? 'Click on the map to add room corners • Click the first point (red) to close the room'
            : placingPingId
              ? 'Drag the ping to position • Fill in the details • Press Enter or click ✓ Add'
              : 'Click "Add Ping" to place a new ping • Drag to pan • Scroll to zoom'}
        </p>
      </footer>
    </div>
  )
}

export default App
