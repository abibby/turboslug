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
}

interface QueryArgs {
    default: string[]
    [key: string]: string[]
}
export interface Chunk {
    index: number
    hash: string
    path: string
}

const allCards: DBCard[] = []

export async function searchCards(query: string): Promise<DBCard[]> {
    const qa = parseQuery(query)

    const filter = queryFilter<DBCard>(qa, {
        default: 'name',
        o: 'oracle_text',
        oracle: 'oracle_text',
        t: 'type',
        type: 'type',
        s: 'set',
        set: 'set',
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

function* tokens(q: string) {
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
    map: { default: keyof T, [key: string]: keyof T },
): (card: T) => boolean {
    return card => {
        for (const [key, value] of Object.entries(map)) {
            if (args[key] === undefined) {
                continue
            }
            for (const words of args[key]) {
                if (!String(card[value]).toLowerCase().includes(words.toLowerCase())) {
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

export async function loadDB() {
    await loadNetwork()

    allCards.length = 0
    for (const chunk of await getChunks()) {
        const cards = await getCards(chunk.index)
        allCards.push(...cards.map(toDBCard))
    }
    allCards.sort((a, b) => a.name.localeCompare(b.name))

}

async function loadNetwork() {
    const chunks: Chunk[] = await fetch('cards/chunks.json').then(r => r.json())
    let localChunks: Chunk[] = await getChunks()
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
        console.log(`downloaded chunk ${chunk.index} / ${chunks.length}`)
    }
    await setChunks(localChunks)
}

function toDBCard(c: Card): DBCard {
    const base = {
        id: c.id,
        name: c.name,
        set: c.set,
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
