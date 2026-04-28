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

// ==================== TESTS ADICIONALES ====================

describe('POST /create/:gameName - Additional cases', () => {
    it('creates game with custom boardSize', async () => {
        const res = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'medium_bot', boardSize: 7 })
        expect(res.status).toBe(201)
        expect(res.body.yen.size).toBe(7)
    })

    it('uses default values when botId and boardSize are omitted', async () => {
        const res = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({})
        expect(res.status).toBe(201)
        expect(res.body.yen.size).toBe(5)
    })

    it('creates game with beginner_bot', async () => {
        const res = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'beginner_bot', boardSize: 4 })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('gameId')
    })

    it('initializes yen with correct turn and players', async () => {
        const res = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        expect(res.body.yen.turn).toBe(0)
        expect(res.body.yen.players).toEqual(['B', 'R'])
    })
})

describe('GET /state/:id - Additional cases', () => {
    it('returns all game fields correctly', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'medium_bot', boardSize: 6 })
        const gameId = createRes.body.gameId

        const res = await request(app)
            .get(`/state/${gameId}`)
            .set(authHeader)
        
        expect(res.status).toBe(200)
        expect(res.body.gameId).toBe(gameId)
        expect(res.body.userId).toBe(validUserId)
        expect(res.body.botId).toBe('medium_bot')
        expect(res.body.yen.size).toBe(6)
        expect(res.body).toHaveProperty('createdAt')
        expect(res.body).toHaveProperty('updatedAt')
    })
})

describe('GET /list - Additional cases', () => {
    it('returns empty list when user has no games', async () => {
        const res = await request(app)
            .get('/list')
            .set(authHeader)
        expect(res.status).toBe(200)
        expect(res.body.total).toBe(0)
        expect(res.body.games).toEqual([])
    })

    it('returns multiple games for same user', async () => {
        await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'medium_bot', boardSize: 6 })

        const res = await request(app)
            .get('/list')
            .set(authHeader)
        
        expect(res.status).toBe(200)
        expect(res.body.total).toBe(2)
        expect(res.body.games).toHaveLength(2)
    })

    it('does not return games from other users', async () => {
        await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })

        const otherUserId = new mongoose.Types.ObjectId().toString()
        const res = await request(app)
            .get('/list')
            .set({ 'x-user-id': otherUserId })
        
        expect(res.status).toBe(200)
        expect(res.body.total).toBe(0)
    })

    it('includes game status in list', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        
        await request(app)
            .post(`/game/${createRes.body.gameId}/resign`)
            .set(authHeader)

        const res = await request(app)
            .get('/list')
            .set(authHeader)
        
        expect(res.body.games[0].status).toBe('resigned')
    })
})

describe('POST /game/:id/resign - Additional cases', () => {
    it('returns 400 when trying to resign a won game', async () => {
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: true, winner: 0 })

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
            .post(`/game/${gameId}/resign`)
            .set(authHeader)
        
        expect(res.status).toBe(400)
        expect(res.body.error).toContain('won')
    })

    it('returns 400 when trying to resign a lost game', async () => {
        nock(GAMEY).post('/v1/ybot/choose/random_bot').reply(200, { coords: { x: 1, y: 0 } })
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: true, winner: 1 })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await mongoose.model('Game').findByIdAndUpdate(gameId, { 'yen.turn': 1 })

        await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)

        const res = await request(app)
            .post(`/game/${gameId}/resign`)
            .set(authHeader)
        
        expect(res.status).toBe(400)
    })
})

describe('POST /game/:id/move/player - Additional cases', () => {
    it('returns 400 for coords with missing x', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const res = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { y: 0 } })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Coords (x,y) are mandatory')
    })

    it('returns 400 for coords with missing y', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const res = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0 } })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Coords (x,y) are mandatory')
    })

    it('returns 400 for negative coordinates', async () => {
        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const res = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: -1, y: 0 } })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Invalid move')
    })

    it('updates turn to 1 after player move', async () => {
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
        
        expect(res.body.yen.turn).toBe(1)
    })

    it('updates layout with correct player symbol', async () => {
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
        
        expect(res.body.yen.layout).toContain('B')
    })

    it('handles checkWin service failure gracefully', async () => {
        nock(GAMEY).post('/v1/ybot/checkWin').replyWithError('Service down')

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
        expect(res.body.yen.layout).toContain('B')
    })

    it('returns 400 when trying to move after game is won', async () => {
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: true, winner: 0 })

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

    it('multiple valid moves update layout correctly', async () => {
        nock(GAMEY).post('/v1/ybot/checkWin').times(3).reply(200, { game_over: false })
        nock(GAMEY).post('/v1/ybot/choose/random_bot').times(2).reply(200, { coords: { x: 1, y: 0 } })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        const move1 = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })
        
        expect(move1.body.yen.layout).toContain('B')

        await mongoose.model('Game').findByIdAndUpdate(gameId, { 'yen.turn': 1 })

        await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)

        const move2 = await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 1 } })
        
        const bCount = (move2.body.yen.layout.match(/B/g) || []).length
        expect(bCount).toBe(2)
    })
})

