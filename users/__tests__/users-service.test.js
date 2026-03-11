import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'

const { default: app } = await import('../users-service.js')

const User = globalThis.MockUser
const bcrypt = globalThis.mockBcrypt

describe('POST /register', () => {
  afterEach(() => vi.clearAllMocks())

  it('creates a new user successfully with valid data', async () => {
    User.findOne.mockResolvedValue(null)
    const res = await request(app)
      .post('/register')
      .send({ username: 'testuser', email: 'test@test.com', password: 'Password1' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('message', 'User created')
  })

  it('creates a new user with optional fields age and country', async () => {
    User.findOne.mockResolvedValue(null)
    const res = await request(app)
      .post('/register')
      .send({ username: 'testuser2', email: 'test2@test.com', password: 'Password1', age: 25, country: 'Spain' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('message', 'User created')
  })

  it('returns 409 if username or email already exists', async () => {
    User.findOne.mockResolvedValue({ username: 'testuser' })
    const res = await request(app)
      .post('/register')
      .send({ username: 'testuser', email: 'test@test.com', password: 'Password1' })
    expect(res.status).toBe(409)
    expect(res.body).toHaveProperty('error', 'Username or email are already in use')
  })

  it('returns 400 if username is missing', async () => {
    const res = await request(app).post('/register').send({ email: 'test@test.com', password: 'Password1' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 if username is too short', async () => {
    const res = await request(app).post('/register').send({ username: 'us', email: 'test@test.com', password: 'Password1' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/3 and 30/i)
  })

  it('returns 400 if username contains special characters', async () => {
    const res = await request(app).post('/register').send({ username: '@user!', email: 'test@test.com', password: 'Password1' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 if email is invalid', async () => {
    const res = await request(app).post('/register').send({ username: 'testuser', email: 'email.com', password: 'Password1' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 if password is too short', async () => {
    const res = await request(app).post('/register').send({ username: 'testuser', email: 'test@test.com', password: 'wasd1' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/8 and 64/i)
  })

  it('returns 400 if password has no numbers', async () => {
    const res = await request(app).post('/register').send({ username: 'testuser', email: 'test@test.com', password: 'qwertyuiop' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 if password has no letters', async () => {
    const res = await request(app).post('/register').send({ username: 'testuser', email: 'test@test.com', password: '12345678' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 if age is out of range', async () => {
    const res = await request(app).post('/register').send({ username: 'testuser', email: 'test@test.com', password: 'Password1', age: 200 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/0 and 120/i)
  })

  it('returns 400 if age is out of negative', async () => {
    const res = await request(app).post('/register').send({ username: 'testuser', email: 'test@test.com', password: 'Password1', age: -1 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/0 and 120/i)
  })

  it('returns 500 if MongoDB throws on save', async () => {
    User.findOne.mockResolvedValue(null)
    User.mockImplementationOnce(function() { this._id = "mocked_user_id"; this.save = vi.fn().mockRejectedValue(new Error("DB error")) })
    const res = await request(app).post('/register').send({ username: 'testuser', email: 'test@test.com', password: 'Password1' })
    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty('error')
  })
})

describe('POST /login', () => {
  afterEach(() => vi.clearAllMocks())

  it('logs in successfully with correct credentials', async () => {
    User.findOne.mockResolvedValue({ _id: 'userid123', username: 'testuser', password: 'hashed_password' })
    bcrypt.compare.mockResolvedValue(true)
    const res = await request(app).post('/login').send({ username: 'testuser', password: 'Password1' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token', 'mocked_token')
    expect(res.body).toHaveProperty('message', 'Login successfully')
  })

  it('returns 401 if user does not exist', async () => {
    User.findOne.mockResolvedValue(null)
    const res = await request(app).post('/login').send({ username: 'josegil', password: 'Password1' })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'Wrong credentials')
  })

  it('returns 401 if password is incorrect', async () => {
    User.findOne.mockResolvedValue({ _id: 'userid123', username: 'testuser', password: 'hashed_password' })
    bcrypt.compare.mockResolvedValue(false)
    const res = await request(app).post('/login').send({ username: 'testuser', password: 'wrong_password' })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'Wrong credentials')
  })

  it('returns 400 if username is missing', async () => {
    const res = await request(app).post('/login').send({ password: 'Password1' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', 'Username is mandatory')
  })

  it('returns 400 if password is missing', async () => {
    const res = await request(app).post('/login').send({ username: 'testuser' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', 'Password is mandatory')
  })

  it('returns 500 if MongoDB throws on findOne', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'))
    const res = await request(app).post('/login').send({ username: 'testuser', password: 'Password1' })
    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty('error')
  })
})