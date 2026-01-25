import { useState, useMemo } from 'react'
import type { Ping } from '../types/Ping'
import type { Room } from '../types/Room'
import './Sidebar.css'

interface SidebarProps {
  pings: Ping[]
  rooms: Room[]
  selectedPingId: string | null
  onSelectPing: (id: string) => void
  onUpdatePing: (id: string, updates: Partial<Pick<Ping, 'name' | 'description' | 'image'>>) => void
  onDeletePing: (id: string) => void
}

interface PingGroup {
  id: string
  name: string
  color?: string
  pings: Ping[]
}

export function Sidebar({ pings, rooms, selectedPingId, onSelectPing, onUpdatePing, onDeletePing }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const selectedPing = pings.find(p => p.id === selectedPingId)

  // Group pings by room
  const pingGroups = useMemo((): PingGroup[] => {
    const groups: PingGroup[] = []
    const roomMap = new Map<string, Room>()
    rooms.forEach(room => roomMap.set(room.id, room))

    // Create groups for each room
    rooms.forEach(room => {
      const roomPings = pings.filter(p => p.roomId === room.id)
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
    const otherPings = pings.filter(p => !p.roomId || !roomMap.has(p.roomId))
    if (otherPings.length > 0) {
      groups.push({
        id: 'other',
        name: 'Other',
        pings: otherPings,
      })
    }

    return groups
  }, [pings, rooms])

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
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

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Pings</h2>
          <span className="ping-count">{pings.length}</span>
        </div>

        {pings.length === 0 ? (
          <div className="sidebar-empty">
            <p>No pings yet</p>
            <p className="hint">Click "Add Ping" to add one</p>
          </div>
        ) : rooms.length === 0 ? (
          // No rooms defined, show flat list
          <ul className="ping-list">
            {pings.map(ping => (
              <li
                key={ping.id}
                className={`ping-item ${selectedPingId === ping.id ? 'selected' : ''}`}
                onClick={() => onSelectPing(ping.id)}
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
                      <span className="ping-time">
                        {new Date(ping.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="ping-actions">
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
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          // Rooms defined, show grouped list
          <div className="ping-groups">
            {pingGroups.map(group => (
              <div key={group.id} className="ping-group">
                <div
                  className="ping-group-header"
                  onClick={() => toggleGroup(group.id)}
                >
                  <span className="group-toggle">
                    {collapsedGroups.has(group.id) ? '▶' : '▼'}
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
                {!collapsedGroups.has(group.id) && (
                  <ul className="ping-list">
                    {group.pings.map(ping => (
                      <li
                        key={ping.id}
                        className={`ping-item ${selectedPingId === ping.id ? 'selected' : ''}`}
                        onClick={() => onSelectPing(ping.id)}
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
                              <span className="ping-time">
                                {new Date(ping.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="ping-actions">
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
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
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
