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

    it('returns 401 if userId is missing', async () => {
        const res = await request(app)
            .get('/state/123456789012345678901234')
        expect(res.status).toBe(401)
        expect(res.body).toHaveProperty('error', 'Unauthorized')
    })

    it('returns 403 if user is not the owner', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const otherUserId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .get(`/state/${gameId}`)
            .set({ 'x-user-id': otherUserId })
        expect(res.status).toBe(403)
        expect(res.body).toHaveProperty('error', 'Forbidden')
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
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: false })

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

    it('player wins after their move', async () => {
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: true, winner: 0 })

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
        expect(res.body).toHaveProperty('message', 'Game over')
        expect(res.body).toHaveProperty('status', 'won')
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
        nock(GAMEY).post(`/v1/ybot/choose/random_bot`).replyWithError('Bot unavailable')

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

    it('bot moves successfully and game continues', async () => {
        nock(GAMEY).post('/v1/ybot/choose/random_bot').reply(200, { coords: { x: 1, y: 0 } })
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: false })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        // Put game in bot's turn
        await mongoose.model('Game').findByIdAndUpdate(gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('message', 'Bot moved')
        expect(res.body.yen.turn).toBe(0)
    })

    it('bot wins the game', async () => {
        nock(GAMEY).post('/v1/ybot/choose/random_bot').reply(200, { coords: { x: 1, y: 0 } })
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: true, winner: 1 })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await mongoose.model('Game').findByIdAndUpdate(gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('message', 'Game over')
        expect(res.body).toHaveProperty('status', 'lost')
    })

    it('returns 400 if bot produces invalid move', async () => {
        nock(GAMEY).post('/v1/ybot/choose/random_bot').reply(200, { coords: { x: 99, y: 99 } })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await mongoose.model('Game').findByIdAndUpdate(gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error', 'Bot produced invalid move')
    })
})

describe('GET /api/gamey/play', () => {
    it('returns bot coords for valid yen query params', async () => {
        nock(GAMEY).post('/v1/ybot/choose/medium_bot').reply(200, { coords: { x: 1, y: 0 } })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ layout: './..',  size: '3', turn: '0', 'players[0]': 'B', 'players[1]': 'R' })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('coords')
    })

    it('returns 400 if layout or size is missing', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ turn: '0' })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    it('returns error from gamey service', async () => {
        nock(GAMEY).post('/v1/ybot/choose/medium_bot').reply(503, { error: 'Service unavailable' })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ layout: './..',  size: '3', turn: '0' })
        expect(res.status).toBe(503)
        expect(res.body).toHaveProperty('error')
    })
})

describe('500 errors — database failure', () => {
    const Game = mongoose.model('Game')
    const dbError = new Error('DB error')

    it('POST /create returns 500', async () => {
        vi.spyOn(Game.prototype, 'save').mockRejectedValueOnce(dbError)
        const res = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        expect(res.status).toBe(500)
    })

    it('GET /state returns 500', async () => {
        vi.spyOn(Game, 'findById').mockRejectedValueOnce(dbError)
        const res = await request(app)
            .get('/state/123456789012345678901234')
            .set(authHeader)
        expect(res.status).toBe(500)
    })

    it('GET /list returns 500', async () => {
        vi.spyOn(Game, 'find').mockRejectedValueOnce(dbError)
        const res = await request(app).get('/list').set(authHeader)
        expect(res.status).toBe(500)
    })

    it('POST /resign returns 500', async () => {
        vi.spyOn(Game, 'findById').mockRejectedValueOnce(dbError)
        const res = await request(app)
            .post('/game/123456789012345678901234/resign')
            .set(authHeader)
        expect(res.status).toBe(500)
    })

    it('POST /move/player returns 500', async () => {
        vi.spyOn(Game, 'findById').mockRejectedValueOnce(dbError)
        const res = await request(app)
            .post('/game/123456789012345678901234/move/player')
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        expect(res.status).toBe(500)
    })

    it('POST /move/bot returns 500', async () => {
        vi.spyOn(Game, 'findById').mockRejectedValueOnce(dbError)
        const res = await request(app)
            .post('/game/123456789012345678901234/move/bot')
            .set(authHeader)
        expect(res.status).toBe(500)
    })
})