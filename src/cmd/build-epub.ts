import { mkdir, writeFile, readFile } from "fs/promises"
import path from "path"
import StateStore from "../State"
import * as Eta from 'eta'
import { copy } from 'fs-extra'
import { parseDocument } from "htmlparser2"
import render from "dom-serializer"
import * as CSSselect from "css-select"
import { replaceElement, textContent } from "domutils"
import { Element } from "domhandler"

const startEpub = async (epubDir: string): Promise<void> => {
    await copy(path.join(__dirname, '..', 'template', 'epub_skeleton'), epubDir)
}

const getTemplate = async (name: string): Promise<string> => {
    return await readFile(path.join(__dirname, '..', 'template', `${name}.eta.xhtml`), 'utf-8')
}

const standardizeURL = (urlStr: string): string => {
    return new URL(urlStr).pathname.slice(1) + ".xhtml"
}

export const cleanContent = (content: string[]): string[] => {
    const filtered = content.filter((str) => {
        if (str.match(new RegExp('Your browser does not support', 'i'))) { return false }
        if (str.match(new RegExp('For subscribers only:', 'i'))) { return false }
        // Iframed content is always in its own paragraph
        if (str.match(new RegExp('<iframe', 'i'))) { return false }
        return true
    })
    return filtered.map((str) => {
        const dom = parseDocument(str)
        return render(dom, {
            xmlMode: true
        })
    })
}

export const fixLinks = (content: string[], validUrls: string[]): string[] => {
    const validPaths = validUrls.map((url) => new URL(url).pathname)
    return content.map((str) => {
        const dom = parseDocument(str)
        const links = CSSselect.selectAll('a', dom) as unknown as Element[]

        for (const link of links) {
            if (link.attribs.href && validPaths.indexOf(link.attribs.href) >= 0) {
                link.attribs.href = "../../../.." + link.attribs.href + ".xhtml"
            } else if (link.attribs.href) {
                const bold = parseDocument("<b>" + textContent(link) + "</b>")
                replaceElement(link, bold)
            }
        }

        return render(dom, {
            xmlMode: true
        })
    })
}

type Magazine = {
    title?: string
    date?: string
    sections: {
        title: string
        articles: {
            title: string
            subtitle: string
            url: string
        }[]
    }[]
}

const capitalize = (str: string): string => {
    return str.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
}

const buildToc = ({ state }: StateStore): Magazine => {
    const magazine: Magazine = {
        title: state.title,
        date: state.date,
        sections:[]
    }

    const articles = state.articles
    // Use 'urls' to get the proper order
    const urls = state.urls
    const sections = urls.map((url) => new URL(url).pathname.split('/')[1]).filter((val, idx, self) => self.indexOf(val) == idx)
    for (const section of sections) {
        const sectionUrls = state.urls.filter((u) => new URL(u).pathname.split('/')[1] == section)
        const articles = sectionUrls.reduce((a: any[], s) => {
            if (!state.articles[s]) return a
            const { title, subtitle } = state.articles[s]
            a.push({
                title,
                subtitle,
                url: s,
                href: standardizeURL(s)
            })
            return a
        }, [])
        if (articles.length > 0) {
            magazine.sections.push({
                title: capitalize(section),
                articles
            })
        }
    }

    return magazine
}

export async function buildEpub(stateStore: StateStore, outDir: string): Promise<void> {
    await stateStore.sync()

    const template = await getTemplate('article')
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
        

        const xhtml = Eta.render(template, {title, subtitle, content: fixLinks(cleanContent(content), Object.keys(articles))})
        await writeFile(path.join(articlePath, articleFilename + '.xhtml'), xhtml as string)
 
    }

    const tocData = buildToc(stateStore)
    const toc = Eta.render(await getTemplate('toc'), { ...tocData })
    await writeFile(path.join(outPath, 'OEBPS', 'toc.xhtml'), toc as string)

    const manifestList = stateStore.state.urls.filter((url) => !!articles[url]).map((u) => standardizeURL(u))

    // Special date format for epub modified, no trailing ms
    const date = new Date().toISOString().replace(/\.[0-9]+Z/, 'Z')
    const manifest = Eta.render(await getTemplate('manifest'), { hrefs: manifestList, title: "Economist - " + stateStore.state.title, date})
    await writeFile(path.join(outPath, 'OEBPS', 'manifest.opf'), manifest as string)

    // Special date format for epub modified, no trailing ms
    const tocNcx = Eta.render(await getTemplate('toc_ncx'), { ...tocData })
    await writeFile(path.join(outPath, 'OEBPS', 'toc.ncx'), tocNcx as string)


}