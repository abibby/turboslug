import LocalStore from 'js/save/local-store'

export interface DeckStore {
    save(name: string, deck: string): Promise<void>
    load(name: string): Promise<string | undefined>
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
