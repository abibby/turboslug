import type {
    DatabaseMessage,
    DatabaseResponse,
    Paginated,
    SearchCardsMessage,
} from './database.worker'
import cardBack from 'res/card-back.jpg'

export interface DBCard {
    id: string
    name: string
    oracle_text: string
    mana_cost: string
    set: string[]
    type: string
    image_urls: Record<string, string>
    color_identity: Array<'W' | 'U' | 'B' | 'R' | 'G'>
    legalities: string[]
    cmc: number
    power: string | null
    toughness: string | null
    scryfall_url: string
}

export interface Chunk {
    index: string
    hash: string
    path: string
}
const worker = new Worker(new URL('./database.worker.ts', import.meta.url), {
    type: 'module',
})
// const worker = new DatabaseWorker()
let abortBuffer: Uint8Array | undefined
if (crossOriginIsolated) {
    const sharedAbortBuffer = new SharedArrayBuffer(256)
    abortBuffer = new Uint8Array(sharedAbortBuffer)
    worker.postMessage(sharedAbortBuffer)
}

let messageId = 0

async function runFunction(
    message: DatabaseMessage,
    abortController?: AbortController,
): Promise<any> {
    return new Promise((resolve, reject) => {
        const onMessage = (e: MessageEvent) => {
            const response: DatabaseResponse = e.data

            if (response.type === 'function' && response.id === message.id) {
                resolve(response.value)
                worker.removeEventListener('message', onMessage)
                return
            }

            if (response.type === 'abort' && response.id === message.id) {
                reject(new Error('AbortError'))
                worker.removeEventListener('message', onMessage)
                return
            }
        }
        abortController?.signal.addEventListener('abort', () => {
            if (abortBuffer !== undefined) {
                Atomics.store(
                    abortBuffer,
                    message.id % abortBuffer.byteLength,
                    1,
                )
            }
        })
        if (abortBuffer !== undefined) {
            Atomics.store(abortBuffer, message.id % abortBuffer.byteLength, 0)
        }
        worker.addEventListener('message', onMessage)
        worker.postMessage(message)
    })
}

export async function findCard(name: string): Promise<DBCard | undefined> {
    return runFunction({
        function: 'findCard',
        id: messageId++,
        name: name,
    })
}

export async function searchCards(
    query: string,
    options: Partial<Omit<SearchCardsMessage, 'function' | 'query'>> = {},
    abortController?: AbortController,
): Promise<Paginated<DBCard>> {
    return runFunction(
        {
            function: 'searchCards',
            id: messageId++,
            query: query,
            take: 15,
            skip: 0,
            sort: 'name',
            order: 'asc',
            ...options,
        },
        abortController,
    )
}

export async function loadDB(
    progress?: (count: number, total: number) => void,
): Promise<void> {
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
        id: messageId++,
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
        image_urls: {},
        color_identity: [],
        legalities: [],
        cmc: 0,
        power: null,
        toughness: null,
        scryfall_url: '',
    }
}

export function isCustomCard(card: DBCard): boolean {
    return card.id === 'custom-' + card.name
}

export function cardImage(
    card: DBCard | undefined,
    set?: string,
): string | undefined {
    if (card === undefined) {
        return undefined
    }
    if (set !== undefined && card.image_urls[set] !== undefined) {
        return card.image_urls[set]
    }

    return (
        Object.entries(card.image_urls)
            .filter(([key]) => key.startsWith(card.set[card.set.length - 1]))
            .sort(([a], [b]) =>
                a.localeCompare(b, undefined, { numeric: true }),
            )?.[0]?.[1] ?? cardBack
    )
}
