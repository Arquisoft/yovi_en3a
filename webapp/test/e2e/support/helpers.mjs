export async function registerAndLogin(page, context) {
    const unique = Date.now()
    context.username = `User${unique}`
    context.email = `user${unique}@test.com`
    context.password = 'A12345678'

    await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: context.username,
            email: context.email,
            password: context.password
        })
    })

    await page.goto('http://localhost:5173/login')
    await page.fill('#username', context.username)
    await page.fill('#password', context.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/menu', { timeout: 5000 })
}