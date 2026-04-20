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

When('I play moves until the game ends', { timeout: 120000 }, async function () {
    const page = this.page

    const gameId = await page.evaluate(() => {
        const segments = window.location.pathname.split('/')
        return segments[2]
    })

    const getOccupied = () => page.evaluate(() =>
        [...document.querySelectorAll('.hex')]
            .filter(el => {
                const transform = getComputedStyle(el).transform
                return transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)' && transform !== 'matrix(1,0,0,1,0,0)' && transform !== 'scale(1)' && transform !== 'scale(1.0)'
            }).length
    )

    const isGameOver = async () => page.evaluate(async (gameId) => {
        const h2 = document.querySelector('h2')
        if (h2 && (h2.textContent.includes('You Win') || h2.textContent.includes('You Lose'))) return true

        const token = localStorage.getItem('token')
        if (!token) return false
        try {
            const res = await fetch(`/api/game-manager/state/${gameId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return false
            const data = await res.json()
            return data.status === 'won' || data.status === 'lost'
        } catch {
            return false
        }
    }, gameId)

    while (!(await isGameOver())) {
        const before = await getOccupied()

        const cells = await page.$$('.hex')
        let clicked = false
        for (const cell of cells) {
            const transform = await cell.evaluate(el => getComputedStyle(el).transform)
            const cursor = await cell.evaluate(el => getComputedStyle(el).cursor)
            const isEmpty = transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)' || transform === 'matrix(1,0,0,1,0,0)' || transform === 'scale(1)' || transform === 'scale(1.0)'
            if (isEmpty && cursor !== 'not-allowed') {
                try {
                    await cell.click()
                    clicked = true
                    break
                } catch {
                    continue
                }
            }
        }

        if (!clicked) break

        await page.waitForFunction((prevCount) => {
            const h2 = document.querySelector('h2')
            if (h2 && (h2.textContent.includes('You Win') || h2.textContent.includes('You Lose'))) return true

            const occupied = [...document.querySelectorAll('.hex')]
                .filter(el => {
                    const value = getComputedStyle(el).transform
                    return value !== 'none' && value !== 'matrix(1, 0, 0, 1, 0, 0)' && value !== 'matrix(1,0,0,1,0,0)' && value !== 'scale(1)' && value !== 'scale(1.0)'
                }).length
            return occupied >= prevCount + 2
        }, before, { timeout: 30000 })
    }

    if (!(await isGameOver())) {
        throw new Error('Unable to complete the game: no game over state was reached')
    }
})

Then('I should see the game over screen', async function () {
    const page = this.page
    await page.waitForSelector('button:has-text("Back to Menu")', { timeout: 30000 })
    const text = await page.textContent('h2')
    assert.ok(
        text && (text.includes('You Win') || text.includes('You Lose')),
        `Expected game over message but got: "${text ?? ''}"`
    )
})

When('I click Back to Menu from game over', async function () {
    const page = this.page
    await page.click('button:has-text("Back to Menu")')
})