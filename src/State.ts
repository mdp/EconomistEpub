import { readFile, writeFile } from "fs/promises"

interface State {
    title?: string
    date?: string
    urls: string[]
    articles: {
        [id: string]: {
            title: string
            subtitle: string
            filename: string
            section: string
        }
    }
}

const DEFAULT_STATE: State = {
    urls: [],
    articles: {},
}

const readState = async (path: string): Promise<State> => {
    try {
        return JSON.parse(await readFile(path, 'utf-8')) as State
    } catch (err) {
        console.log(err)
        return DEFAULT_STATE
    }
}

export default class StateStore {
    statePath: string
    state: State

    constructor(path: string) {
        this.statePath = path
        this.state = DEFAULT_STATE
    }

    async updateAndSave(update: State) {
        this.state = Object.assign(this.state, update)
        await this.write()
    }

    async sync() {
        this.state = await readState(this.statePath)
    }

    async write() {
        await writeFile(this.statePath, JSON.stringify(this.state, null, 2))
    }
}