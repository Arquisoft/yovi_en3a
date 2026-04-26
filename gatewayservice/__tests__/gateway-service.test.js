import { describe, it, expect, afterEach } from 'vitest'
import request from 'supertest'
import nock from 'nock'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'not-a-real-key-just-for-testing'
process.env.JWT_SECRET = JWT_SECRET

const { default: app } = await import('../gateway-service.js')

const USERS = 'http://localhost:3000'
const GAME_MANAGER = 'http://localhost:5000'

const validToken = jwt.sign({ userId: 'user123', username: 'testuser' }, JWT_SECRET)

afterEach(() => nock.cleanAll())

describe('GET /status', () => {
    it('returns ok status', async () => {
        const res = await request(app).get('/status')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('status', 'ok')
        expect(res.body).toHaveProperty('service', 'gatewayservice')
    })
})

describe('authMiddleware', () => {
    it('returns 401 if no token provided', async () => {
        const res = await request(app).get('/api/users/stats/user123')
        expect(res.status).toBe(401)
        expect(res.body).toHaveProperty('error', 'No token provided')
    })

    it('returns 401 if token is invalid', async () => {
        const res = await request(app)
            .get('/api/users/stats/user123')
            .set('Authorization', 'Bearer invalidtoken')
        expect(res.status).toBe(401)
        expect(res.body).toHaveProperty('error', 'Invalid or expired token')
    })
})

describe('GET /api/users (no auth required)', () => {
    it('proxies POST /register to users service', async () => {
        nock(USERS).post('/register').reply(201, { message: 'User created', userId: 'abc' })
        const res = await request(app)
            .post('/api/users/register')
            .send({ username: 'test', password: 'pass123' })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('message', 'User created')
    })

    it('returns upstream error if users service fails', async () => {
        nock(USERS).post('/register').reply(409, { error: 'Username already in use' })
        const res = await request(app)
            .post('/api/users/register')
            .send({ username: 'existing' })
        expect(res.status).toBe(409)
        expect(res.body).toHaveProperty('error', 'Username already in use')
    })

    it('returns 500 if users service is unreachable', async () => {
        nock(USERS).post('/register').replyWithError('Connection refused')
        const res = await request(app)
            .post('/api/users/register')
            .send({})
        expect(res.status).toBe(500)
        expect(res.body).toHaveProperty('error', 'Internal gateway error')
    })
})

describe('GET /api/users/stats (auth required)', () => {
    it('proxies stats with valid token', async () => {
        nock(USERS).get('/stats/user123').reply(200, { gamesPlayed: 5, wins: 3 })
        const res = await request(app)
            .get('/api/users/stats/user123')
            .set('Authorization', `Bearer ${validToken}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('gamesPlayed', 5)
    })
})

describe('POST /api/game-manager (auth required)', () => {
    it('returns 401 without token', async () => {
        const res = await request(app).post('/api/game-manager/create/standard')
        expect(res.status).toBe(401)
        expect(res.body).toHaveProperty('error', 'No token provided')
    })

    it('proxies to game-manager with valid token', async () => {
        nock(GAME_MANAGER).post('/create/standard').reply(201, { gameId: 'abc123' })
        const res = await request(app)
            .post('/api/game-manager/create/standard')
            .set('Authorization', `Bearer ${validToken}`)
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('gameId', 'abc123')
    })

    it('returns upstream error from game-manager', async () => {
        nock(GAME_MANAGER).post('/create/standard').reply(400, { error: 'Bad request' })
        const res = await request(app)
            .post('/api/game-manager/create/standard')
            .set('Authorization', `Bearer ${validToken}`)
        expect(res.status).toBe(400)
    })
})

describe('GET /play', () => {
    it('returns 400 if position is missing', async () => {
        const res = await request(app).get('/play')
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    it('proxies to game-manager with position param', async () => {
        const position = JSON.stringify({ layout: './..',  size: 3, turn: 0 })
        nock(GAME_MANAGER).get('/api/gamey/play').query(true).reply(200, { coords: { x: 1, y: 0 } })
        const res = await request(app)
            .get('/play')
            .query({ position })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('coords')
    })

    it('returns 500 if game-manager is unreachable', async () => {
        const position = JSON.stringify({ layout: './..',  size: 3, turn: 0 })
        nock(GAME_MANAGER).get('/api/gamey/play').query(true).replyWithError('Connection refused')
        const res = await request(app)
            .get('/play')
            .query({ position })
        expect(res.status).toBe(500)
    })
})