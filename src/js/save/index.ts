import LocalStore from 'js/save/local-store'
import FirebaseStore from './firebase'
export interface DeckStore {
    save(name: string, deck: string): Promise<void>
    load(name: string): Promise<string | undefined>
    list(): Promise<string[]>
}

type StoreNames = 'local' | 'firebase'

const stores = new Map<StoreNames, DeckStore>([
    ['local', new LocalStore()],
    ['firebase', new FirebaseStore()],
])

export function store(type: StoreNames): DeckStore {
    let s = stores.get(type)
    if (s === undefined) {
        s = new LocalStore()
    }

    return s
}
