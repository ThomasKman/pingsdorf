import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

/**
 * Owns the floor-plan map's refs (image, container, transform) plus
 * rotation and the "fit-to-container" scale. Re-fits when rotation changes.
 */
export function useMapView() {
  const imageRef = useRef<HTMLImageElement>(null)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapRotation, setMapRotation] = useState(0)
  const [fitScale, setFitScale] = useState(0.5)

  const calculateFitScale = useCallback(() => {
    if (!imageRef.current || !mapContainerRef.current) return
    const container = mapContainerRef.current.getBoundingClientRect()
    const img = imageRef.current
    // At 90/270 degrees, width and height are swapped
    const isRotated = mapRotation === 90 || mapRotation === 270
    const imgW = isRotated ? img.naturalHeight : img.naturalWidth
    const imgH = isRotated ? img.naturalWidth : img.naturalHeight
    const scaleX = container.width / imgW
    const scaleY = container.height / imgH
    const scale = Math.min(scaleX, scaleY) * 0.95 // slight padding
    setFitScale(scale)
    // Center after computing
    setTimeout(() => transformRef.current?.centerView(scale), 50)
  }, [mapRotation])

  const handleImageLoad = useCallback(() => {
    calculateFitScale()
  }, [calculateFitScale])

  // Recalculate fit when rotation changes
  useEffect(() => {
    if (imageRef.current) {
      // Delay to let CSS transform apply
      setTimeout(() => calculateFitScale(), 100)
    }
  }, [mapRotation, calculateFitScale])

  return {
    imageRef,
    transformRef,
    mapContainerRef,
    mapRotation,
    setMapRotation,
    fitScale,
    handleImageLoad,
  }
}
