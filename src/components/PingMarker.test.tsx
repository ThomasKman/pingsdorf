import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { PingMarker } from './PingMarker'
import type { Ping } from '../types/Ping'

function makePing(overrides: Partial<Ping> = {}): Ping {
  return {
    id: 'p1',
    name: 'Sock',
    description: 'Dirty sock',
    x: 50,
    y: 50,
    userId: 'u1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

function renderMarker(overrides: Partial<React.ComponentProps<typeof PingMarker>> = {}) {
  const imageRef = createRef<HTMLImageElement>()
  const props: React.ComponentProps<typeof PingMarker> = {
    ping: makePing(),
    userColor: '#4a9eff',
    isSelected: false,
    isPlacing: false,
    hideForm: false,
    mapRotation: 0,
    imageRef,
    onClick: vi.fn(),
    onDrag: vi.fn(),
    onUpdate: vi.fn(),
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  }
  return { props, ...render(<PingMarker {...props} />) }
}

describe('PingMarker', () => {
  it('renders the marker dot at the ping position', () => {
    const { container } = renderMarker({ ping: makePing({ x: 25, y: 75 }) })
    const marker = container.querySelector('.ping-marker') as HTMLElement
    expect(marker).toBeInTheDocument()
    expect(marker.style.left).toBe('25%')
    expect(marker.style.top).toBe('75%')
  })

  it('shows the photo indicator when ping has an image and is not placing', () => {
    const { container } = renderMarker({
      ping: makePing({ image: 'data:image/png;base64,xxx' }),
    })
    expect(container.querySelector('.ping-has-image')).toBeInTheDocument()
  })

  it('does not show the photo indicator while placing', () => {
    const { container } = renderMarker({
      ping: makePing({ image: 'data:image/png;base64,xxx' }),
      isPlacing: true,
    })
    expect(container.querySelector('.ping-has-image')).not.toBeInTheDocument()
  })

  it('applies the selected class when isSelected is true', () => {
    const { container } = renderMarker({ isSelected: true })
    expect(container.querySelector('.ping-marker')).toHaveClass('selected')
  })

  it('applies the placing class when isPlacing is true', () => {
    const { container } = renderMarker({ isPlacing: true })
    expect(container.querySelector('.ping-marker')).toHaveClass('placing')
  })

  it('calls onClick when clicked (and not placing)', async () => {
    const { props, container } = renderMarker()
    await userEvent.click(container.querySelector('.ping-marker')!)
    expect(props.onClick).toHaveBeenCalled()
  })

  it('does not call onClick when in placing mode', async () => {
    const { props, container } = renderMarker({ isPlacing: true })
    await userEvent.click(container.querySelector('.ping-marker')!)
    expect(props.onClick).not.toHaveBeenCalled()
  })

  it('does not render the placement form when not placing', () => {
    const { container } = renderMarker()
    expect(container.querySelector('.ping-placement-form')).not.toBeInTheDocument()
  })

  it('renders the placement form when isPlacing and not hideForm', () => {
    const { container } = renderMarker({ isPlacing: true, hideForm: false })
    expect(container.querySelector('.ping-placement-form')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Name \(e\.g\., Dirty socks\)/)).toBeInTheDocument()
  })

  it('hides the placement form when hideForm is true', () => {
    const { container } = renderMarker({ isPlacing: true, hideForm: true })
    expect(container.querySelector('.ping-placement-form')).not.toBeInTheDocument()
  })

  it('calls onUpdate and onConfirm when ✓ Add is clicked', async () => {
    const { props } = renderMarker({ isPlacing: true })
    const nameInput = screen.getByPlaceholderText(/Name/)
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Keys')
    await userEvent.click(screen.getByRole('button', { name: /✓ Add/ }))
    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Keys' })
    )
    expect(props.onConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when the ✕ cancel button is clicked', async () => {
    const { props } = renderMarker({ isPlacing: true })
    await userEvent.click(screen.getByRole('button', { name: '✕' }))
    expect(props.onCancel).toHaveBeenCalled()
  })

  it('confirms on Enter key in the name input', async () => {
    const { props } = renderMarker({ isPlacing: true })
    const nameInput = screen.getByPlaceholderText(/Name/)
    await userEvent.type(nameInput, 'Boots{Enter}')
    expect(props.onConfirm).toHaveBeenCalled()
  })

  it('cancels on Escape key in the name input', async () => {
    const { props } = renderMarker({ isPlacing: true })
    const nameInput = screen.getByPlaceholderText(/Name/)
    nameInput.focus()
    await userEvent.keyboard('{Escape}')
    expect(props.onCancel).toHaveBeenCalled()
  })

  it('focuses the name input when entering placing mode', () => {
    renderMarker({ isPlacing: true })
    expect(screen.getByPlaceholderText(/Name/)).toHaveFocus()
  })

  it('shows the Add Photo upload control when no image', () => {
    const { container } = renderMarker({ isPlacing: true })
    expect(container.querySelector('.ping-image-upload')).toBeInTheDocument()
  })

  it('renders the preview and remove button when image is set', () => {
    const { container } = renderMarker({
      isPlacing: true,
      ping: makePing({ image: 'data:image/png;base64,xxx' }),
    })
    expect(container.querySelector('.ping-image-preview img')).toBeInTheDocument()
    expect(container.querySelector('.ping-image-remove')).toBeInTheDocument()
  })

  it('removes the image when remove button is clicked', async () => {
    const { container } = renderMarker({
      isPlacing: true,
      ping: makePing({ image: 'data:image/png;base64,xxx' }),
    })
    await userEvent.click(container.querySelector('.ping-image-remove')!)
    expect(container.querySelector('.ping-image-preview')).not.toBeInTheDocument()
    expect(container.querySelector('.ping-image-upload')).toBeInTheDocument()
  })

  it('alerts when uploading a file larger than 5MB', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { container } = renderMarker({ isPlacing: true })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    // Create a fake 6MB file
    const bigFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    await userEvent.upload(fileInput, bigFile)

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('5MB'))
  })
})
