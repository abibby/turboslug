import { get, set, Store } from 'idb-keyval'
import { Slot } from './components/deck-builder'

const deckStore = new Store()

export async function saveDeck(name: string, deck: Slot[]): Promise<void> {
    await set(name, deck, deckStore)
}
export async function loadDeck(name: string): Promise<Slot[]> {
    return await get(name, deckStore)
}
