import Dexie from 'dexie'
import { DBCard } from './database'

type IndexNames = {
    [K in keyof CardDatabase]: CardDatabase[K] extends Dexie.Table<
        Index<unknown>,
        string
    >
        ? K
        : never
}[keyof CardDatabase]
export type SearchQuery = Partial<Record<IndexNames, string[]>>

interface Index<T> {
    id: string
    value: T
}

class CardDatabase extends Dexie {
    cards!: Dexie.Table<DBCard, string>
    names!: Dexie.Table<Index<string[]>, string>
    manaCosts!: Dexie.Table<Index<number>, string>

    constructor() {
        super('CardDatabase')
        this.version(1).stores({
            cards: 'id',
            names: 'id,*value',
            manaCosts: 'id,value',
        })
    }
}

const db = new CardDatabase()

function tokenize(v: string): string[] {
    return v
        .toLocaleLowerCase()
        .replace(/[^a-zA-Z ]/g, '')
        .split(' ')
        .filter(s => s !== '')
}

export async function newLoadDB(cards: DBCard[]) {
    const count = await db.cards.limit(1).count()
    if (count > 0) {
        return
    }

    db.transaction('rw', ['cards', 'names', 'manaCosts'], async () => {
        await Promise.all([
            db.cards.bulkAdd(cards),
            db.names.bulkAdd(
                cards.map(c => ({ id: c.id, value: tokenize(c.name) })),
            ),
            db.manaCosts.bulkAdd(cards.map(c => ({ id: c.id, value: c.cmc }))),
        ])
    })

    console.log('done')
}
export async function newSearch(query: SearchQuery) {
    if (query.names !== undefined) {
        const names = await db.names
            .where('value')
            .startsWithAnyOf(...query.names.map(n => n.toLocaleLowerCase()))

        console.log(await names.toArray())
    }
    for (const manaCost of query.manaCosts ?? []) {
        db.manaCosts.where('value').equals(Number(manaCost))
    }
}
