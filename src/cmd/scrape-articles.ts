import { mkdir, writeFile, readFile } from "fs/promises"
import path from "path"
import { BrowserContext, Page } from "playwright"
import PageError from "../PageError"
import StateStore from "../State"

class ArticleScrapeError extends Error {
    constructor(msg: string) {
        super(msg);
        Object.setPrototypeOf(this, ArticleScrapeError.prototype);
    }
}

type ArticleContent = {
    title: string,
    subtitle: string
    section: string,
    content: string[]
}

const getArticle = async (url: URL, page: Page): Promise<ArticleContent> => {
    console.log("Processing", url.pathname)

    const section = url.pathname.split('/')[1]

    await page.goto(url.toString());
    await page.waitForLoadState("domcontentloaded")
    const articleSections = await page.$$('main article section')
    const headerNode = articleSections[0]
    const articleNode = articleSections[2]

    const title = await headerNode.$eval('h1', node => node.innerText)

    let subtitle = ""
    try {
        subtitle = await headerNode.$eval('h2', node => node.innerText) || ""
    } catch (e) {
        console.log("no subtitle")
    }

    if (!articleNode) throw new ArticleScrapeError("Article node not found")
    const content = await articleNode.$$eval("p, h2", (el) => el.map((l) => l.outerHTML))


    return {
        title, subtitle, content, section
    }
}

const filterUrls = (urls: string[]): string[] => {
    return urls.filter((url) => {
        if (url.match(new RegExp('/kals-cartoon$', 'i'))) { return false }
        if (url.match(new RegExp('economist.com/graphic-detail', 'i'))) { return false }
        if (url.match(new RegExp('economist.com/letters', 'i'))) { return false }
        if (url.match(new RegExp('economist.com/economic-and-financial-indicators', 'i'))) { return false }
        return true
    })
}

export async function scrapeArticles(context: BrowserContext, stateStore: StateStore, outDir: string): Promise<void> {
    await stateStore.sync()
    const page = await context.newPage()
    const articles = stateStore.state.articles
    const urls = filterUrls(stateStore.state.urls)
    const articlesToGet = urls.filter((url) => !articles[url])
    if (articlesToGet.length == 0) throw new Error("No urls to scrape")
    await mkdir(outDir, {recursive: true})
    console.log("Scraping ",  articlesToGet.length, "articles")
    for (const urlStr of articlesToGet) {
        const url = new URL(urlStr)
        try {
            const { title, subtitle, section, content } = await getArticle(url, page)
            const articlePath = url.pathname.split("/").slice(1).join("_") + ".json"

            const outPath = path.join(outDir, articlePath)
            await writeFile(outPath, JSON.stringify({ title, subtitle, content, url }, null, 2))
            stateStore.state.articles[url.toString()] = {
                title,
                subtitle,
                filename: articlePath,
                section,
            }
            console.log("Finished: ", url.pathname)
            await stateStore.write()
        } catch (err) {
            if (err instanceof ArticleScrapeError) {
                console.log("Unable to scrape content of ", url.toString())
                // Ignore and move to next article
            } else {
                throw new PageError(err, page)
            }
        }
    }
}

export async function scrapeArticle(context: BrowserContext, urlStr: string): Promise<ArticleContent> {
    const page = await context.newPage()
    const url = new URL(urlStr)
    return getArticle(url, page)
}