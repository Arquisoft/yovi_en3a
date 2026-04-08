import { When, Then } from '@cucumber/cucumber'

When('I click on How to Play', async function () {
    const page = this.page
    await page.click('button:has-text("How to Play")')
})

Then('I should see the how to play page', async function () {
    const page = this.page
    await page.waitForURL('**/how-to-play', { timeout: 5000 })
    await page.waitForSelector('h1:has-text("How to Play")', { timeout: 5000 })
})

When('I click on Log Out', async function () {
    const page = this.page
    await page.click('button:has-text("Log Out")')
})

Then('I should be redirected to the landing page', async function () {
    const page = this.page
    await page.waitForURL('http://localhost:5173/', { timeout: 5000 })
})