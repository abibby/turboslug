// import { getBlob, ref } from 'firebase/storage'
import { del, get, keys, set } from 'idb-keyval'
import { Chunk, DBCard } from './database'
import { byKey, notNullish } from './util'

export type DatabaseMessage =
    | FindCardMessage
    | SearchCardsMessage
    | LoadDBMessage

export interface FindCardMessage {
    function: 'findCard'
    id: number
    name: string
}
export interface SearchCardsMessage {
    function: 'searchCards'
    id: number
    query: string
    skip: number
    take: number
    sort: keyof DBCard
    order: 'asc' | 'desc'
}
export interface LoadDBMessage {
    function: 'loadDB'
    id: number
}
export type DatabaseResponse =
    | FunctionResponse
    | LoadingResponse
    | AbortResponse
export interface FunctionResponse {
    type: 'function'
    id: number
    value: any
}
export interface LoadingResponse {
    type: 'partial'
    name: 'loadDB' | 'loadNetwork'
    current: number
    total: number
}
export interface AbortResponse {
    type: 'abort'
    id: number
}

interface QueryArgs {
    [key: string]: string[]
}

interface QueryField<T> {
    field: string[]
    matcher: (a: T, words: string[]) => boolean
}

type QueryThing<T, K extends keyof T> = [K, QueryField<T[K]>]

type QueryDefinition<T> = Array<{ [K in keyof T]: QueryThing<T, K> }[keyof T]>

export interface Paginated<T> {
    total: number
    results: T[]
}

class AbortError extends Error {
    constructor(public readonly id: number) {
        super('AbortError')
    }
}

const allCards: DBCard[] = []

let abortBuffer: Uint8Array | undefined

addEventListener('message', async event => {
    try {
        if (crossOriginIsolated) {
            if (event.data instanceof SharedArrayBuffer) {
                abortBuffer = new Uint8Array(event.data)
                return
            }
        }
        const result = await runFunction(event.data)
        if (result === undefined) {
            return
        }
        postMessage(result, undefined as any)
    } catch (e) {
        if (e instanceof AbortError) {
            const abortResponse: AbortResponse = {
                type: 'abort',
                id: event.data.id,
            }
            postMessage(abortResponse, undefined as any)
            return
        }
        console.error(e)
        // throw e
    }
})

async function runFunction(
    message: DatabaseMessage,
): Promise<DatabaseResponse> {
    switch (message.function) {
        case 'findCard':
            await waitForLoad()
            const card = findCard(message.name)
            return {
                type: 'function',
                id: message.id,
                value: card,
            }
        case 'searchCards':
            await waitForLoad()
            const cards = await searchCards(message)
            return {
                type: 'function',
                id: message.id,
                value: cards,
            }
        case 'loadDB':
            await loadDB()
            return {
                type: 'function',
                id: message.id,
                value: undefined,
            }
    }
}

function findCard(name: string): DBCard | undefined {
    return allCards.find(card => card.name === name)
}

async function searchCards(
    options: SearchCardsMessage,
): Promise<Paginated<DBCard>> {
    const filter = queryFilter<DBCard>(parseQuery(options.query), [
        [
            'name',
            {
                field: ['default'],
                matcher: stringMatch,
            },
        ],
        [
            'oracle_text',
            {
                field: ['oracle', 'o'],
                matcher: stringMatch,
            },
        ],
        [
            'type',
            {
                field: ['type', 't'],
                matcher: stringMatch,
            },
        ],
        [
            'set',
            {
                field: ['set', 's'],
                matcher: arrayMatch,
            },
        ],
        [
            'color_identity',
            {
                field: ['color', 'c'],
                matcher: colorMatch,
            },
        ],
        [
            'color_identity',
            {
                field: ['commander', 'edh'],
                matcher: commanderColorMatch,
            },
        ],
        [
            'legalities',
            {
                field: ['legal', 'l'],
                matcher: arrayExactMatch,
            },
        ],
        [
            'cmc',
            {
                field: ['cmc', 'mana-value', 'mv'],
                matcher: numberMatch,
            },
        ],
        [
            'power',
            {
                field: ['power', 'p'],
                matcher: numberMatch,
            },
        ],
        [
            'toughness',
            {
                field: ['toughness', 'd'],
                matcher: numberMatch,
            },
        ],
        [
            'mana_cost',
            {
                field: ['mana-const', 'mc'],
                matcher: manaCostMatch,
            },
        ],
    ])
    const cards: DBCard[] = []
    let count = 0
    let sortedCards = allCards

    if (options.sort !== 'name') {
        sortedCards = allCards.sort(byKey(options.sort, options.order, true))
    }

    for (let i = 0; i < sortedCards.length; i++) {
        if (i % 100 === 0) {
            if (
                abortBuffer !== undefined &&
                Atomics.load(
                    abortBuffer,
                    options.id % abortBuffer.byteLength,
                ) !== 0
            ) {
                throw new AbortError(options.id)
            }
        }

        const card = sortedCards[i]

        if (filter(card)) {
            if (count >= options.skip && count < options.skip + options.take) {
                cards.push(card)
            }
            count++
        }
    }

    return {
        total: count,
        results: cards,
    }
}

