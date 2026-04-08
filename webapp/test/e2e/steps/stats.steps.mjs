import { When, Then } from '@cucumber/cucumber'

When('I click on History and Stats', async function () {
    const page = this.page
    await page.click('button:has-text("History & Stats")')
})

Then('I should see the stats page', async function () {
    const page = this.page
    await page.waitForURL('**/stats', { timeout: 5000 })
    await page.waitForSelector('h1:has-text("Statistics")', { timeout: 5000 })
})

When('I click on Global Ranking', async function () {
    const page = this.page
    await page.click('button:has-text("Global Ranking")')
})

Then('I should see the ranking page', async function () {
    const page = this.page
    await page.waitForURL('**/ranking', { timeout: 5000 })
    await page.waitForSelector('h1:has-text("Global Leaderboard")', { timeout: 5000 })
})