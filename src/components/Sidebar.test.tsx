import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from './Sidebar'
import type { Ping } from '../types/Ping'
import type { Room } from '../types/Room'
import type { User } from '../types/User'

const USERS: User[] = [
  { id: 'u1', name: 'You', color: '#4a9eff', avatar: '👤' },
  { id: 'u2', name: 'Partner', color: '#ff6b6b', avatar: '💕' },
]

function makePing(overrides: Partial<Ping> = {}): Ping {
  return {
    id: `p-${Math.random()}`,
    name: 'Item',
    description: '',
    x: 50,
    y: 50,
    userId: 'u1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

function renderSidebar(overrides: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  const props: React.ComponentProps<typeof Sidebar> = {
    pings: [],
    rooms: [],
    users: USERS,
    currentUserId: 'u1',
    selectedPingId: null,
    isOpen: true,
    onClose: vi.fn(),
    onSelectPing: vi.fn(),
    onUpdatePing: vi.fn(),
    onDeletePing: vi.fn(),
    onCleanUpPing: vi.fn(),
    ...overrides,
  }
  return { props, ...render(<Sidebar {...props} />) }
}

describe('Sidebar', () => {
  it('shows empty state when there are no pings', () => {
    renderSidebar()
    expect(screen.getByText('No pings yet')).toBeInTheDocument()
  })

  it('renders the user sections with active pings counted', () => {
    const pings = [
      makePing({ id: 'p1', name: 'Sock', userId: 'u1' }),
      makePing({ id: 'p2', name: 'Book', userId: 'u2' }),
    ]
    renderSidebar({ pings })
    expect(screen.getByText('Your Pings')).toBeInTheDocument()
    expect(screen.getByText(/Partner's Pings/)).toBeInTheDocument()
    expect(screen.getByText('Sock')).toBeInTheDocument()
    expect(screen.getByText('Book')).toBeInTheDocument()
  })

  it('does not render a section for other users with no pings', () => {
    const pings = [makePing({ id: 'p1', name: 'Sock', userId: 'u1' })]
    renderSidebar({ pings })
    expect(screen.queryByText(/Partner's Pings/)).not.toBeInTheDocument()
  })

  it('calls onSelectPing when an item is clicked', async () => {
    const pings = [makePing({ id: 'p1', name: 'Sock' })]
    const { props } = renderSidebar({ pings })
    await userEvent.click(screen.getByText('Sock'))
    expect(props.onSelectPing).toHaveBeenCalledWith('p1')
  })

  it('calls onCleanUpPing when the ✓ cleanup button is clicked', async () => {
    const pings = [makePing({ id: 'p1', name: 'Sock' })]
    const { props } = renderSidebar({ pings })
    await userEvent.click(screen.getByTitle('Mark as cleaned up'))
    expect(props.onCleanUpPing).toHaveBeenCalledWith('p1')
  })

  it('calls onDeletePing when delete is clicked for current-user ping', async () => {
    const pings = [makePing({ id: 'p1', name: 'Sock', userId: 'u1' })]
    const { props } = renderSidebar({ pings })
    await userEvent.click(screen.getByTitle('Delete'))
    expect(props.onDeletePing).toHaveBeenCalledWith('p1')
  })

  it('does not allow editing/deleting other users pings', () => {
    const pings = [makePing({ id: 'p1', name: 'Sock', userId: 'u2' })]
    renderSidebar({ pings })
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
    // Cleanup is allowed for any user
    expect(screen.getByTitle('Mark as cleaned up')).toBeInTheDocument()
  })

  it('edits a ping and saves changes', async () => {
    const pings = [makePing({ id: 'p1', name: 'Sock', description: 'Dirty' })]
    const { props } = renderSidebar({ pings })

    await userEvent.click(screen.getByTitle('Edit'))
    const nameInput = screen.getByDisplayValue('Sock')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Boots')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(props.onUpdatePing).toHaveBeenCalledWith('p1', {
      name: 'Boots',
      description: 'Dirty',
    })
  })

  it('cancels editing without saving', async () => {
    const pings = [makePing({ id: 'p1', name: 'Sock' })]
    const { props } = renderSidebar({ pings })

    await userEvent.click(screen.getByTitle('Edit'))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(props.onUpdatePing).not.toHaveBeenCalled()
    expect(screen.getByText('Sock')).toBeInTheDocument()
  })

  it('groups pings by room when rooms are defined', () => {
    const rooms: Room[] = [
      { id: 'r1', name: 'Kitchen', color: '#ff0000', points: [] },
      { id: 'r2', name: 'Bedroom', color: '#00ff00', points: [] },
    ]
    const pings = [
      makePing({ id: 'p1', name: 'Spoon', roomId: 'r1' }),
      makePing({ id: 'p2', name: 'Pillow', roomId: 'r2' }),
      makePing({ id: 'p3', name: 'Wanderer' }),
    ]
    renderSidebar({ pings, rooms })
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
    expect(screen.getByText('Bedroom')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('shows the selected ping details', () => {
    const pings = [
      makePing({
        id: 'p1',
        name: 'Sock',
        description: 'Dirty sock on floor',
      }),
    ]
    const { container } = renderSidebar({ pings, selectedPingId: 'p1' })
    expect(screen.getByText('Selected Ping')).toBeInTheDocument()
    const details = container.querySelector('.selected-ping-details')!
    expect(within(details as HTMLElement).getByText('Dirty sock on floor')).toBeInTheDocument()
    expect(within(details as HTMLElement).getByText('Sock')).toBeInTheDocument()
  })

  it('shows the history section for cleaned-up pings', () => {
    const pings = [
      makePing({
        id: 'p1',
        name: 'Cleaned sock',
        cleanedUpBy: 'u1',
        cleanedUpAt: new Date('2026-01-02T00:00:00Z'),
      }),
    ]
    renderSidebar({ pings })
    expect(screen.getByText(/All cleaned up!/)).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('expands history to show cleaned up pings when clicked', async () => {
    const pings = [
      makePing({
        id: 'p1',
        name: 'Cleaned sock',
        cleanedUpBy: 'u1',
        cleanedUpAt: new Date('2026-01-02T00:00:00Z'),
      }),
    ]
    renderSidebar({ pings })
    await userEvent.click(screen.getByText('History'))
    expect(screen.getByText('Cleaned sock')).toBeInTheDocument()
    expect(screen.getByText(/Cleaned by You/)).toBeInTheDocument()
  })

  it('applies open class when isOpen is true', () => {
    const { container } = renderSidebar({ isOpen: true })
    expect(container.querySelector('aside.sidebar')).toHaveClass('open')
  })

  it('does not apply open class when isOpen is false', () => {
    const { container } = renderSidebar({ isOpen: false })
    expect(container.querySelector('aside.sidebar')).not.toHaveClass('open')
  })

  it('opens lightbox when clicking the selected ping image', async () => {
    const pings = [
      makePing({
        id: 'p1',
        name: 'With photo',
        image: 'data:image/png;base64,xxx',
      }),
    ]
    const { container } = renderSidebar({ pings, selectedPingId: 'p1' })
    const detailImage = container.querySelector('.detail-image.clickable')!
    await userEvent.click(detailImage)
    expect(container.querySelector('.lightbox')).toBeInTheDocument()
  })

  it('renders the ping count badge in the header', () => {
    const pings = [
      makePing({ id: 'p1' }),
      makePing({ id: 'p2' }),
      makePing({ id: 'p3' }),
    ]
    renderSidebar({ pings })
    const header = document.querySelector('.sidebar-header')!
    expect(within(header as HTMLElement).getByText('3')).toBeInTheDocument()
  })
})
