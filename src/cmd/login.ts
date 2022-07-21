import { BrowserContext } from "playwright";
import StateStore from "../State";
import { screenshot } from "../utils";

export async function login(context: BrowserContext, state: StateStore): Promise<void> {
    const page = await context.newPage()
    await page.goto('https://economist.com');
    await page.waitForLoadState("domcontentloaded")
    try {
      await page.frameLocator('iframe[title="SP Consent Message"]').locator('text=Accept').click({timeout: 5000})
    } catch (_err) {
        console.log("GDPR likely already accepted")
    }
    console.log("Page loaded, checking for login state")
    await page.waitForLoadState("domcontentloaded")
    try {
        await page.click('text=Log in', {timeout: 5000});
        await page.waitForSelector('text=Log into your account')
        console.log("Logging In")
        await screenshot(page, "login_loaded")
        await page.fill('input[name="username"]', process.env.ECONOMIST_USER || '');
        await page.fill('input[name="password"]', process.env.ECONOMIST_PASS || '');
        await page.click('button[type="submit"]');
        await screenshot(page, "login_done")
        await page.waitForTimeout(5000)
        await screenshot(page, "login_after")
    } catch (err) {
        console.log(err)
        console.log("Already logged in")
    } finally {
        page.close()
    }
}