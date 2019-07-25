
import Dexie from 'dexie'
import { allSets, Card, ScryfallResponse, searchCards, Set } from 'js/scryfall'

// TODO: Move to worker and use comlink https://www.npmjs.com/package/comlink

export interface DBCard {
    id: string
    name: string
    name_words?: string[]
    oracle_text: string,
    oracle_text_words?: string[],
    mana_cost: string
    set: string
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

class CardDatabase extends Dexie {
    public cards: Dexie.Table<DBCard, number>
    public chunks: Dexie.Table<Chunk, number>

    constructor() {
        super('CardDatabase')
        this.version(1).stores({
            cards: 'id,name,*name_words,oracle_text,*oracle_text_words',
            chunks: 'index',
        })
    }

    public async searchCards(query: string): Promise<DBCard[]> {
        // // .where('name').startsWithIgnoreCase(query)
        // // .or('oracle_text_words').startsWithAnyOfIgnoreCase(query.split(' '))
        //
        const qa = parseQuery(query)

        const cards = await DB.cards
            .where('name').startsWithIgnoreCase(qa.default.join(' '))
            .filter(queryFilter(qa))
            .limit(15)
            .toArray()

        return cards
    }
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
                if (current !== '') {
                    yield current + ':'
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

function queryFilter(args: QueryArgs): (card: DBCard) => boolean {
    return card => {
        for (const words of args.default) {
            if (!card.name.toLowerCase().includes(words.toLowerCase())) {
                return false
            }
        }

        return true
    }
}

function getAllWords(text: string): string[] {
    return Array.from(new Set(text.split(' ')))
}

export const DB = (() => {
    const db = new CardDatabase()

    db.cards.hook('creating', (primKey, card, trans) => {
        card.oracle_text_words = getAllWords(card.oracle_text)
        card.name_words = getAllWords(card.name)
    })

    db.cards.hook('updating', (mods: Partial<DBCard>, primKey, obj, trans) => {
        if (mods.name !== undefined) {
            mods.name_words = getAllWords(mods.name)
        }
        if (mods.oracle_text !== undefined) {
            mods.oracle_text_words = getAllWords(mods.oracle_text)
        }
        return mods
    })

    return db
})()

export async function loadDB() {
    const chunks: Chunk[] = await fetch('cards/chunks.json').then(r => r.json())
    for (const chunk of chunks) {
        const localChunk = await DB.chunks.get(chunk.index)
        if (localChunk !== undefined) {
            if (localChunk.hash === chunk.hash) {
                continue
            } else {
                await DB.chunks.delete(chunk.index)
            }
        }
        const cards: Card[] = await fetch(chunk.path).then(r => r.json())
        await DB.cards.bulkAdd(cards.filter(c => ['normal', 'transform'].includes(c.layout)).map(toDBCard))
        await DB.chunks.add(chunk)
        console.log(`downloaded chunk ${chunk.index}`)

    }
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
        }
    }

    return {
        ...base,
        oracle_text: c.oracle_text,
        mana_cost: c.mana_cost,
        image_url: c.image_uris.normal,
    }
}
