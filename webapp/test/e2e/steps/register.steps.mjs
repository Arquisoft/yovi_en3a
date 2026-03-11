import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('the register page is open', async function () {
    const page = this.page
    if (!page) throw new Error('Page not initialized')
    await page.goto('http://localhost:5173')
    await page.click('button:has-text("Sign Up")')
})

When('I fill in the registration form with valid data', async function () {
    const page = this.page
    if (!page) throw new Error('Page not initialized')
    const unique = Date.now()
    await page.fill('#username', `Alice${unique}`)
    await page.fill('#email', `alice${unique}@test.com`)
    await page.fill('#password', 'Alice1234')
    await page.fill('#passwordConfirm', 'Alice1234')
    await page.click('button[type="submit"]')
})

Then('I should see a success message', async function () {
    const page = this.page
    if (!page) throw new Error('Page not initialized')
    await page.waitForSelector('.success-message', { timeout: 5000 })
    const text = await page.textContent('.success-message')
    assert.ok(text && text.length > 0, `Expected success message but got: "${text}"`)
})