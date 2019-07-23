
import Dexie from 'dexie'
import { allSets, Card, ScryfallResponse, searchCards, Set } from 'js/scryfall'

type DBCard = Card & {
    name_words?: string[]
    oracle_text_words?: string[],
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
}

function getAllWords(text: string): string[] {
    return Array.from(new Set(text.split(' ')))
}

export const DB = (() => {
    const db = new CardDatabase()

    db.cards.hook('creating', (primKey, card, trans) => {
        if (card.layout === 'normal') {
            card.oracle_text_words = getAllWords(card.oracle_text)
        } else if (card.layout === 'transform') {
            card.oracle_text_words = getAllWords(card.card_faces.map(face => face.oracle_text).join(' '))
        }
        if (typeof card.name === 'string') { card.name_words = getAllWords(card.name) }
    })

    db.cards.hook('updating', (mods: Partial<DBCard>, primKey, obj, trans) => {
        if (mods.name !== undefined) {
            return { name_words: getAllWords(mods.name) }
        }
        if (mods.layout === 'normal') {
            if (mods.oracle_text !== undefined) {
                return getAllWords(mods.oracle_text)
            }
        } else if (mods.layout === 'transform') {
            if (mods.card_faces !== undefined) {
                return getAllWords(mods.card_faces.map(face => face.oracle_text).join(' '))
            }
        }
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
        await DB.cards.bulkAdd(cards)
        await DB.chunks.add(chunk)
        console.log(`downloaded chunk ${chunk.index}`)

    }
}
