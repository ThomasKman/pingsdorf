import { useCallback, useState } from 'react'
import type { Point, Room } from '../types/Room'

export interface UseRoomsOptions {
  /** Optional initial rooms (e.g. hydrated from persistence). */
  initialRooms?: Room[]
}

/**
 * Manages the rooms list and the "drawing a new room" state machine.
 * UI integration (where to compute click coordinates, when to close the
 * polygon) is left to the caller.
 */
export function useRooms(options: UseRoomsOptions = {}) {
  const [rooms, setRooms] = useState<Room[]>(() => options.initialRooms ?? [])
  const [isDrawingRoom, setIsDrawingRoom] = useState(false)
  const [drawingRoomName, setDrawingRoomName] = useState('')
  const [drawingRoomColor, setDrawingRoomColor] = useState('')
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([])
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)

  const startDrawing = useCallback((name: string, color: string) => {
    setIsDrawingRoom(true)
    setDrawingRoomName(name)
    setDrawingRoomColor(color)
    setDrawingPoints([])
  }, [])

  const cancelDrawing = useCallback(() => {
    setIsDrawingRoom(false)
    setDrawingRoomName('')
    setDrawingRoomColor('')
    setDrawingPoints([])
  }, [])

  const addDrawingPoint = useCallback((point: Point) => {
    setDrawingPoints(prev => [...prev, point])
  }, [])

  /**
   * Finalise the currently-drawn polygon as a new room.
   * No-op if fewer than 3 points have been placed.
   */
  const finishDrawing = useCallback(() => {
    if (drawingPoints.length < 3) return
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name: drawingRoomName,
      color: drawingRoomColor,
      points: drawingPoints,
    }
    setRooms(prev => [...prev, newRoom])
    cancelDrawing()
  }, [drawingPoints, drawingRoomName, drawingRoomColor, cancelDrawing])

  const updateRoom = useCallback(
    (roomId: string, updates: Partial<Pick<Room, 'name' | 'color'>>) => {
      setRooms(prev => prev.map(r => (r.id === roomId ? { ...r, ...updates } : r)))
    },
    []
  )

  const deleteRoom = useCallback((roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId))
    setEditingRoomId(prev => (prev === roomId ? null : prev))
  }, [])

  return {
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
  }
}
