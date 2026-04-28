import { describe, it, expect, afterAll, afterEach, vi } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import nock from 'nock'

let mongoServer = null

if (!process.env.MONGODB_URI) {
    mongoServer = await MongoMemoryServer.create()
    process.env.MONGODB_URI = mongoServer.getUri()
}

const { default: app } = await import('../game-manager.js')

const GAMEY = 'http://localhost:4000'
const USERS = 'http://localhost:3000'

afterAll(async () => {
    await mongoose.disconnect()
    if (mongoServer) await mongoServer.stop()
}, 30000)

afterEach(async () => {
    nock.cleanAll()
    vi.restoreAllMocks()
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
})

const validUserId = new mongoose.Types.ObjectId().toString()
const authHeader = { 'x-user-id': validUserId }


describe('Authentication & Authorization', () => {
    it('POST /create/:gameName - returns 400 when userId is missing', async () => {
        const res = await request(app)
            .post('/create/standard')
            .send({ botId: 'random_bot', boardSize: 5 })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Missing userId')
    })

    it('POST /create/:gameName - returns 400 when userId is invalid format', async () => {
        const res = await request(app)
            .post('/create/standard')
            .set({ 'x-user-id': 'invalid-id' })
            .send({ botId: 'random_bot', boardSize: 5 })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Invalid userId')
    })

    it('POST /create/:gameName - returns 400 for unknown game type', async () => {
        const res = await request(app)
            .post('/create/unknown_game')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toContain('Unknown game type')
    })

    it('GET /state/:id - returns 401 when userId is missing', async () => {
        const res = await request(app)
            .get('/state/507f1f77bcf86cd799439011')
        
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Unauthorized')
    })

    it('GET /state/:id - returns 404 when game not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .get(`/state/${nonExistentId}`)
            .set(authHeader)
        
        expect(res.status).toBe(404)
        expect(res.body.error).toBe('Game not found')
    })

    it('GET /state/:id - returns 403 when accessing another user game', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const otherUserId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .get(`/state/${createRes.body.gameId}`)
            .set({ 'x-user-id': otherUserId })
        
        expect(res.status).toBe(403)
        expect(res.body.error).toBe('Forbidden')
    })

    it('POST /game/:id/move/player - returns 401 when userId is missing', async () => {
        const res = await request(app)
            .post('/game/507f1f77bcf86cd799439011/move/player')
            .send({ coords: { x: 0, y: 0 } })
        
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Unauthorized')
    })

    it('POST /game/:id/move/player - returns 404 when game not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .post(`/game/${nonExistentId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        
        expect(res.status).toBe(404)
        expect(res.body.error).toBe('Game not found')
    })

    it('POST /game/:id/move/player - returns 403 when accessing another user game', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const otherUserId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/player`)
            .set({ 'x-user-id': otherUserId })
            .send({ coords: { x: 0, y: 0 } })
        
        expect(res.status).toBe(403)
        expect(res.body.error).toBe('Forbidden')
    })

    it('POST /game/:id/move/bot - returns 401 when userId is missing', async () => {
        const res = await request(app)
            .post('/game/507f1f77bcf86cd799439011/move/bot')
        
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Unauthorized')
    })

    it('POST /game/:id/move/bot - returns 404 when game not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .post(`/game/${nonExistentId}/move/bot`)
            .set(authHeader)
        
        expect(res.status).toBe(404)
        expect(res.body.error).toBe('Game not found')
    })

    it('POST /game/:id/move/bot - returns 403 when accessing another user game', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const otherUserId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/bot`)
            .set({ 'x-user-id': otherUserId })
        
        expect(res.status).toBe(403)
        expect(res.body.error).toBe('Forbidden')
    })

    it('POST /game/:id/resign - returns 401 when userId is missing', async () => {
        const res = await request(app)
            .post('/game/507f1f77bcf86cd799439011/resign')
        
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Unauthorized')
    })

    it('POST /game/:id/resign - returns 404 when game not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .post(`/game/${nonExistentId}/resign`)
            .set(authHeader)
        
        expect(res.status).toBe(404)
        expect(res.body.error).toBe('Game not found')
    })

    it('POST /game/:id/resign - returns 403 when accessing another user game', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const otherUserId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/resign`)
            .set({ 'x-user-id': otherUserId })
        
        expect(res.status).toBe(403)
        expect(res.body.error).toBe('Forbidden')
    })

    it('GET /list - returns 401 when userId is missing', async () => {
        const res = await request(app).get('/list')
        
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Unauthorized')
    })

    it('GET /list - returns 401 when userId is missing', async () => {
        const res = await request(app).get('/list')
        
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Unauthorized')
    })

    it('GET /list - returns 400 for invalid userId format', async () => {
        const res = await request(app)
            .get('/list')
            .set({ 'x-user-id': 'invalid-format' })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Invalid user ID format')
    })
})

describe('Game Logic Edge Cases', () => {
    it('POST /game/:id/move/player - returns 400 when coords object is missing', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/player`)
            .set(authHeader)
            .send({})
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Coords (x,y) are mandatory')
    })

    it('POST /game/:id/move/player - returns 400 when x is 0 but y is undefined', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0 } })
        
        expect(res.status).toBe(400)
    })

    it('POST /game/:id/move/player - returns 400 for out of bounds coordinates', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 10, y: 10 } })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Invalid move')
    })

    it('POST /game/:id/move/player - returns 400 when cell is occupied', async () => {
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: false })

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
        expect(res.body.error).toBe('Invalid move')
    })

    it('POST /game/:id/move/bot - returns 503 when gamey service is unavailable', async () => {
        nock(GAMEY).post('/v1/ybot/choose/random_bot').replyWithError('Connection refused')

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        await mongoose.model('Game').findByIdAndUpdate(createRes.body.gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/bot`)
            .set(authHeader)
        
        expect(res.status).toBe(503)
        expect(res.body.error).toBe('Bot unavailable')
    })

    it('POST /game/:id/move/bot - returns 400 when game is already resigned', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const gameId = createRes.body.gameId

        await request(app)
            .post(`/game/${gameId}/resign`)
            .set(authHeader)

        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)
        
        expect(res.status).toBe(400)
        expect(res.body.error).toContain('resigned')
    })
})

describe('Health & Module Export', () => {
    it('GET /health - returns ok status', async () => {
        const res = await request(app).get('/health')
        
        expect(res.status).toBe(200)
        expect(res.body.status).toBe('ok')
        expect(res.body.service).toBe('gamemanager')
    })
})

describe('Error Handling', () => {
    it('handles database errors gracefully on game creation', async () => {
        const saveSpy = vi.spyOn(mongoose.Model.prototype, 'save')
            .mockRejectedValueOnce(new Error('Database error'))

        const res = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Database error')
        
        saveSpy.mockRestore()
    })

    it('handles database errors on state retrieval', async () => {
        const findByIdSpy = vi.spyOn(mongoose.Model, 'findById')
            .mockRejectedValueOnce(new Error('Database error'))

        const res = await request(app)
            .get('/state/507f1f77bcf86cd799439011')
            .set(authHeader)
        
        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Database error')
        
        findByIdSpy.mockRestore()
    })

    it('handles database errors on player move', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })

        const saveSpy = vi.spyOn(mongoose.Model.prototype, 'save')
            .mockRejectedValueOnce(new Error('Database error'))

        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        
        expect(res.status).toBe(500)
        
        saveSpy.mockRestore()
    })

    it('handles database errors on bot move', async () => {
        nock(GAMEY).post('/v1/ybot/choose/random_bot').reply(200, { coords: { x: 1, y: 0 } })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })

        await mongoose.model('Game').findByIdAndUpdate(createRes.body.gameId, { 'yen.turn': 1 })

        const saveSpy = vi.spyOn(mongoose.Model.prototype, 'save')
            .mockRejectedValueOnce(new Error('Database error'))

        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/bot`)
            .set(authHeader)
        
        expect(res.status).toBe(500)
        
        saveSpy.mockRestore()
    })

    it('handles database errors on resign', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })

        const saveSpy = vi.spyOn(mongoose.Model.prototype, 'save')
            .mockRejectedValueOnce(new Error('Database error'))

        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/resign`)
            .set(authHeader)
        
        expect(res.status).toBe(500)
        
        saveSpy.mockRestore()
    })

    it('handles database errors on list games', async () => {
        const findSpy = vi.spyOn(mongoose.Model, 'find')
            .mockImplementationOnce(() => {
                throw new Error('Database error')
            })

        const res = await request(app)
            .get('/list')
            .set(authHeader)
        
        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Internal server error')
        
        findSpy.mockRestore()
    })
})