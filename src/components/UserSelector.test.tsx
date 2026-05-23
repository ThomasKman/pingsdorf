import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserSelector } from './UserSelector'
import type { User } from '../types/User'

const USERS: User[] = [
  { id: 'u1', name: 'Alice', color: '#ff0000', avatar: '👤' },
  { id: 'u2', name: 'Bob', color: '#00ff00', avatar: '💕' },
]

describe('UserSelector', () => {
  it('renders all users as buttons', () => {
    render(<UserSelector users={USERS} currentUserId="u1" onSelectUser={() => {}} />)
    expect(screen.getByRole('button', { name: /Alice/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bob/ })).toBeInTheDocument()
  })

  it('marks the current user button as active', () => {
    render(<UserSelector users={USERS} currentUserId="u2" onSelectUser={() => {}} />)
    const bob = screen.getByRole('button', { name: /Bob/ })
    const alice = screen.getByRole('button', { name: /Alice/ })
    expect(bob.className).toMatch(/active/)
    expect(alice.className).not.toMatch(/active/)
  })

  it('calls onSelectUser with clicked user id', async () => {
    const onSelect = vi.fn()
    render(<UserSelector users={USERS} currentUserId="u1" onSelectUser={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Bob/ }))
    expect(onSelect).toHaveBeenCalledWith('u2')
  })

  it('shows the current user color hint', () => {
    render(<UserSelector users={USERS} currentUserId="u1" onSelectUser={() => {}} />)
    expect(screen.getByText(/Your pings will be/)).toBeInTheDocument()
    expect(screen.getByText('#ff0000')).toBeInTheDocument()
  })

  it('does not render hint when current user is unknown', () => {
    render(<UserSelector users={USERS} currentUserId="missing" onSelectUser={() => {}} />)
    expect(screen.queryByText(/Your pings will be/)).not.toBeInTheDocument()
  })
})
