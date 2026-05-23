import type { Ping } from '../types/Ping'
import type { Room } from '../types/Room'

const STORAGE_KEY = 'pingsdorf:v1'

export interface PersistedAppState {
  pings: Ping[]
  rooms: Room[]
}

/**
 * The default empty state. Returned whenever there is nothing to load or the
 * stored payload is unreadable.
 */
export const emptyAppState: PersistedAppState = { pings: [], rooms: [] }

interface SerializedPing extends Omit<Ping, 'createdAt' | 'cleanedUpAt'> {
  createdAt: string
  cleanedUpAt?: string
}

interface SerializedPayload {
  version: 1
  pings: SerializedPing[]
  rooms: Room[]
}

function isValidPayload(value: unknown): value is SerializedPayload {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.version === 1 && Array.isArray(v.pings) && Array.isArray(v.rooms)
}

function revivePing(p: SerializedPing): Ping {
  return {
    ...p,
    createdAt: new Date(p.createdAt),
    cleanedUpAt: p.cleanedUpAt ? new Date(p.cleanedUpAt) : undefined,
  }
}

function serializePing(p: Ping): SerializedPing {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    cleanedUpAt: p.cleanedUpAt ? p.cleanedUpAt.toISOString() : undefined,
  }
}

/**
 * Read persisted state from localStorage. Safe to call on every mount —
 * any I/O / parse / shape error returns the empty state instead of throwing,
 * so the app boots cleanly even in private-mode browsers or after a schema
 * mismatch.
 */
export function loadAppState(): PersistedAppState {
  if (typeof localStorage === 'undefined') return emptyAppState
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return emptyAppState
  }
  if (!raw) return emptyAppState

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return emptyAppState
  }
  if (!isValidPayload(parsed)) return emptyAppState

  return {
    pings: parsed.pings.map(revivePing),
    rooms: parsed.rooms,
  }
}

/**
 * Write state to localStorage. Swallows quota / serialization errors so the
 * UI never crashes due to a failed save — the in-memory state remains
 * authoritative for the current session.
 */
export function saveAppState(state: PersistedAppState): void {
  if (typeof localStorage === 'undefined') return
  const payload: SerializedPayload = {
    version: 1,
    pings: state.pings.map(serializePing),
    rooms: state.rooms,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota exceeded, private mode, etc. — nothing actionable, drop on the floor.
  }
}

/**
 * Remove all persisted state. Exported for future "reset" UI; not wired yet.
 */
export function clearAppState(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
