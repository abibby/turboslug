import { get, set, Store } from 'idb-keyval'
import { Deck } from './deck'

const deckStore = new Store()

export async function saveDeck(name: string, deck: Deck): Promise<void> {
    await set(name, deck, deckStore)
}
export async function loadDeck(name: string): Promise<Deck> {
    return await get(name, deckStore)
}
