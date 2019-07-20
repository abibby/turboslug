
import Dexie from 'dexie'
import { Card } from 'js/scryfall'

interface MyDB extends Dexie {
    'cards': {
        value: Card,
        key: string,
        indexes: {
            'name': string,
            'oracle_text': string,
        },
    }
}

class CardDatabase extends Dexie {
    public cards: Dexie.Table<Card, number>

    constructor() {
        super('CardDatabase')
        this.version(1).stores({
            cards: '++id,name,oracle_text',
        })
    }
}

export const DB = new CardDatabase()
