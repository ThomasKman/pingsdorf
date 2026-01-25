import { useState, useRef, useCallback } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { Sidebar } from './components/Sidebar'
import { PingMarker } from './components/PingMarker'
import type { Ping } from './types/Ping'
import './App.css'

const FLOOR_PLAN_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Sample_Floorplan.jpg'

function App() {
  const [pings, setPings] = useState<Ping[]>([])
  const [selectedPingId, setSelectedPingId] = useState<string | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const isDragging = useRef(false)
  const dragStartPos = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    isDragging.current = false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = Math.abs(e.clientX - dragStartPos.current.x)
    const dy = Math.abs(e.clientY - dragStartPos.current.y)
    if (dx > 5 || dy > 5) {
      isDragging.current = true
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    // Don't add ping if we were dragging (panning)
    if (isDragging.current) {
      return
    }

    const image = imageRef.current
    if (!image) return

    const rect = image.getBoundingClientRect()

    // Calculate position as percentage of image dimensions
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newPing: Ping = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      x,
      y,
      createdAt: new Date(),
    }

    setPings(prev => [...prev, newPing])
    setSelectedPingId(newPing.id)
  }

  const handleSelectPing = useCallback((id: string) => {
    setSelectedPingId(id)
  }, [])

  const handleUpdatePing = useCallback((id: string, updates: Partial<Pick<Ping, 'name' | 'description'>>) => {
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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Pingsdorf</h1>
        <p className="subtitle">Ping items on a map that your SO forgot to put away</p>
      </header>

      <div className="main-content">
        <div className="map-container">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit={true}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="map-controls">
                  <button onClick={() => zoomIn()}>+ Zoom In</button>
                  <button onClick={() => zoomOut()}>- Zoom Out</button>
                  <button onClick={() => resetTransform()}>Reset</button>
                </div>
                <TransformComponent
                  wrapperStyle={{
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <div
                    className="floor-plan-container"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                  >
                    <img
                      ref={imageRef}
                      src={FLOOR_PLAN_URL}
                      alt="Floor Plan"
                      className="floor-plan-image"
                      onClick={handleImageClick}
                      draggable={false}
                    />
                    {pings.map(ping => (
                      <PingMarker
                        key={ping.id}
                        ping={ping}
                        isSelected={ping.id === selectedPingId}
                        onClick={() => handleSelectPing(ping.id)}
                      />
                    ))}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>

        <Sidebar
          pings={pings}
          selectedPingId={selectedPingId}
          onSelectPing={handleSelectPing}
          onUpdatePing={handleUpdatePing}
          onDeletePing={handleDeletePing}
        />
      </div>

      <footer className="app-footer">
        <p>Click on the map to add a ping • Drag to pan • Scroll to zoom</p>
      </footer>
    </div>
  )
}

export default App
