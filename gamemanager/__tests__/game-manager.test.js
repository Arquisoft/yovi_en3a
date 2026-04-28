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

    it('POST /game/:id/move/player - returns 400 when game is already won', async () => {
        nock(GAMEY)
            .post('/v1/ybot/checkWin')
            .reply(200, { game_over: true, winner: 0 })
        
        nock(USERS)
            .post('/stats/update')
            .reply(200, { success: true })

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
            .send({ coords: { x: 1, y: 0 } })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toContain('won')
    })

    it('POST /game/:id/move/player - player wins the game', async () => {
        nock(GAMEY)
            .post('/v1/ybot/checkWin')
            .reply(200, { game_over: true, winner: 0 })
        
        nock(USERS)
            .post('/stats/update')
            .reply(200, { success: true })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        
        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Game over')
        expect(res.body.status).toBe('won')
    })

    it('POST /game/:id/move/player - player loses the game', async () => {
        nock(GAMEY)
            .post('/v1/ybot/checkWin')
            .reply(200, { game_over: true, winner: 1 })
        
        nock(USERS)
            .post('/stats/update')
            .reply(200, { success: true })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        
        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Game over')
        expect(res.body.status).toBe('lost')
    })

    it('POST /game/:id/move/bot - bot wins the game', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/random_bot')
            .reply(200, { coords: { x: 1, y: 0 } })

        nock(GAMEY)
            .post('/v1/ybot/checkWin')
            .reply(200, { game_over: true, winner: 1 })
        
        nock(USERS)
            .post('/stats/update')
            .reply(200, { success: true })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        await mongoose.model('Game').findByIdAndUpdate(createRes.body.gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/bot`)
            .set(authHeader)
        
        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Game over')
        expect(res.body.status).toBe('lost')
    })

    it('POST /game/:id/move/bot - player wins after bot move', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/random_bot')
            .reply(200, { coords: { x: 1, y: 0 } })

        nock(GAMEY)
            .post('/v1/ybot/checkWin')
            .reply(200, { game_over: true, winner: 0 })
        
        nock(USERS)
            .post('/stats/update')
            .reply(200, { success: true })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        await mongoose.model('Game').findByIdAndUpdate(createRes.body.gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/bot`)
            .set(authHeader)
        
        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Game over')
        expect(res.body.status).toBe('won')
    })

    it('POST /game/:id/move/player - handles updateStats failure gracefully', async () => {
        nock(GAMEY)
            .post('/v1/ybot/checkWin')
            .reply(200, { game_over: true, winner: 0 })
        
        nock(USERS)
            .post('/stats/update')
            .replyWithError('Stats service down')

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        
        expect(res.status).toBe(200)
        expect(res.body.status).toBe('won')
    })

    it('POST /game/:id/resign - successfully resigns and updates stats', async () => {
        nock(USERS)
            .post('/stats/update')
            .reply(200, { success: true })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/resign`)
            .set(authHeader)
        
        expect(res.status).toBe(200)
        expect(res.body.status).toBe('resigned')
    })

    it('POST /game/:id/resign - handles updateStats failure gracefully', async () => {
        nock(USERS)
            .post('/stats/update')
            .replyWithError('Stats service down')

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/resign`)
            .set(authHeader)
        
        expect(res.status).toBe(200)
        expect(res.body.status).toBe('resigned')
    })
})

