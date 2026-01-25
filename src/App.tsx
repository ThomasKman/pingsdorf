import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import './App.css'

const FLOOR_PLAN_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Sample_Floorplan.jpg'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Pingsdorf</h1>
        <p className="subtitle">Ping items on a map that your SO forgot to put away</p>
      </header>

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
                <img
                  src={FLOOR_PLAN_URL}
                  alt="Floor Plan"
                  className="floor-plan-image"
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      <footer className="app-footer">
        <p>Drag to pan • Scroll or pinch to zoom • Double-click to zoom in</p>
      </footer>
    </div>
  )
}

export default App
