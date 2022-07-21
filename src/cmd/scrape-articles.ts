import { mkdir, writeFile, readFile } from "fs/promises"
import path from "path"
import { BrowserContext, Page } from "playwright"
import PageError from "../PageError"
import StateStore from "../State"

const getArticle = async (url: URL, page: Page): Promise<{title: string, subtitle: string, section: string, content: string[]}> => {
    console.log("Processing", url.pathname)

    const section = url.pathname.split('/')[1]

    await page.goto(url.toString());
    await page.waitForLoadState("domcontentloaded")
    const title = await page.innerText("main article h1")
    const subtitle = await page.innerText("main article h2")

    const articleNode = (await page.$$('main article section'))[2]
    const content = await articleNode.$$eval("p, h2", (el) => el.map((l) => l.outerHTML))


    return {
        title, subtitle, content, section
    }
}

const filterUrls = (urls: string[]): string[] => {
    return urls.filter((url) => {
        if (url.match(new RegExp('kals-cartoon$', 'i'))) { return false }
        if (url.match(new RegExp('economist.com/graphic-detail', 'i'))) { return false }
        if (url.match(new RegExp('economist.com/letters-to-the-editor$', 'i'))) { return false }
        if (url.match(new RegExp('economist.com/economic-and-financial-indicators', 'i'))) { return false }
        return true
    })
}

export async function scrapeArticles(context: BrowserContext, stateStore: StateStore, outDir: string): Promise<void> {
    // Array.prototype.slice.call(document.querySelectorAll("article section p")).map((p) => p.outerHTML).join("\n")
    await stateStore.sync()
    const page = await context.newPage()
    const articles = stateStore.state.articles
    const urls = filterUrls(stateStore.state.urls)
    const articlesToGet = urls.filter((url) => !articles[url])
    if (articlesToGet.length == 0) throw new Error("No urls to scrape")
    await mkdir(outDir, {recursive: true})
    console.log("Scraping ",  articlesToGet.length, "articles")
    try {
        for (const urlStr of articlesToGet) {
            const url = new URL(urlStr)
            const {title, subtitle, section, content} = await getArticle(url, page)

            const articlePath = url.pathname.split("/").slice(1).join("_") + ".json"

            const outPath = path.join(outDir, articlePath)
            await writeFile(outPath, JSON.stringify({title, subtitle, content, url}, null, 2))
            stateStore.state.articles[url.toString()] = {
                title,
                subtitle,
                filename: articlePath,
                section,
            }
            console.log("Finished: ", url.pathname)
            await stateStore.write()
        }
    } catch (e) {
        throw new PageError(e, page)
    } finally {
        page.close()
    }
}