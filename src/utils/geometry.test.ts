import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isPointInPolygon,
  findRoomForPoint,
  generateRoomColor,
  screenToImagePercent,
} from './geometry'
import type { Room } from '../types/Room'

describe('isPointInPolygon', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ]

  it('returns false for polygons with fewer than 3 points', () => {
    expect(isPointInPolygon({ x: 1, y: 1 }, [])).toBe(false)
    expect(isPointInPolygon({ x: 1, y: 1 }, [{ x: 0, y: 0 }])).toBe(false)
    expect(
      isPointInPolygon({ x: 1, y: 1 }, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ])
    ).toBe(false)
  })

  it('returns true for a point clearly inside the polygon', () => {
    expect(isPointInPolygon({ x: 5, y: 5 }, square)).toBe(true)
  })

  it('returns false for a point clearly outside the polygon', () => {
    expect(isPointInPolygon({ x: 20, y: 20 }, square)).toBe(false)
    expect(isPointInPolygon({ x: -1, y: 5 }, square)).toBe(false)
  })

  it('works for a triangle', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 10 },
    ]
    expect(isPointInPolygon({ x: 5, y: 2 }, triangle)).toBe(true)
    expect(isPointInPolygon({ x: 0, y: 9 }, triangle)).toBe(false)
  })
})

describe('findRoomForPoint', () => {
  const rooms: Room[] = [
    {
      id: 'kitchen',
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
      id: 'bedroom',
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

  it('returns the room containing the point', () => {
    expect(findRoomForPoint({ x: 5, y: 5 }, rooms)?.id).toBe('kitchen')
    expect(findRoomForPoint({ x: 25, y: 25 }, rooms)?.id).toBe('bedroom')
  })

  it('returns null when point is outside all rooms', () => {
    expect(findRoomForPoint({ x: 50, y: 50 }, rooms)).toBeNull()
  })

  it('returns null when no rooms provided', () => {
    expect(findRoomForPoint({ x: 5, y: 5 }, [])).toBeNull()
  })
})

describe('generateRoomColor', () => {
  it('returns a hex color from the predefined palette', () => {
    const color = generateRoomColor()
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns one of the known palette colors', () => {
    const palette = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
      '#ffeaa7', '#dfe6e9', '#a29bfe', '#fd79a8',
      '#00b894', '#e17055', '#0984e3', '#6c5ce7',
    ]
    for (let i = 0; i < 50; i++) {
      expect(palette).toContain(generateRoomColor())
    }
  })
})

describe('screenToImagePercent', () => {
  let imageEl: HTMLElement

  beforeEach(() => {
    imageEl = document.createElement('div')
    imageEl.getBoundingClientRect = vi.fn(
      () =>
        ({
          left: 0,
          top: 0,
          width: 200,
          height: 100,
          right: 200,
          bottom: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 0,0 for the top-left corner (no rotation)', () => {
    expect(screenToImagePercent(0, 0, imageEl, 0)).toEqual({ x: 0, y: 0 })
  })

  it('returns 100,100 for the bottom-right corner (no rotation)', () => {
    expect(screenToImagePercent(200, 100, imageEl, 0)).toEqual({ x: 100, y: 100 })
  })

  it('returns 50,50 for the centre (no rotation)', () => {
    expect(screenToImagePercent(100, 50, imageEl, 0)).toEqual({ x: 50, y: 50 })
  })

  it('clamps values outside the image bounds to [0, 100]', () => {
    expect(screenToImagePercent(-50, -50, imageEl, 0)).toEqual({ x: 0, y: 0 })
    expect(screenToImagePercent(9999, 9999, imageEl, 0)).toEqual({ x: 100, y: 100 })
  })

  it('returns the centre when given the centre under 90° rotation', () => {
    const result = screenToImagePercent(100, 50, imageEl, 90)
    expect(result.x).toBeCloseTo(50, 5)
    expect(result.y).toBeCloseTo(50, 5)
  })

  it('produces clamped values for any input under rotation', () => {
    const result = screenToImagePercent(0, 0, imageEl, 90)
    expect(result.x).toBeGreaterThanOrEqual(0)
    expect(result.x).toBeLessThanOrEqual(100)
    expect(result.y).toBeGreaterThanOrEqual(0)
    expect(result.y).toBeLessThanOrEqual(100)
  })
})
