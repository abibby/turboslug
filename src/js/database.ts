
import Dexie from 'dexie'
import { Card } from 'js/scryfall'

type DBCard = Card & {
    name_words?: string[]
    oracle_text_words?: string[],
}

class CardDatabase extends Dexie {
    public cards: Dexie.Table<DBCard, number>

    constructor() {
        super('CardDatabase')
        this.version(1).stores({
            cards: '++id,name,*name_words,oracle_text,*oracle_text_words',
        })
    }
}

function getAllWords(text: string): string[] {
    return Array.from(new Set(text.split(' ')))
}

export const DB = (() => {
    const db = new CardDatabase()

    db.cards.hook('creating', (primKey, card, trans) => {
        if (typeof card.oracle_text === 'string') { card.oracle_text_words = getAllWords(card.oracle_text) }
        if (typeof card.name === 'string') { card.name_words = getAllWords(card.name) }
    })

    db.cards.hook('updating', (mods: Partial<DBCard>, primKey, obj, trans) => {
        if (mods.hasOwnProperty('name')) {
            if (typeof mods.name === 'string') {
                return { name_words: getAllWords(mods.name) }
            } else {
                return { name_words: [] }
            }
        }
        if (mods.hasOwnProperty('oracle_text')) {
            if (typeof mods.oracle_text === 'string') {
                return { oracle_text_words: getAllWords(mods.oracle_text) }
            } else {
                return { oracle_text_words: [] }
            }
        }
    })
    return db
})()
