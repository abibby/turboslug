import { Deck } from 'js/deck'
import LocalStore from 'js/save/local-store'

export interface DeckStore {
    save(name: string, deck: Deck): Promise<void>
    load(name: string): Promise<Deck | undefined>
    list(): Promise<string[]>
}

type StoreNames = 'local'

const stores = new Map<StoreNames, DeckStore>()

export function store(type: StoreNames): DeckStore {
    let s = stores.get(type)
    if (s === undefined) {
        s = new LocalStore()
    }

    return s
}
