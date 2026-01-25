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
  const [placingPingId, setPlacingPingId] = useState<string | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleAddPing = () => {
    const newPing: Ping = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      x: 50,
      y: 50,
      createdAt: new Date(),
    }

    setPings(prev => [...prev, newPing])
    setPlacingPingId(newPing.id)
    setSelectedPingId(newPing.id)
  }

  const handleConfirmPing = useCallback(() => {
    setPlacingPingId(null)
  }, [])

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
            panning={{ disabled: placingPingId !== null }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="map-controls">
                  <button
                    className="add-ping-btn"
                    onClick={handleAddPing}
                    disabled={placingPingId !== null}
                  >
                    + Add Ping
                  </button>
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
                  <div className="floor-plan-container">
                    <img
                      ref={imageRef}
                      src={FLOOR_PLAN_URL}
                      alt="Floor Plan"
                      className="floor-plan-image"
                      draggable={false}
                    />
                    {pings.map(ping => (
                      <PingMarker
                        key={ping.id}
                        ping={ping}
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
        </div>

        <Sidebar
          pings={pings.filter(p => p.id !== placingPingId)}
          selectedPingId={selectedPingId}
          onSelectPing={handleSelectPing}
          onUpdatePing={handleUpdatePing}
          onDeletePing={handleDeletePing}
        />
      </div>

      <footer className="app-footer">
        <p>
          {placingPingId
            ? 'Drag the ping to position • Fill in the details • Press Enter or click ✓ Add'
            : 'Click "Add Ping" to place a new ping • Drag to pan • Scroll to zoom'
          }
        </p>
      </footer>
    </div>
  )
}

export default App
