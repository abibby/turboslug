
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
