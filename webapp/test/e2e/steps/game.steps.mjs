import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { registerAndLogin } from '../support/helpers.mjs'

Given('I am logged in', async function () {
    await registerAndLogin(this.page, this)
})

Given('I am on the menu page', async function () {
    const page = this.page
    await page.waitForSelector('button:has-text("Play vs Bot")', { timeout: 5000 })
})

When('I click on Play vs Bot', async function () {
    const page = this.page
    await page.click('button:has-text("Play vs Bot")')
})

When('I select Standard mode', async function () {
    const page = this.page
    await page.click('button:has-text("Standard")')
    await page.click('button:has-text("Start Standard")')
})

Then('I should see the game board', async function () {
    const page = this.page
    await page.waitForSelector('.hex', { timeout: 10000 })
    const cells = await page.$$('.hex')
    assert.ok(cells.length > 0, 'Expected game board to be visible')
})

Given('I am logged in and in a game', async function () {
    await registerAndLogin(this.page, this)
    const page = this.page
    await page.click('button:has-text("Play vs Bot")')
    await page.click('button:has-text("Standard")')
    await page.click('button:has-text("Start Standard")')
    await page.waitForSelector('.hex', { timeout: 10000 })
})

When('I click resign', async function () {
    const page = this.page
    await page.click('button:has-text("Exit")')
})

Then('I should be redirected to the game selection menu', async function () {
    const page = this.page
    await page.waitForURL('**/select-game', { timeout: 5000 })
})