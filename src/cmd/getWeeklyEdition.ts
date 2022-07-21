import { BrowserContext } from "playwright";
import PageError from "../PageError";
import StateStore from "../State";

export async function getWeeklyEdition(context: BrowserContext, stateStore: StateStore): Promise<StateStore> {
    const page = await context.newPage()
    try {
        await page.goto('https://economist.com');
        await page.waitForLoadState("domcontentloaded")
        await page.click('text=Weekly Edition');
        await page.waitForLoadState("domcontentloaded")
        const title = await page.innerText('.weekly-edition-header__headline')
        const date = await page.innerText('.weekly-edition-header__date')
        const urls = (await page.$$eval('a', (elements) =>
            elements.map((el) => el.href),
        )).filter((url) =>
            url.match(/^https:\/\/www.economist.com\/[A-Za-z\-]+\/[0-9]{4}\/[0-9]{2}\/[0-9]{2}/))
            .filter((val, idx, self) => self.indexOf(val) === idx)
        console.log(urls)
        console.log(urls.length)
        stateStore.state.urls = urls
        stateStore.state.date = date
        stateStore.state.title = title
        stateStore.write()
        return stateStore
    } catch (e) {
        throw new PageError(e, page)
    } finally {
        page.close()
    }
}