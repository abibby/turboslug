import { DBSchema, openDB } from 'idb'
import { Card } from 'js/scryfall'

interface MyDB extends DBSchema {
    'cards': {
        value: Card,
        key: string,
        indexes: {
            'name': string,
            'oracle_text': string,
        },
    }
}

export async function database() {
    return await openDB('cards', 1, {
        upgrade: db => {
            const cards = db.createObjectStore('cards', { keyPath: 'id' })
            cards.createIndex('by-name', 'name')
            cards.createIndex('by-oracle_text', 'oracle_text')
        },
    })
}
