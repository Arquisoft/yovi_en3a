import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../gateway-service.js'

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app)
      .get('/health')
      .set('Accept', 'application/json')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('service', 'gatewayservice')
  })
})