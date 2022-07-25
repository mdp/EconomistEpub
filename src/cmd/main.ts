import "dotenv/config";
import { program } from "commander";
import PageError from "../PageError";
import { BrowserContext, chromium, Page } from "playwright";
import path from "path";
import { readFile, writeFile } from "fs/promises";
import StateStore from "../State";
import { scrapeArticle, scrapeArticles } from "./scrape-articles";
import { buildEpub, cleanContent } from "./build-epub";
import { login } from "./login";
import { getWeeklyEdition } from "./getWeeklyEdition";

const screenshotPath = path.join(__dirname, "..", "..", "screenshot", "part-")
const stateDir = path.join(__dirname, "..", "..", "state")
const browserStatePath = path.join(stateDir, "browserState.json")
const statePath = path.join(stateDir, "state.json")

async function close(context: BrowserContext): Promise<void> {
    await context.storageState({path: browserStatePath})
    await context.close()
    process.exit(0)
}

async function createState(): Promise<boolean> {
    try {
        await writeFile(browserStatePath, JSON.stringify({}), {flag: 'wx', encoding: 'utf-8'})
        return true
    } catch (_err) {
        return false;
    }
}

const screenshot = async (page: Page, name?: string): Promise<void> => {
    const ts = new Date().valueOf()
    await page.screenshot({ path: `${screenshotPath}${ts}${name ? '-'+name : ''}.png` });
}

async function getContext(): Promise<BrowserContext> {
    await createState()
    const browser = await chromium.launch();
    const context = await browser.newContext({storageState: browserStatePath})
    context.setDefaultTimeout(10000)
    return context
}

program
  .name('economist-epub')
  .description('Builds the latest Economist into an epub')
  .version('1.0.0')

program.command('login')
  .description('login to the economist and save state')
  // .argument('<string>', 'string to split')
  // .option('--first', 'display just the first substring')
  // .option('-s, --separator <char>', 'separator character', ',')
  // .action((str, options) => {
  .action(async () => {
    const context = await getContext()
    const stateStore = new StateStore(statePath)
    try {
      await login(context, stateStore)
    } catch (e) {
      if (e instanceof PageError) {
        screenshot(e.page, "login-error")
      }
      console.error(e)
    } finally {
      await close(context)
    }
})

program.command('get-current-week')
  .description('Get this week article list and save it to state')
  .action(async () => {
    const context = await getContext()
    const stateStore = new StateStore(statePath)
    try {
      await getWeeklyEdition(context, stateStore)
    } catch (e) {
      if (e instanceof PageError) {
        screenshot(e.page, "get-weekly-articles-error")
      }
      console.error(e)
    } finally {
      await close(context)
    }
})

program.command('scrape-articles')
  .description('Get this week article list and save it to state')
  // .argument('<string>', 'string to split')
  // .option('--first', 'display just the first substring')
  // .option('-s, --separator <char>', 'separator character', ',')
  // .action((str, options) => {
  .action(async () => {
    const context = await getContext()
    const stateStore = new StateStore(statePath)
    try {
      const magazine = JSON.parse(await readFile(statePath, 'utf-8'));
      await scrapeArticles(context, stateStore, path.join(__dirname, '..', '..', 'out', 'articles'))
    } catch (e) {
      if (e instanceof PageError) {
        screenshot(e.page, "get-weekly-articles-error")
      }
      console.error(e)
    } finally {
      await close(context)
    }
})

program.command('build-epub')
  .description('build the epub')
  // .argument('<string>', 'string to split')
  // .option('--first', 'display just the first substring')
  // .option('-s, --separator <char>', 'separator character', ',')
  // .action((str, options) => {
  .action(async () => {
    const stateStore = new StateStore(statePath)
    await buildEpub(stateStore, path.join(__dirname, '..', '..', 'out'))
})

program.command('debug-clean-article')
  .description('Clean an article and see the html')
  .argument('article.json', 'Article json to clean')
  // .option('--first', 'display just the first substring')
  // .option('-s, --separator <char>', 'separator character', ',')
  // .action((str, options) => {
  .action(async (fileName) => {
    const article = JSON.parse(await readFile(fileName, 'utf-8'))
    console.log(cleanContent(article.content))
})

program.command('debug-scrape-article')
  .description('scrape a url and dump the json details')
  .argument('url', 'URL to scrape')
  // .option('--first', 'display just the first substring')
  // .option('-s, --separator <char>', 'separator character', ',')
  // .action((str, options) => {
  .action(async (url) => {
    const context = await getContext()
    console.log(JSON.stringify(await scrapeArticle(context, url), null, 2))
    await close(context)
})

program.parse()