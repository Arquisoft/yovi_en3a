import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('a registered user exists', async function () {
    const unique = Date.now()
    this.username = `TestUser${unique}`
    this.email = `testuser${unique}@test.com`
    this.password = 'A12345678'

    const res = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: this.username,
            email: this.email,
            password: this.password
        })
    })
    if (!res.ok) throw new Error('Failed to register test user')
})

Given('the login page is open', async function () {
    const page = this.page
    await page.goto('http://localhost:5173/login')
})

When('I fill in the login form with valid credentials', async function () {
    const page = this.page
    await page.fill('#username', this.username)
    await page.fill('#password', this.password)
    await page.click('button[type="submit"]')
})

Then('I should be redirected to the menu', async function () {
    const page = this.page
    await page.waitForURL('**/menu', { timeout: 5000 })
})

When('I fill in the login form with wrong credentials', async function () {
    const page = this.page
    await page.fill('#username', 'nonexistentuser')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
})

Then('I should see a login error message', async function () {
    const page = this.page
    await page.waitForSelector('p[style*="color: rgb(248, 113, 113)"]', { timeout: 5000 })
    const text = await page.textContent('p[style*="color: rgb(248, 113, 113)"]')
    assert.ok(text && text.length > 0)
})