import { get, keys, set, Store } from 'idb-keyval'
import { Deck } from 'js/deck'
import { DeckStore } from 'js/save'

export default class LocalStore implements DeckStore {
    private static readonly idbStore = new Store('deck-store')

    public async save(name: string, deck: Deck): Promise<void> {
        await set(name, deck, LocalStore.idbStore)
    }
    public async load(name: string): Promise<Deck | undefined> {
        return await get(name, LocalStore.idbStore)
    }
    public async list(): Promise<string[]> {
        return (await keys(LocalStore.idbStore)).map(String)
    }

}