describe('GET /api/gamey/play', () => {
    it('returns 400 when position parameter is missing', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ bot_id: 'random_bot' })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('`position` query parameter is required')
    })

    it('returns 400 when position is invalid JSON', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'random_bot',
                position: '{invalid json}'
            })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Invalid JSON in `position` parameter')
    })

    it('returns 400 when position lacks layout field', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'random_bot',
                position: JSON.stringify({ size: 5 })
            })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('`position` must include at least `layout` and `size`')
    })

    it('returns 400 when position lacks size field', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'random_bot',
                position: JSON.stringify({ layout: './/..//.../....' })
            })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('`position` must include at least `layout` and `size`')
    })

    it('returns 400 for invalid bot_id', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'invalid_bot',
                position: JSON.stringify({ layout: './/..//.../....', size: 5 })
            })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Invalid bot_id. Allowed values: random_bot, medium_bot, beginner_bot')
    })

    it('successfully returns bot coordinates for random_bot', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/random_bot')
            .reply(200, { coords: { x: 2, y: 1 } })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'random_bot',
                position: JSON.stringify({ 
                    layout: './/..//.../....', 
                    size: 5,
                    turn: 0,
                    players: ['B', 'R']
                })
            })
        
        expect(res.status).toBe(200)
        expect(res.body.coords).toEqual({ x: 2, y: 1 })
    })

    it('successfully returns bot coordinates for medium_bot', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/medium_bot')
            .reply(200, { coords: { x: 1, y: 2 } })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'medium_bot',
                position: JSON.stringify({ 
                    layout: './/..//.../....', 
                    size: 5 
                })
            })
        
        expect(res.status).toBe(200)
        expect(res.body.coords).toEqual({ x: 1, y: 2 })
    })

    it('successfully returns bot coordinates for beginner_bot', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/beginner_bot')
            .reply(200, { coords: { x: 0, y: 0 } })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'beginner_bot',
                position: JSON.stringify({ 
                    layout: './/..//.../....', 
                    size: 5 
                })
            })
        
        expect(res.status).toBe(200)
        expect(res.body.coords).toEqual({ x: 0, y: 0 })
    })

    it('defaults to medium_bot when bot_id is not provided', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/medium_bot')
            .reply(200, { coords: { x: 3, y: 1 } })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                position: JSON.stringify({ 
                    layout: './/..//.../....', 
                    size: 5 
                })
            })
        
        expect(res.status).toBe(200)
        expect(res.body.coords).toEqual({ x: 3, y: 1 })
    })

    it('returns 504 when gamey service times out', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/random_bot')
            .delay(6000)
            .reply(200, { coords: { x: 0, y: 0 } })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'random_bot',
                position: JSON.stringify({ 
                    layout: './/..//.../....', 
                    size: 5 
                })
            })
        
        expect(res.status).toBe(504)
        expect(res.body.error).toBe('Gamey service timeout')
    }, 10000)

    it('returns gamey service status when response is not ok', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/random_bot')
            .reply(400, { error: 'Invalid position format' })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'random_bot',
                position: JSON.stringify({ 
                    layout: './/..//.../....', 
                    size: 5 
                })
            })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Invalid position format')
    })

    it('handles non-JSON error response from gamey service', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/random_bot')
            .reply(500, 'Internal Server Error')

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'random_bot',
                position: JSON.stringify({ 
                    layout: './/..//.../....', 
                    size: 5 
                })
            })
        
        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Gamey service error')
    })

    it('returns 500 for unexpected errors', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/random_bot')
            .replyWithError({ message: 'Network error', code: 'ECONNREFUSED' })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'random_bot',
                position: JSON.stringify({ 
                    layout: './/..//.../....', 
                    size: 5 
                })
            })
        
        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Internal Server Error')
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

describe('Additional Coverage', () => {
    it('GET /state/:id - successfully retrieves game state', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const res = await request(app)
            .get(`/state/${createRes.body.gameId}`)
            .set(authHeader)
        
        expect(res.status).toBe(200)
        expect(res.body.gameId).toBe(createRes.body.gameId)
        expect(res.body.userId).toBe(validUserId)
        expect(res.body.botId).toBe('random_bot')
    })

    it('GET /list - returns empty list for user with no games', async () => {
        const res = await request(app)
            .get('/list')
            .set(authHeader)
        
        expect(res.status).toBe(200)
        expect(res.body.total).toBe(0)
        expect(res.body.games).toEqual([])
    })

    it('GET /list - returns user games list', async () => {
        await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })

        await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'medium_bot', boardSize: 7 })
        
        const res = await request(app)
            .get('/list')
            .set(authHeader)
        
        expect(res.status).toBe(200)
        expect(res.body.total).toBe(2)
        expect(res.body.games).toHaveLength(2)
    })

    it('POST /game/:id/move/player - successfully makes a move', async () => {
        nock(GAMEY)
            .post('/v1/ybot/checkWin')
            .reply(200, { game_over: false })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        
        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Move applied')
        expect(res.body.yen.turn).toBe(1)
    })

    it('POST /game/:id/move/bot - successfully makes a bot move', async () => {
        nock(GAMEY)
            .post('/v1/ybot/choose/random_bot')
            .reply(200, { coords: { x: 1, y: 0 } })

        nock(GAMEY)
            .post('/v1/ybot/checkWin')
            .reply(200, { game_over: false })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        await mongoose.model('Game').findByIdAndUpdate(createRes.body.gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${createRes.body.gameId}/move/bot`)
            .set(authHeader)
        
        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Bot moved')
        expect(res.body.yen.turn).toBe(0)
    })

    it('POST /create/:gameName - creates game with default parameters', async () => {
        const res = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({})
        
        expect(res.status).toBe(201)
        expect(res.body.message).toBe('Game created sucessfully')
        expect(res.body.yen.size).toBe(5)
    })
})