describe('POST /game/:id/move/bot - Additional cases', () => {
    it('updates turn to 0 after bot move', async () => {
        nock(GAMEY).post('/v1/ybot/choose/random_bot').reply(200, { coords: { x: 1, y: 0 } })
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: false })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await mongoose.model('Game').findByIdAndUpdate(gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)
        
        expect(res.body.yen.turn).toBe(0)
    })

    it('updates layout with bot symbol', async () => {
        nock(GAMEY).post('/v1/ybot/choose/random_bot').reply(200, { coords: { x: 1, y: 0 } })
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: false })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await mongoose.model('Game').findByIdAndUpdate(gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)
        
        expect(res.body.yen.layout).toContain('R')
    })

    it('bot move on cell already occupied returns 400', async () => {
        nock(GAMEY).post('/v1/ybot/choose/random_bot').reply(200, { coords: { x: 0, y: 0 } })
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

        await mongoose.model('Game').findByIdAndUpdate(gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)
        
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Bot produced invalid move')
    })

    it('uses different bot types correctly', async () => {
        nock(GAMEY).post('/v1/ybot/choose/beginner_bot').reply(200, { coords: { x: 2, y: 1 } })
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: false })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'beginner_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await mongoose.model('Game').findByIdAndUpdate(gameId, { 'yen.turn': 1 })

        const res = await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)
        
        expect(res.status).toBe(200)
    })
})

describe('GET /api/gamey/play - Additional cases', () => {
    it('accepts all valid bot_id values', async () => {
        const botIds = ['random_bot', 'medium_bot', 'beginner_bot']

        for (const botId of botIds) {
            nock(GAMEY).post(`/v1/ybot/choose/${botId}`).reply(200, { coords: { x: 1, y: 0 } })

            const res = await request(app)
                .get('/api/gamey/play')
                .query({ 
                    bot_id: botId,
                    position: JSON.stringify({ layout: './..',  size: 3, turn: 0, players: ['B', 'R'] }) 
                })
            
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('coords')
        }
    })

    it('uses medium_bot as default when bot_id is omitted', async () => {
        nock(GAMEY).post('/v1/ybot/choose/medium_bot').reply(200, { coords: { x: 1, y: 0 } })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ position: JSON.stringify({ layout: './..',  size: 3, turn: 0, players: ['B', 'R'] }) })
        
        expect(res.status).toBe(200)
    })

    it('returns 400 for invalid bot_id', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ 
                bot_id: 'invalid_bot',
                position: JSON.stringify({ layout: './..',  size: 3, turn: 0, players: ['B', 'R'] }) 
            })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toContain('Invalid bot_id')
    })

    it('returns 400 when position is missing', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ bot_id: 'random_bot' })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toContain('position')
    })

    it('returns 400 for malformed JSON in position', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ position: 'not-json' })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toContain('Invalid JSON')
    })

    it('returns 400 when layout is missing from position', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ position: JSON.stringify({ size: 3 }) })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toContain('layout')
    })

    it('returns 400 when size is missing from position', async () => {
        const res = await request(app)
            .get('/api/gamey/play')
            .query({ position: JSON.stringify({ layout: './..' }) })
        
        expect(res.status).toBe(400)
        expect(res.body.error).toContain('size')
    })

    it('handles 404 from gamey service', async () => {
        nock(GAMEY).post('/v1/ybot/choose/medium_bot').reply(404, { error: 'Not found' })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ position: JSON.stringify({ layout: './..',  size: 3, turn: 0, players: ['B', 'R'] }) })
        
        expect(res.status).toBe(404)
    })

    it('handles 400 from gamey service', async () => {
        nock(GAMEY).post('/v1/ybot/choose/medium_bot').reply(400, { error: 'Bad request' })

        const res = await request(app)
            .get('/api/gamey/play')
            .query({ position: JSON.stringify({ layout: './..',  size: 3, turn: 0, players: ['B', 'R'] }) })
        
        expect(res.status).toBe(400)
    })
})

describe('CORS headers', () => {
    it('sets CORS headers on requests', async () => {
        const res = await request(app).get('/health')
        
        expect(res.headers['access-control-allow-origin']).toBe('*')
    })

    it('handles OPTIONS preflight request', async () => {
        const res = await request(app).options('/health')
        
        expect(res.status).toBe(204)
    })
})

describe('Stats update integration', () => {
    it('calls stats service when game is won', async () => {
        const statsScope = nock(USERS)
            .post('/stats/update', { userId: validUserId, result: 'won' })
            .reply(200, { success: true })

        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: true, winner: 0 })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await request(app)
            .post(`/game/${gameId}/move/player`)
            .set(authHeader)
            .send({ coords: { x: 0, y: 0 } })

        expect(statsScope.isDone()).toBe(true)
    })

    it('calls stats service when game is resigned', async () => {
        const statsScope = nock(USERS)
            .post('/stats/update', { userId: validUserId, result: 'resigned' })
            .reply(200, { success: true })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await request(app)
            .post(`/game/${gameId}/resign`)
            .set(authHeader)

        expect(statsScope.isDone()).toBe(true)
    })

    it('continues when stats service is unavailable', async () => {
        nock(USERS).post('/stats/update').replyWithError('Stats service down')
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
        expect(res.body.status).toBe('won')
    })

    it('calls stats service when bot wins', async () => {
        const statsScope = nock(USERS)
            .post('/stats/update', { userId: validUserId, result: 'lost' })
            .reply(200, { success: true })

        nock(GAMEY).post('/v1/ybot/choose/random_bot').reply(200, { coords: { x: 1, y: 0 } })
        nock(GAMEY).post('/v1/ybot/checkWin').reply(200, { game_over: true, winner: 1 })

        const createRes = await request(app)
            .post('/create/standard')
            .set(authHeader)
            .send({ botId: 'random_bot', boardSize: 5 })
        const gameId = createRes.body.gameId

        await mongoose.model('Game').findByIdAndUpdate(gameId, { 'yen.turn': 1 })

        await request(app)
            .post(`/game/${gameId}/move/bot`)
            .set(authHeader)

        expect(statsScope.isDone()).toBe(true)
    })
})