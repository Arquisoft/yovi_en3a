import { describe, it, expect, afterAll, afterEach, vi } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'

vi.mock('axios', () => {
    const mockPost = vi.fn()
    return {
        default: {
            post: mockPost,
            get: vi.fn(),
        }
    }
})

let mongoServer
mongoServer = await MongoMemoryServer.create()
const uri = mongoServer.getUri()
process.env.MONGODB_URI = uri

const { default: app } = await import('../game-manager.js')
const { default: axios } = await import('axios')

afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
}, 30000)

afterEach(async () => {
    vi.clearAllMocks()
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
})

const validUserId = new mongoose.Types.ObjectId().toString()
const authHeader = { 'x-user-id': validUserId }

describe('GET /health', () => {
    it('returns ok status', async () => {
        const res = await request(app).get('/health')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('status', 'ok')
        expect(res.body).toHaveProperty('service', 'gamemanager')
    })
})

describe('POST /create/:gameName', () => {
    it('creates a new game successfully', async () => {
        const res = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('gameId')
        expect(res.body).toHaveProperty('yen')
        expect(res.body).toHaveProperty('status', 'ongoing')
    })

    it('returns 400 if userId is missing', async () => {
        const res = await request(app)
            .post('/create/standard')
            .send({ botId: 'random_bot', boardSize: 5 })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    it('returns 400 if gameName is invalid', async () => {
        const res = await request(app)
            .post('/create/invalidgame')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    it('returns 400 if userId is invalid', async () => {
        const res = await request(app)
            .post('/create/standard')
            .set({ 'x-user-id': 'notavalidid' })
            .send({ botId: 'random_bot', boardSize: 5 })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error', 'Invalid userId')
    })
})

describe('GET /state/:id', () => {
    it('returns game state', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const res = await request(app)
            .get(`/state/${gameId}`)
            .set(authHeader)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('gameId')
        expect(res.body).toHaveProperty('yen')
        expect(res.body).toHaveProperty('status')
    })

    it('returns 404 if game not found', async () => {
        const res = await request(app)
            .get('/state/123456789012345678901234')
            .set(authHeader)
        expect(res.status).toBe(404)
        expect(res.body).toHaveProperty('error', 'Game not found')
    })
})

describe('GET /list', () => {
    it('returns list of games for user', async () => {
        await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })

        const res = await request(app)
            .get('/list')
            .set(authHeader)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('userId')
        expect(res.body).toHaveProperty('total')
        expect(res.body).toHaveProperty('games')
    })

    it('returns 401 if userId is missing', async () => {
        const res = await request(app).get('/list')
        expect(res.status).toBe(401)
    })
})

describe('POST /game/:id/resign', () => {
    it('resigns a game successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const res = await request(app)
            .post(`/game/${gameId}/resign`)
            .set(authHeader)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('message', 'Game resigned')
        expect(res.body).toHaveProperty('status', 'resigned')
    })

    it('returns 401 if userId is missing', async () => {
        const res = await request(app)
            .post('/game/123456789012345678901234/resign')
        expect(res.status).toBe(401)
    })

    it('returns 404 if game not found', async () => {
        const res = await request(app)
            .post('/game/123456789012345678901234/resign')
            .set(authHeader)
        expect(res.status).toBe(404)
        expect(res.body).toHaveProperty('error', 'Game not found')
    })

    it('returns 403 if user is not the owner', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const otherUserId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .post(`/game/${gameId}/resign`)
            .set({ 'x-user-id': otherUserId })
        expect(res.status).toBe(403)
        expect(res.body).toHaveProperty('error', 'Forbidden')
    })

    it('returns 400 if game is already resigned', async () => {
        axios.post.mockResolvedValue({ data: {} })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await request(app).post(`/game/${gameId}/resign`).set(authHeader)

        const res = await request(app)
            .post(`/game/${gameId}/resign`)
            .set(authHeader)
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })
})

describe('POST /game/:id/move/player', () => {
    it('applies a player move successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: { game_over: false } })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const res = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('message', 'Move applied')
        expect(res.body).toHaveProperty('yen')
        expect(res.body.yen.turn).toBe(1)
    })

    it('returns 401 if userId is missing', async () => {
        const res = await request(app)
            .post('/game/123456789012345678901234/move/player')
            .send({ coords: { x: 0, y: 0 } })
        expect(res.status).toBe(401)
    })

    it('returns 400 if coords are missing', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const res = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({})
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error', 'Coords (x,y) are mandatory')
    })

    it('returns 404 if game not found', async () => {
        const res = await request(app)
            .post('/game/123456789012345678901234/move/player')
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        expect(res.status).toBe(404)
        expect(res.body).toHaveProperty('error', 'Game not found')
    })

    it('returns 403 if user is not the owner', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const otherUserId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set({ 'x-user-id': otherUserId })
            .send({ coords: { x: 0, y: 0 } })
        expect(res.status).toBe(403)
        expect(res.body).toHaveProperty('error', 'Forbidden')
    })

    it('returns 400 if game is already resigned', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await request(app).post(`/game/${gameId}/resign`).set(authHeader)

        const res = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    it('returns 400 if move is invalid (cell already occupied)', async () => {
        axios.post.mockResolvedValueOnce({ data: { game_over: false } })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })

        const res = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error', 'Invalid move')
    })

    it('returns 400 if coords are out of bounds', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const res = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 99, y: 99 } })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error', 'Invalid move')
    })
})

describe('POST /game/:id/move/bot', () => {
    it('returns 401 if userId is missing', async () => {
        const res = await request(app)
            .post('/game/123456789012345678901234/move/bot')
        expect(res.status).toBe(401)
    })

    it('returns 404 if game not found', async () => {
        const res = await request(app)
            .post('/game/123456789012345678901234/move/bot')
            .set(authHeader)
        expect(res.status).toBe(404)
        expect(res.body).toHaveProperty('error', 'Game not found')
    })

    it('returns 403 if user is not the owner', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const otherUserId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set({ 'x-user-id': otherUserId })
        expect(res.status).toBe(403)
        expect(res.body).toHaveProperty('error', 'Forbidden')
    })

    it('returns 400 if game is already resigned', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await request(app).post(`/game/${gameId}/resign`).set(authHeader)

        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    it('returns 503 if bot service is unavailable', async () => {
        axios.post.mockRejectedValue(new Error('Bot unavailable'))

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)
        expect(res.status).toBe(503)
        expect(res.body).toHaveProperty('error', 'Bot unavailable')
    })
})