function stringMatch(found: string, search: string[]): boolean {
    for (let word of search) {
        const not = word.startsWith('!')
        if (not) {
            word = word.slice(1)
        }

        if (found.toLowerCase().includes(word.toLowerCase()) === not) {
            return false
        }
    }
    return true
}

function exactStringMatch(found: string, search: string[]): boolean {
    for (let word of search) {
        const not = word.startsWith('!')
        if (not) {
            word = word.slice(1)
        }

        if ((found.toLowerCase() === word.toLowerCase()) === not) {
            return false
        }
    }
    return true
}

function manaCostMatch(found: string, search: string[]): boolean {
    return exactStringMatch(
        found,
        search
            .map(s => {
                const matches = s
                    .toLowerCase()
                    .match('^(!)?(\\d+)?([wubrg]+)?$')
                if (matches === null) {
                    return undefined
                }
                const [, not, generic, colored] = matches

                const cost =
                    (not ?? '') +
                    (generic ? `{${generic}}` : '') +
                    (colored ?? '')
                        .split('')
                        .map(c => `{${c}}`)
                        .join('')

                return cost
            })
            .filter(notNullish),
    )
}

function numberMatch(found: number | string | null, search: string[]): boolean {
    if (found === null) {
        return false
    }
    found = Number(found)
    for (const word of search) {
        const [, operator, valueStr] = word.match(/^([<>!]=?)?(\d+)$/) ?? []

        const value = Number(valueStr)
        if (valueStr !== undefined) {
            switch (operator) {
                case '>':
                    if (found <= value) {
                        return false
                    }
                    break
                case '>=':
                    if (found < value) {
                        return false
                    }
                    break
                case '<':
                    if (found >= value) {
                        return false
                    }
                    break
                case '<=':
                    if (found > value) {
                        return false
                    }
                    break
                case '!':
                case '!=':
                    if (found === value) {
                        return false
                    }
                    break
                default:
                    if (found !== value) {
                        return false
                    }
            }
        }
    }
    return true
}

function colorMatch(found: string[], search: string[]): boolean {
    return arrayExactMatch(
        found,
        search.flatMap(s => {
            const not = s.startsWith('!')
            if (not) {
                s = s.slice(1)
            }
            return s
                .split('')
                .filter(c => /^[wubrg]$/i.test(c))
                .map(c => {
                    if (not) {
                        return '!' + c
                    }
                    return c
                })
        }),
    )
}
function commanderColorMatch(found: string[], search: string[]): boolean {
    const searchColors = search.flatMap(s => s.split(''))
    const colors = ['w', 'u', 'b', 'r', 'g']
        .filter(c => !searchColors.includes(c))
        .map(c => '!' + c)

    return arrayExactMatch(found, colors)
}

function arrayExactMatch(found: string[], search: string[]): boolean {
    for (let term of search) {
        const not = term.startsWith('!')
        if (not) {
            term = term.slice(1)
        }
        if (
            (found.find(
                fColor => fColor.toLowerCase() === term.toLowerCase(),
            ) ===
                undefined) !==
            not
        ) {
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
        for (const [key, field] of map) {
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
    return (await get('chunks')) || []
}
async function setCards(index: string, cards: DBCard[]): Promise<void> {
    await set(`chunk-${index}`, cards)
}
async function getCards(index: string): Promise<DBCard[]> {
    return (await get(`chunk-${index}`)) || []
}
async function clearCards(index: string): Promise<void> {
    await del(`chunk-${index}`)
}
async function cardsIndexes(): Promise<string[]> {
    return (await keys())
        .map(String)
        .filter(k => k.startsWith('chunk-'))
        .map(k => k.split('-')[1])
}

let loaded = false
const onLoaded: Array<() => void> = []

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
        try {
            const cards = await getCards(chunk.index)
            allCards.push(...cards)

            updateLoading({
                type: 'partial',
                name: 'loadDB',
                current: i + 1,
                total: chunks.length,
            })
        } catch (e) {
            console.error(e)
        }
        i++
    }
    allCards.sort((a, b) => a.name.localeCompare(b.name))
    loaded = true
    for (const cb of onLoaded) {
        cb()
    }
}

async function waitForLoad(): Promise<void> {
    if (loaded) {
        return
    }
    return new Promise(resolve => {
        onLoaded.push(resolve)
    })
}

async function loadNetwork(): Promise<void> {
    const chunks: Chunk[] = await readFile('cards/chunks.json')
    const localChunks: Chunk[] = await getChunks()
    const newChunks: Chunk[] = []
    let i = 0
    for (const chunk of chunks) {
        const localChunk = localChunks.find(c => c.index === chunk.index)

        if (localChunk !== undefined) {
            if (localChunk.hash === chunk.hash) {
                newChunks.push(chunk)
                continue
            }
        }

        const cards: DBCard[] = await readFile(chunk.path)
        setCards(chunk.index, cards)
        newChunks.push(chunk)

        updateLoading({
            type: 'partial',
            name: 'loadNetwork',
            current: i + 1,
            total: chunks.length,
        })
        i++
    }

    for (const index of await cardsIndexes()) {
        if (!newChunks.map(c => c.index).includes(index)) {
            clearCards(index)
        }
    }

    await setChunks(newChunks)
}

async function readFile(path: string) {
    return await fetch(path).then(b => b.json())
}

function updateLoading(message: LoadingResponse): void {
    postMessage(message, undefined as any)
}
