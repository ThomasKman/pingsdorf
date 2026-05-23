import { describe, it, expect } from 'vitest'
import { MOCK_USERS } from './User'

describe('MOCK_USERS', () => {
  it('exports at least two users', () => {
    expect(MOCK_USERS.length).toBeGreaterThanOrEqual(2)
  })

  it('each user has required fields populated', () => {
    for (const user of MOCK_USERS) {
      expect(user.id).toBeTruthy()
      expect(user.name).toBeTruthy()
      expect(user.color).toMatch(/^#[0-9a-f]{3,6}$/i)
    }
  })

  it('user ids are unique', () => {
    const ids = MOCK_USERS.map(u => u.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
