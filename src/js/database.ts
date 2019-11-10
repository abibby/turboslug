import DatabaseWorker from 'worker-loader!./database.worker'
import { DatabaseMessage, DatabaseResponse } from './database.worker'

const worker = new DatabaseWorker()

export interface DBCard {
    id: string
    name: string
    oracle_text: string,
    mana_cost: string
    set: string[]
    type: string
    image_url: string
    color_identity: Array<'W' | 'U' | 'B' | 'R' | 'G'>
    legalities: string[]
    cmc: number
}

export interface Chunk {
    index: number
    hash: string
    path: string
}

async function runFunction(message: DatabaseMessage): Promise<any> {
    return new Promise(resolve => {
        const onMessage = (e: MessageEvent) => {
            const response: DatabaseResponse = e.data

            if (response.type === 'function' && JSON.stringify(response.message) === JSON.stringify(message)) {
                resolve(response.value)
                worker.removeEventListener('message', onMessage)
            }
        }
        worker.addEventListener('message', onMessage)
        worker.postMessage(message)
    })
}

export async function findCard(name: string): Promise<DBCard | undefined> {
    return runFunction({
        function: 'findCard',
        name: name,
    })
}

export async function searchCards(query: string): Promise<DBCard[]> {
    return runFunction({
        function: 'searchCards',
        query: query,
    })
}

export async function loadDB(progress?: (count: number, total: number) => void): Promise<void> {
    let onProgress: ((e: MessageEvent) => void) | undefined
    if (progress) {
        onProgress = e => {
            const response: DatabaseResponse = e.data
            if (response.type !== 'partial') {
                return
            }
            progress(response.current, response.total)
        }
        worker.addEventListener('message', onProgress)
    }
    await runFunction({
        function: 'loadDB',
    })
    if (onProgress) {
        worker.removeEventListener('message', onProgress)
    }
}

export function newCard(name: string): DBCard {
    return {
        id: 'custom-' + name,
        name: name,
        oracle_text: '',
        mana_cost: '',
        set: [],
        type: 'Unknown',
        image_url: '',
        color_identity: [],
        legalities: [],
        cmc: 0,
    }
}

export function isCustomCard(card: DBCard): boolean {
    return card.id === 'custom-' + card.name
}
