import { vi } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const mongoose = require('mongoose')
mongoose.connect = vi.fn().mockResolvedValue(true)

const MockUser = vi.fn().mockImplementation(function(data) {
  Object.assign(this, data)
  this._id = 'mocked_user_id'
  this.save = vi.fn().mockResolvedValue(true)
})
MockUser.findOne = vi.fn()
globalThis.MockUser = MockUser

const MockStats = vi.fn().mockImplementation(function() {
  this.save = vi.fn().mockResolvedValue(true)
})
globalThis.MockStats = MockStats

const userPath = require.resolve('./models/user.js')
require.cache[userPath] = { id: userPath, filename: userPath, loaded: true, exports: MockUser }

const statsPath = require.resolve('./models/stats.js')
require.cache[statsPath] = { id: statsPath, filename: statsPath, loaded: true, exports: MockStats }

const mockBcrypt = {
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
}
globalThis.mockBcrypt = mockBcrypt
const bcryptPath = require.resolve('bcryptjs')
require.cache[bcryptPath] = { id: bcryptPath, filename: bcryptPath, loaded: true, exports: mockBcrypt }

const mockJwt = { sign: vi.fn().mockReturnValue('mocked_token') }
globalThis.mockJwt = mockJwt
const jwtPath = require.resolve('jsonwebtoken')
require.cache[jwtPath] = { id: jwtPath, filename: jwtPath, loaded: true, exports: mockJwt }