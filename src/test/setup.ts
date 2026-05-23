import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup React Testing Library between tests
afterEach(() => {
  cleanup()
})

// Provide crypto.randomUUID for jsdom if not available
if (!globalThis.crypto) {
  // @ts-expect-error: minimal polyfill for jsdom
  globalThis.crypto = {}
}
if (!globalThis.crypto.randomUUID) {
  let counter = 0
  // @ts-expect-error: assigning polyfill
  globalThis.crypto.randomUUID = () => `uuid-${++counter}-${Date.now()}`
}

// jsdom does not implement scrollIntoView
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}

// Silence noisy alerts/confirms in tests by default; tests can override.
vi.spyOn(window, 'alert').mockImplementation(() => {})
vi.spyOn(window, 'confirm').mockImplementation(() => true)
