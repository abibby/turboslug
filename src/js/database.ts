import DatabaseWorker from 'worker-loader!./database.worker'
import { Chunk, DBCard } from '../../functions/src/interfaces'
import { DatabaseMessage, DatabaseResponse, Paginated } from './database.worker'

export { Chunk, DBCard }

const worker = new DatabaseWorker()

async function runFunction(message: DatabaseMessage): Promise<any> {
    return new Promise(resolve => {
        const onMessage = (e: MessageEvent) => {
            const response: DatabaseResponse = e.data

            if (
                response.type === 'function' &&
                JSON.stringify(response.message) === JSON.stringify(message)
            ) {
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

export async function searchCards(
    query: string,
    take: number = 15,
    skip: number = 0,
): Promise<Paginated<DBCard>> {
    return runFunction({
        function: 'searchCards',
        query: query,
        take: take,
        skip: skip,
    })
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
    }
}

export function isCustomCard(card: DBCard): boolean {
    return card.id === 'custom-' + card.name
}

export function cardImage(card: DBCard, set?: string): string {
    return card.image_urls[set ?? ''] ?? card.image_urls[card.set[0]]
}
