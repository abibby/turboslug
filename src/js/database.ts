import { get, set } from 'idb-keyval'
import { Card } from 'js/scryfall'
// TODO: Move to worker and use comlink https://www.npmjs.com/package/comlink

export interface DBCard {
    id: string
    name: string
    oracle_text: string,
    mana_cost: string
    set: string
    type: string
    image_url: string
    color_identity: Array<'W' | 'U' | 'B' | 'R' | 'G'>
    legalities: string[]
    cmc: number
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

export interface Chunk {
    index: number
    hash: string
    path: string
}

const allCards: DBCard[] = []

export async function searchCards(query: string): Promise<DBCard[]> {

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

async function setChunks(chunks: Chunk[]) {
    await set('chunks', chunks)
}
async function getChunks(): Promise<Chunk[]> {
    return await get('chunks') || []
}
async function setCards(index: number, cards: Card[]) {
    await set(`chunk-${index}`, cards)
}
async function getCards(index: number): Promise<Card[]> {
    return await get(`chunk-${index}`) || []
}

export async function loadDB(progress?: (count: number, total: number) => void) {
    try {
        await loadNetwork(progress)
    } catch (e) {
        // tslint:disable-next-line: no-console
        console.warn(`failed to load cards from network ${e}`)
    }

    allCards.length = 0
    const chunks = await getChunks()
    let i = 0
    for (const chunk of chunks) {
        const cards = await getCards(chunk.index)
        allCards.push(...cards.map(toDBCard))

        if (progress) {
            progress(i + 1, chunks.length)
        }
        i++
    }
    allCards.sort((a, b) => a.name.localeCompare(b.name))

}

async function loadNetwork(progress?: (count: number, total: number) => void) {
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

        const cards: Card[] = await fetch(chunk.path).then(r => r.json())
        setCards(chunk.index, cards.filter(card => ['normal', 'transform'].includes(card.layout)))
        localChunks.push(chunk)

        if (progress) {
            progress(i + 1, chunks.length)
        }
        i++
    }
    await setChunks(localChunks)
}

function toDBCard(c: Card): DBCard {
    const base = {
        id: c.id,
        name: c.name,
        set: c.set,
        color_identity: c.color_identity,
        cmc: c.cmc,
        legalities: Object.entries(c.legalities)
            .filter(([, legal]) => legal === 'legal')
            .map(([format]) => format),
    }
    if (c.layout === 'transform') {
        return {
            ...base,
            oracle_text: c.card_faces[0].oracle_text,
            mana_cost: c.card_faces[0].mana_cost,
            image_url: c.card_faces[0].image_uris.normal,
            type: c.card_faces[0].type_line,
        }
    }

    return {
        ...base,
        oracle_text: c.oracle_text,
        mana_cost: c.mana_cost,
        image_url: c.image_uris.normal,
        type: c.type_line,
    }
}
