import { get, keys, set, Store } from 'idb-keyval'
import { DeckStore } from 'js/save'

export default class LocalStore implements DeckStore {
    private static readonly idbStore = new Store('deck-store')

    public async save(name: string, deck: string): Promise<void> {
        await set(name, deck, LocalStore.idbStore)
    }
    public async load(name: string): Promise<string | undefined> {
        return await get(name, LocalStore.idbStore)
    }
    public async list(): Promise<string[]> {
        return (await keys(LocalStore.idbStore)).map(String)
    }

}
