import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('the user is not logged in', async function () {
    const page = this.page
    await page.goto('http://localhost:5173')
    await page.evaluate(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
    })
})

When('the user tries to access the menu page', async function () {
    const page = this.page
    await page.goto('http://localhost:5173/menu')
})

When('the user tries to access the select game page', async function () {
    const page = this.page
    await page.goto('http://localhost:5173/select-game')
})

When('the user tries to access the stats page', async function () {
    const page = this.page
    await page.goto('http://localhost:5173/stats')
})

When('the user tries to access the ranking page', async function () {
    const page = this.page
    await page.goto('http://localhost:5173/ranking')
})

Then('the user should be redirected to login', async function () {
    const page = this.page
    await page.waitForURL('**/login', { timeout: 5000 })
    const url = page.url()
    assert.ok(url.includes('/login'), `Expected redirect to /login but got: "${url}"`)
})