import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ping } from '../types/Ping'
import type { Room } from '../types/Room'
import { findRoomForPoint } from '../utils/geometry'

export interface StartPlacingOptions {
  /** Initial X coordinate as percentage of image width. Defaults to 50. */
  x?: number
  /** Initial Y coordinate as percentage of image height. Defaults to 50. */
  y?: number
  /**
   * True when the ping was placed at an explicit location (e.g. mobile
   * double-tap) and should NOT go through the crosshair confirmation flow.
   */
  direct?: boolean
}

export interface UsePingsOptions {
  /**
   * Optional initial pings. The caller is responsible for ensuring any
   * `roomId`s in this list are consistent with the `rooms` argument at
   * mount — the hook will NOT recompute them on the first render.
   */
  initialPings?: Ping[]
}

/**
 * Owns the pings list plus the selection / placement state machine.
 * Pings are auto-assigned to rooms via point-in-polygon whenever rooms change
 * after mount, or when a ping is confirmed.
 */
export function usePings(
  currentUserId: string,
  rooms: Room[],
  options: UsePingsOptions = {}
) {
  const [pings, setPings] = useState<Ping[]>(() => options.initialPings ?? [])
  const [selectedPingId, setSelectedPingId] = useState<string | null>(null)
  const [placingPingId, setPlacingPingId] = useState<string | null>(null)
  const [directPlacement, setDirectPlacement] = useState(false)

  const assignRoomToPing = useCallback(
    (ping: Ping): Ping => {
      const room = findRoomForPoint({ x: ping.x, y: ping.y }, rooms)
      return { ...ping, roomId: room?.id }
    },
    [rooms]
  )

  // Recalculate room assignments when rooms change *after* mount.
  // Skipping the first run avoids two issues:
  //   1. trusting caller-provided initialPings to already be consistent
  //      (prevents wiping roomIds on hydration order races)
  //   2. avoiding a redundant identity churn on the empty default state
  const isFirstRoomEffect = useRef(true)
  useEffect(() => {
    if (isFirstRoomEffect.current) {
      isFirstRoomEffect.current = false
      return
    }
    setPings(prev => {
      let changed = false
      const next = prev.map(ping => {
        const room = findRoomForPoint({ x: ping.x, y: ping.y }, rooms)
        const newRoomId = room?.id
        if (ping.roomId === newRoomId) return ping
        changed = true
        return { ...ping, roomId: newRoomId }
      })
      return changed ? next : prev
    })
  }, [rooms])

  const startPlacing = useCallback(
    (opts: StartPlacingOptions = {}): string => {
      const newPing: Ping = {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        x: opts.x ?? 50,
        y: opts.y ?? 50,
        userId: currentUserId,
        createdAt: new Date(),
      }
      setPings(prev => [...prev, newPing])
      setPlacingPingId(newPing.id)
      setSelectedPingId(newPing.id)
      setDirectPlacement(opts.direct ?? false)
      return newPing.id
    },
    [currentUserId]
  )

  /**
   * Confirm the in-flight placement. If `overridePosition` is supplied
   * (e.g. crosshair-computed coordinates on mobile), the ping is moved
   * there before its room is reassigned.
   */
  const confirmPlacement = useCallback(
    (overridePosition?: { x: number; y: number }) => {
      if (placingPingId) {
        setPings(prev =>
          prev.map(ping => {
            if (ping.id !== placingPingId) return ping
            const positioned = overridePosition
              ? { ...ping, x: overridePosition.x, y: overridePosition.y }
              : ping
            return assignRoomToPing(positioned)
          })
        )
      }
      setPlacingPingId(null)
      setDirectPlacement(false)
    },
    [placingPingId, assignRoomToPing]
  )

  const cancelPlacement = useCallback(() => {
    if (placingPingId) {
      setPings(prev => prev.filter(p => p.id !== placingPingId))
      setPlacingPingId(null)
      setSelectedPingId(null)
      setDirectPlacement(false)
    }
  }, [placingPingId])

  const dragPing = useCallback((id: string, x: number, y: number) => {
    setPings(prev => prev.map(p => (p.id === id ? { ...p, x, y } : p)))
  }, [])

  const updatePing = useCallback(
    (id: string, updates: Partial<Pick<Ping, 'name' | 'description' | 'image'>>) => {
      setPings(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)))
    },
    []
  )

  const deletePing = useCallback((id: string) => {
    setPings(prev => prev.filter(p => p.id !== id))
    setSelectedPingId(prev => (prev === id ? null : prev))
  }, [])

  const cleanUpPing = useCallback(
    (id: string) => {
      setPings(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, cleanedUpBy: currentUserId, cleanedUpAt: new Date() }
            : p
        )
      )
      setSelectedPingId(prev => (prev === id ? null : prev))
    },
    [currentUserId]
  )

  return {
    pings,
    selectedPingId,
    setSelectedPingId,
    placingPingId,
    directPlacement,
    startPlacing,
    confirmPlacement,
    cancelPlacement,
    dragPing,
    updatePing,
    deletePing,
    cleanUpPing,
  }
}
