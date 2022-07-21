import { mkdir, writeFile, readFile } from "fs/promises"
import path from "path"
import StateStore from "../State"
import * as Eta from 'eta'
import { copy } from 'fs-extra'

const startEpub = async (epubDir: string): Promise<void> => {
    await copy(path.join(__dirname, '..', 'template', 'epub_skeleton'), epubDir)
}

const getTemplate = async (): Promise<string> => {
    return await readFile(path.join(__dirname, '..', 'template', 'article.xhtml.eta'), 'utf-8')
}

const cleanContent = (content: string[]): string[] => {
    return content.filter((str) => {
        if (str.match(new RegExp('Your browser does not support', 'i'))) { return false }
        if (str.match(new RegExp('For subscribers only:', 'i'))) { return false }
        return true
    })
}

export async function buildEpub(stateStore: StateStore, outDir: string): Promise<void> {
    // Array.prototype.slice.call(document.querySelectorAll("article section p")).map((p) => p.outerHTML).join("\n")
    await stateStore.sync()
    const template = await getTemplate()
    const articles = stateStore.state.articles
    const outPath = path.join(outDir, 'epub')

    await startEpub(outPath)

    await mkdir(outPath, {recursive: true})

    // Print out the html for each article
    for (const id in articles) {
        const {filename} = articles[id]
        const {title, subtitle, content, url: urlStr} = JSON.parse(await readFile(path.join(outDir, 'articles', filename), 'utf-8'))
        const url = new URL(urlStr)
        const articlePath = path.join(outPath, 'OEBPS', url.pathname.split('/').slice(0,-1).join('/'))
        const articleFilename = url.pathname.split('/').slice(-1)[0]
        await mkdir(articlePath, {recursive: true})
        console.log(articlePath, title)
        

        const xhtml = Eta.render(template, {title, subtitle, content: cleanContent(content)})
        await writeFile(path.join(articlePath, articleFilename), xhtml as string)
 
    }
}