import { Page } from "playwright";

export async function screenshot(page: Page, name?: string): Promise<void> {
    const ts = new Date().valueOf()
    await page.screenshot({ path: `screenshots/part-${ts}${name ? '-'+name : ''}.png` });
}
