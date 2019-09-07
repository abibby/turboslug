import { get, set } from 'idb-keyval'
import { Chunk, DBCard } from './database'

export type DatabaseMessage = FindCardMessage | SearchCardsMessage | LoadDBMessage
export interface FindCardMessage {
    function: 'findCard'
    name: string
}
export interface SearchCardsMessage {
    function: 'searchCards'
    query: string
}
export interface LoadDBMessage {
    function: 'loadDB'
}

export type DatabaseResponse = FunctionResponse | LoadingResponse
export interface FunctionResponse {
    type: 'function'
    message: DatabaseMessage
    value: any
}
export interface LoadingResponse {
    type: 'partial'
    name: 'loadDB' | 'loadNetwork'
    current: number
    total: number
}

interface QueryArgs {
    [key: string]: string[]
}

// type Matcher<T> = (a: T, words: string[]) => boolean

interface QueryField<T> {
    field: string[]
    matcher: (a: T, words: string[]) => boolean
}

type QueryDefinition<T> = {
    [P in keyof T]?: QueryField<T[P]>
}

const allCards: DBCard[] = []

addEventListener('message', async  e => {
    postMessage(await runFunction(e.data), undefined as any)
})

async function runFunction(message: DatabaseMessage): Promise<DatabaseResponse> {
    switch (message.function) {
        case 'findCard':
            const card = findCard(message.name)
            return {
                type: 'function',
                message: message,
                value: card,
            }
        case 'searchCards':
            const cards = searchCards(message.query)
            return {
                type: 'function',
                message: message,
                value: cards,
            }
        case 'loadDB':
            await loadDB()
            return {
                type: 'function',
                message: message,
                value: undefined,
            }
    }
}

function findCard(name: string): DBCard | undefined {
    return allCards.find(card => card.name === name)
}
function searchCards(query: string): DBCard[] {

    const filter = queryFilter<DBCard>(parseQuery(query), {
        name: {
            field: ['default'],
            matcher: stringMatch,
        },
        oracle_text: {
            field: ['oracle', 'o'],
            matcher: stringMatch,
        },
        type: {
            field: ['type', 't'],
            matcher: stringMatch,
        },
        set: {
            field: ['set', 's'],
            matcher: stringMatch,
        },
        color_identity: {
            field: ['color', 'c'],
            matcher: colorMatch,
        },
        legalities: {
            field: ['legal', 'l'],
            matcher: arrayExactMatch,
        },
    })
    const cards: DBCard[] = []
    let count = 0
    for (const card of allCards) {
        if (filter(card)) {
            cards.push(card)
            count++
        }
        if (count >= 15) {
            break
        }
    }

    return cards
}

function stringMatch(found: string, search: string[]): boolean {
    for (const word of search) {
        if (!found.toLowerCase().includes(word.toLowerCase())) {
            return false
        }
    }
    return true
}

function colorMatch(found: string[], search: string[]): boolean {
    return arrayExactMatch(found, search.flatMap(s => s.split('')))
}

function arrayExactMatch(found: string[], search: string[]): boolean {
    for (const sColor of search) {
        if (found.find(fColor => fColor.toLowerCase() === sColor.toLowerCase()) === undefined) {
            return false
        }
    }
    return true
}
function arrayMatch(found: string[], search: string[]): boolean {
    for (const f of found) {
        if (stringMatch(f, search)) {
            return true
        }
    }
    return false
}

function* tokens(q: string): Iterable<string> {
    let current: string = ''
    let inQuote = false
    for (const c of q.trim()) {
        if (inQuote && c !== '"') {
            current += c
            continue
        }
        switch (c) {
            case '"':
                inQuote = !inQuote
                break
            case ' ':
                if (current !== '') {
                    yield current
                }
                current = ''
                break
            case ':':
            case '=':
                if (current !== '') {
                    yield current + c
                }
                current = ''
                break
            default:
                current += c
        }
    }
    yield current
}

function parseQuery(q: string): QueryArgs {
    const query: QueryArgs = { default: [] }
    let section = 'default'
    for (const token of tokens(q)) {
        if (token.endsWith(':')) {
            section = token.slice(0, -1)
            continue
        }
        query[section] = (query[section] || []).concat([token])
        section = 'default'
    }

    return query
}

function queryFilter<T extends object>(
    args: QueryArgs,
    map: QueryDefinition<T>,
): (card: T) => boolean {
    return card => {
        for (const [key, field] of Object.entries(map) as Iterable<[string, QueryField<any>]>) {

            for (const f of field.field) {
                if (args[f] === undefined) {
                    continue
                }

                if (!field.matcher((card as any)[key], args[f])) {
                    return false
                }
            }
        }

        return true
    }
}

async function setChunks(chunks: Chunk[]): Promise<void> {
    await set('chunks', chunks)
}
async function getChunks(): Promise<Chunk[]> {
    return await get('chunks') || []
}
async function setCards(index: number, cards: DBCard[]): Promise<void> {
    await set(`chunk-${index}`, cards)
}
async function getCards(index: number): Promise<DBCard[]> {
    return await get(`chunk-${index}`) || []
}

async function loadDB(): Promise<void> {
    try {
        await loadNetwork()
    } catch (e) {
        // tslint:disable-next-line: no-console
        console.warn(`failed to load cards from network: ${e}`)
    }

    allCards.length = 0
    const chunks = await getChunks()
    let i = 0
    for (const chunk of chunks) {
        const cards = await getCards(chunk.index)
        allCards.push(...cards)

        updateLoading({
            type: 'partial',
            name: 'loadDB',
            current: i + 1,
            total: chunks.length,
        })
        i++
    }
    allCards.sort((a, b) => a.name.localeCompare(b.name))

}

async function loadNetwork(): Promise<void> {
    const chunks: Chunk[] = await fetch('cards/chunks.json').then(r => r.json())
    let localChunks: Chunk[] = await getChunks()
    let i = 0
    for (const chunk of chunks) {
        const localChunk = localChunks.find(c => c.index === chunk.index)

        if (localChunk !== undefined) {
            if (localChunk.hash === chunk.hash) {
                continue
            } else {
                localChunks = localChunks.filter(c => c.index !== chunk.index)
            }
        }

        const cards: DBCard[] = await fetch(chunk.path).then(r => r.json())
        setCards(chunk.index, cards)
        localChunks.push(chunk)

        updateLoading({
            type: 'partial',
            name: 'loadNetwork',
            current: i + 1,
            total: chunks.length,
        })
        i++
    }
    await setChunks(localChunks)
}

function updateLoading(message: LoadingResponse): void {
    postMessage(message, undefined as any)
}
