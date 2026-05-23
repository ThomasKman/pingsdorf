import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { RoomOverlay } from './RoomOverlay'
import type { Room, Point } from '../types/Room'

const ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'Kitchen',
    color: '#ff0000',
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
  },
  {
    id: 'r2',
    name: 'Bedroom',
    color: '#00ff00',
    points: [
      { x: 20, y: 20 },
      { x: 30, y: 20 },
      { x: 30, y: 30 },
      { x: 20, y: 30 },
    ],
  },
]

describe('RoomOverlay', () => {
  it('renders one polygon per room', () => {
    const { container } = render(
      <RoomOverlay
        rooms={ROOMS}
        isEditing={false}
        editingRoomId={null}
        drawingPoints={[]}
      />
    )
    const polygons = container.querySelectorAll('polygon')
    expect(polygons).toHaveLength(2)
  })

  it('renders the room labels', () => {
    const { container } = render(
      <RoomOverlay
        rooms={ROOMS}
        isEditing={false}
        editingRoomId={null}
        drawingPoints={[]}
      />
    )
    const labels = Array.from(container.querySelectorAll('text.room-label')).map(
      el => el.textContent
    )
    expect(labels).toContain('Kitchen')
    expect(labels).toContain('Bedroom')
  })

  it('marks the editing room with the editing class', () => {
    const { container } = render(
      <RoomOverlay
        rooms={ROOMS}
        isEditing={true}
        editingRoomId="r2"
        drawingPoints={[]}
      />
    )
    const editingGroups = container.querySelectorAll('g.room.editing')
    expect(editingGroups).toHaveLength(1)
  })

  it('renders the drawing polyline and points when drawing', () => {
    const drawingPoints: Point[] = [
      { x: 5, y: 5 },
      { x: 15, y: 5 },
      { x: 15, y: 15 },
    ]
    const { container } = render(
      <RoomOverlay
        rooms={[]}
        isEditing={true}
        editingRoomId={null}
        drawingPoints={drawingPoints}
      />
    )
    expect(container.querySelector('polyline')).toBeInTheDocument()
    expect(container.querySelectorAll('g.drawing-room circle')).toHaveLength(3)
  })

  it('marks the first drawing point as closeable when polygon has >= 3 points', () => {
    const drawingPoints: Point[] = [
      { x: 5, y: 5 },
      { x: 15, y: 5 },
      { x: 15, y: 15 },
    ]
    const { container } = render(
      <RoomOverlay
        rooms={[]}
        isEditing={true}
        editingRoomId={null}
        drawingPoints={drawingPoints}
      />
    )
    const circles = container.querySelectorAll('g.drawing-room circle')
    expect(circles[0]).toHaveClass('closeable')
    expect(circles[1]).not.toHaveClass('closeable')
  })

  it('calls onRoomClick when a room is clicked in editing mode', () => {
    const onRoomClick = vi.fn()
    const { container } = render(
      <RoomOverlay
        rooms={ROOMS}
        isEditing={true}
        editingRoomId={null}
        drawingPoints={[]}
        onRoomClick={onRoomClick}
      />
    )
    const polygon = container.querySelector('polygon')!
    polygon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onRoomClick).toHaveBeenCalledWith('r1')
  })

  it('does not call onRoomClick when not in editing mode', () => {
    const onRoomClick = vi.fn()
    const { container } = render(
      <RoomOverlay
        rooms={ROOMS}
        isEditing={false}
        editingRoomId={null}
        drawingPoints={[]}
        onRoomClick={onRoomClick}
      />
    )
    const polygon = container.querySelector('polygon')!
    polygon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onRoomClick).not.toHaveBeenCalled()
  })
})
