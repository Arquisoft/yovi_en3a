import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('the register page is open', async function () {
    const page = this.page
    if (!page) throw new Error('Page not initialized')
    await page.goto('http://localhost:5173/register')
})

When('I fill in the registration form with valid data', async function () {
    const page = this.page
    if (!page) throw new Error('Page not initialized')
    const unique = Date.now()
    this.username = `Alice${unique}`
    this.email = `alice${unique}@test.com`
    this.password = 'A12345678'
    await page.fill('#username', this.username)
    await page.fill('#email', this.email)
    await page.fill('#password', this.password)
    await page.fill('#passwordConfirm', this.password)
    await page.click('button[type="submit"]')
})

Then('I should see a success message', async function () {
    const page = this.page
    if (!page) throw new Error('Page not initialized')
    await page.waitForSelector('p[style*="color: rgb(74, 222, 128)"]', { timeout: 5000 })
    const text = await page.textContent('p[style*="color: rgb(74, 222, 128)"]')
    assert.ok(text && text.length > 0, `Expected success message but got: "${text}"`)
})

When('I fill in the registration form with an existing username', async function () {
    const page = this.page
    const unique = Date.now()
    const existingUsername = `Existing${unique}`
    
    // First create the users
    await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: existingUsername,
            email: `existing${unique}@test.com`,
            password: 'A12345678'
        })
    })

    await page.fill('#username', existingUsername)
    await page.fill('#email', `other${unique}@test.com`)
    await page.fill('#password', 'A12345678')
    await page.fill('#passwordConfirm', 'A12345678')
    await page.click('button[type="submit"]')
})

Then('I should see an error message', async function () {
    const page = this.page
    await page.waitForSelector('p:has-text("already in use")', { timeout: 5000 })
    const text = await page.textContent('p:has-text("already in use")')
    assert.ok(text && text.length > 0)
})