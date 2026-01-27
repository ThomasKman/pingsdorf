import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type { Ping } from '../types/Ping'
import type { Room } from '../types/Room'
import type { User } from '../types/User'
import './Sidebar.css'

interface SidebarProps {
  pings: Ping[]
  rooms: Room[]
  users: User[]
  currentUserId: string
  selectedPingId: string | null
  isOpen: boolean
  onClose: () => void
  onSelectPing: (id: string) => void
  onUpdatePing: (id: string, updates: Partial<Pick<Ping, 'name' | 'description' | 'image'>>) => void
  onDeletePing: (id: string) => void
  onCleanUpPing: (id: string) => void
}

interface PingGroup {
  id: string
  name: string
  color?: string
  pings: Ping[]
}

interface UserSection {
  user: User
  isCurrentUser: boolean
  pings: Ping[]
}

// Ping colors: own = blue, other = red
const OWN_PING_COLOR = '#4a9eff'
const OTHER_PING_COLOR = '#ff6b6b'

export function Sidebar({ pings, rooms, users, currentUserId, selectedPingId, isOpen, onClose, onSelectPing, onUpdatePing, onDeletePing, onCleanUpPing }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['history']))
  const [showHistory, setShowHistory] = useState(false)

  const selectedPing = pings.find(p => p.id === selectedPingId)
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users])

  // Split pings into active and cleaned up
  const activePings = useMemo(() => pings.filter(p => !p.cleanedUpAt), [pings])
  const cleanedUpPings = useMemo(() =>
    pings
      .filter(p => p.cleanedUpAt)
      .sort((a, b) => new Date(b.cleanedUpAt!).getTime() - new Date(a.cleanedUpAt!).getTime()),
    [pings]
  )

  // Split active pings by user (current user first)
  const userSections = useMemo((): UserSection[] => {
    const sections: UserSection[] = []

    // Current user's pings first
    const currentUser = users.find(u => u.id === currentUserId)
    if (currentUser) {
      sections.push({
        user: currentUser,
        isCurrentUser: true,
        pings: activePings.filter(p => p.userId === currentUserId),
      })
    }

    // Other users' pings
    users.filter(u => u.id !== currentUserId).forEach(user => {
      const userPings = activePings.filter(p => p.userId === user.id)
      if (userPings.length > 0) {
        sections.push({
          user,
          isCurrentUser: false,
          pings: userPings,
        })
      }
    })

    return sections
  }, [activePings, users, currentUserId])

  // Group pings by room (for a given set of pings)
  const groupPingsByRoom = (pingList: Ping[]): PingGroup[] => {
    const groups: PingGroup[] = []
    const roomMap = new Map<string, Room>()
    rooms.forEach(room => roomMap.set(room.id, room))

    // Create groups for each room
    rooms.forEach(room => {
      const roomPings = pingList.filter(p => p.roomId === room.id)
      if (roomPings.length > 0) {
        groups.push({
          id: room.id,
          name: room.name,
          color: room.color,
          pings: roomPings,
        })
      }
    })

    // "Other" category for pings not in any room
    const otherPings = pingList.filter(p => !p.roomId || !roomMap.has(p.roomId))
    if (otherPings.length > 0) {
      groups.push({
        id: 'other',
        name: 'Other',
        pings: otherPings,
      })
    }

    return groups
  }

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const startEditing = (ping: Ping) => {
    setEditingId(ping.id)
    setEditName(ping.name)
    setEditDescription(ping.description)
  }

  const saveEdit = () => {
    if (editingId) {
      onUpdatePing(editingId, { name: editName, description: editDescription })
      setEditingId(null)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const openLightbox = (imageSrc: string) => {
    setLightboxImage(imageSrc)
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  const sidebarRef = useRef<HTMLElement>(null)

  // Expand sections containing the selected ping and scroll to it
  const scrollToPing = useCallback((pingId: string) => {
    const ping = pings.find(p => p.id === pingId)
    if (!ping) return

    // Expand user section containing the ping
    const userSectionKey = `user-${ping.userId}`
    // Expand room group containing the ping
    const roomGroupKey = ping.roomId ? `room-${ping.roomId}` : 'room-other'

    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      newSet.delete(userSectionKey)
      newSet.delete(roomGroupKey)
      return newSet
    })

    // Scroll after DOM updates
    requestAnimationFrame(() => {
      const el = sidebarRef.current?.querySelector(`[data-ping-id="${pingId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }, [pings])

  // When selectedPingId changes and sidebar is open, scroll to it
  useEffect(() => {
    if (selectedPingId && isOpen) {
      scrollToPing(selectedPingId)
    }
  }, [selectedPingId, isOpen, scrollToPing])

  // Render a single ping item
  const renderPingItem = (ping: Ping, canEdit: boolean, isHistory: boolean = false) => (
    <li
      key={ping.id}
      data-ping-id={ping.id}
      className={`ping-item ${selectedPingId === ping.id ? 'selected' : ''} ${isHistory ? 'history-item' : ''}`}
      onClick={() => !isHistory && onSelectPing(ping.id)}
    >
      {editingId === ping.id ? (
        <div className="ping-edit-form" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="Name"
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
            placeholder="Description"
            rows={2}
          />
          <div className="edit-actions">
            <button className="btn-save" onClick={saveEdit}>Save</button>
            <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <span
            className="ping-user-indicator"
            style={{ backgroundColor: ping.userId === currentUserId ? OWN_PING_COLOR : OTHER_PING_COLOR }}
            title={userMap.get(ping.userId)?.name || 'Unknown'}
          />
          {ping.image && (
            <div className="ping-thumbnail">
              <img src={ping.image} alt="" />
            </div>
          )}
          <div className="ping-info">
            <span className="ping-name">
              {ping.image && <span className="ping-has-photo">📷</span>}
              {ping.name || 'Unnamed ping'}
            </span>
            {ping.description && (
              <span className="ping-description">{ping.description}</span>
            )}
            {isHistory && ping.cleanedUpBy && ping.cleanedUpAt ? (
              <span className="ping-cleanup-info">
                Cleaned by {userMap.get(ping.cleanedUpBy)?.name || 'Unknown'} • {new Date(ping.cleanedUpAt).toLocaleString()}
              </span>
            ) : (
              <span className="ping-time">
                {new Date(ping.createdAt).toLocaleString()}
              </span>
            )}
          </div>
          {!isHistory && (
            <div className="ping-actions">
              <button
                className="btn-cleanup"
                onClick={(e) => {
                  e.stopPropagation()
                  onCleanUpPing(ping.id)
                }}
                title="Mark as cleaned up"
              >
                ✓
              </button>
              {canEdit && (
                <>
                  <button
                    className="btn-edit"
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditing(ping)
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeletePing(ping.id)
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </li>
  )

  // Render pings (either flat or grouped by room)
  const renderPingList = (pingList: Ping[], canEdit: boolean) => {
    if (rooms.length === 0) {
      // No rooms defined, show flat list
      return (
        <ul className="ping-list">
          {pingList.map(ping => renderPingItem(ping, canEdit))}
        </ul>
      )
    }

    // Rooms defined, show grouped list
    const groups = groupPingsByRoom(pingList)
    return (
      <div className="ping-groups">
        {groups.map(group => (
          <div key={group.id} className="ping-group room-group">
            <div
              className="ping-group-header room-header"
              onClick={() => toggleSection(`room-${group.id}`)}
            >
              <span className="group-toggle">
                {collapsedSections.has(`room-${group.id}`) ? '▶' : '▼'}
              </span>
              {group.color && (
                <span
                  className="group-color"
                  style={{ backgroundColor: group.color }}
                />
              )}
              <span className="group-name">{group.name}</span>
              <span className="group-count">{group.pings.length}</span>
            </div>
            {!collapsedSections.has(`room-${group.id}`) && (
              <ul className="ping-list">
                {group.pings.map(ping => renderPingItem(ping, canEdit))}
              </ul>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      <aside ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Pings</h2>
          <span className="ping-count">{activePings.length}</span>
          <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>

        {activePings.length === 0 && cleanedUpPings.length === 0 ? (
          <div className="sidebar-empty">
            <p>No pings yet</p>
            <p className="hint">Click "Add Ping" to add one</p>
          </div>
        ) : (
          <>
            {activePings.length === 0 ? (
              <div className="sidebar-empty">
                <p>All cleaned up!</p>
                <p className="hint">Great job keeping things tidy</p>
              </div>
            ) : (
              <div className="user-sections">
                {userSections.map(section => (
                  <div key={section.user.id} className="user-section">
                    <div
                      className="user-section-header"
                      onClick={() => toggleSection(`user-${section.user.id}`)}
                      style={{ '--user-color': section.isCurrentUser ? OWN_PING_COLOR : OTHER_PING_COLOR } as React.CSSProperties}
                    >
                      <span className="group-toggle">
                        {collapsedSections.has(`user-${section.user.id}`) ? '▶' : '▼'}
                      </span>
                      <span className="user-avatar">{section.user.avatar}</span>
                      <span className="user-section-name">
                        {section.isCurrentUser ? 'Your Pings' : `${section.user.name}'s Pings`}
                      </span>
                      <span className="group-count">{section.pings.length}</span>
                    </div>
                    {!collapsedSections.has(`user-${section.user.id}`) && (
                      section.pings.length > 0 ? (
                        renderPingList(section.pings, section.isCurrentUser)
                      ) : (
                        <div className="section-empty">
                          <p>No pings yet</p>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* History section */}
            {cleanedUpPings.length > 0 && (
              <div className="history-section">
                <div
                  className="history-header"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <span className="group-toggle">
                    {showHistory ? '▼' : '▶'}
                  </span>
                  <span className="history-icon">📜</span>
                  <span className="history-title">History</span>
                  <span className="group-count">{cleanedUpPings.length}</span>
                </div>
                {showHistory && (
                  <ul className="ping-list history-list">
                    {cleanedUpPings.map(ping => renderPingItem(ping, false, true))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}

        {selectedPing && editingId !== selectedPing.id && (
          <div className="selected-ping-details">
            <h3>Selected Ping</h3>
            {selectedPing.image && (
              <div
                className="detail-image clickable"
                onClick={() => openLightbox(selectedPing.image!)}
                title="Click to enlarge"
              >
                <img src={selectedPing.image} alt={selectedPing.name || 'Ping image'} />
                <div className="detail-image-overlay">
                  <span>🔍 Click to enlarge</span>
                </div>
              </div>
            )}
            <p className="detail-name">{selectedPing.name || 'Unnamed ping'}</p>
            {selectedPing.description && (
              <p className="detail-description">{selectedPing.description}</p>
            )}
          </div>
        )}
      </aside>

      {lightboxImage && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Full size" />
            <button className="lightbox-close" onClick={closeLightbox} title="Close">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
