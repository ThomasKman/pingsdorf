import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoomEditor } from './RoomEditor'
import type { Room } from '../types/Room'

const ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'Kitchen',
    color: '#ff0000',
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
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
    ],
  },
]

function renderEditor(overrides: Partial<React.ComponentProps<typeof RoomEditor>> = {}) {
  const props: React.ComponentProps<typeof RoomEditor> = {
    rooms: ROOMS,
    isDrawing: false,
    drawingPointsCount: 0,
    editingRoomId: null,
    mapRotation: 0,
    onRotateMap: vi.fn(),
    onStartDrawing: vi.fn(),
    onCancelDrawing: vi.fn(),
    onSelectRoom: vi.fn(),
    onUpdateRoom: vi.fn(),
    onDeleteRoom: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
  return { props, ...render(<RoomEditor {...props} />) }
}

beforeEach(() => {
  // Ensure desktop layout for these tests
  Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
})

describe('RoomEditor', () => {
  it('renders the header and room list', () => {
    renderEditor()
    expect(screen.getByText('Room Settings')).toBeInTheDocument()
    expect(screen.getByText(/Rooms \(2\)/)).toBeInTheDocument()
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
    expect(screen.getByText('Bedroom')).toBeInTheDocument()
  })

  it('shows an empty state when no rooms', () => {
    renderEditor({ rooms: [] })
    expect(screen.getByText('No rooms defined yet')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const { props } = renderEditor()
    await userEvent.click(screen.getByTitle('Close'))
    expect(props.onClose).toHaveBeenCalled()
  })

  it('requires a name before starting to draw', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { props } = renderEditor()
    await userEvent.click(screen.getByRole('button', { name: /Draw Room/ }))
    expect(alertSpy).toHaveBeenCalled()
    expect(props.onStartDrawing).not.toHaveBeenCalled()
  })

  it('calls onStartDrawing with name and color when valid', async () => {
    const { props } = renderEditor()
    await userEvent.type(screen.getByPlaceholderText(/Room name/), 'Office')
    await userEvent.click(screen.getByRole('button', { name: /Draw Room/ }))
    expect(props.onStartDrawing).toHaveBeenCalledTimes(1)
    const [name, color] = (props.onStartDrawing as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(name).toBe('Office')
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('shows drawing instructions when isDrawing is true', () => {
    renderEditor({ isDrawing: true })
    expect(screen.getByText(/Click on the map to draw room corners/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel Drawing/ })).toBeInTheDocument()
  })

  it('calls onCancelDrawing when cancel button is clicked', async () => {
    const { props } = renderEditor({ isDrawing: true })
    await userEvent.click(screen.getByRole('button', { name: /Cancel Drawing/ }))
    expect(props.onCancelDrawing).toHaveBeenCalled()
  })

  it('marks the active rotation button as active', () => {
    renderEditor({ mapRotation: 90 })
    const ninetyBtn = screen.getByRole('button', { name: '90°' })
    const defaultBtn = screen.getByRole('button', { name: 'Default' })
    expect(ninetyBtn).toHaveClass('active')
    expect(defaultBtn).not.toHaveClass('active')
  })

  it('calls onRotateMap when a rotation button is clicked', async () => {
    const { props } = renderEditor()
    await userEvent.click(screen.getByRole('button', { name: '90°' }))
    expect(props.onRotateMap).toHaveBeenCalledWith(90)
  })

  it('selects a room when clicked, and deselects when clicked again', async () => {
    const { props, rerender } = renderEditor()
    await userEvent.click(screen.getByText('Kitchen'))
    expect(props.onSelectRoom).toHaveBeenLastCalledWith('r1')

    rerender(
      <RoomEditor
        {...props}
        editingRoomId="r1"
      />
    )
    await userEvent.click(screen.getByText('Kitchen'))
    expect(props.onSelectRoom).toHaveBeenLastCalledWith(null)
  })

  it('calls onDeleteRoom when delete confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { props } = renderEditor()
    const deleteButtons = screen.getAllByTitle('Delete')
    await userEvent.click(deleteButtons[0])
    expect(props.onDeleteRoom).toHaveBeenCalledWith('r1')
  })

  it('does not call onDeleteRoom when delete is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { props } = renderEditor()
    const deleteButtons = screen.getAllByTitle('Delete')
    await userEvent.click(deleteButtons[0])
    expect(props.onDeleteRoom).not.toHaveBeenCalled()
  })

  it('allows renaming a room via the pencil button', async () => {
    const { props } = renderEditor()
    const renameButtons = screen.getAllByTitle('Rename')
    await userEvent.click(renameButtons[0])

    const input = screen.getByDisplayValue('Kitchen')
    await userEvent.clear(input)
    await userEvent.type(input, 'Pantry{Enter}')

    expect(props.onUpdateRoom).toHaveBeenCalledWith('r1', { name: 'Pantry' })
  })

  it('calls onUpdateRoom when the color input changes', () => {
    const { props, container } = renderEditor()
    const colorInputs = container.querySelectorAll<HTMLInputElement>(
      '.room-item input[type="color"]'
    )
    expect(colorInputs.length).toBeGreaterThan(0)
    fireEvent.change(colorInputs[0], { target: { value: '#123456' } })
    expect(props.onUpdateRoom).toHaveBeenCalledWith('r1', { color: '#123456' })
  })
})
