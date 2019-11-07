import * as scryfall from 'scryfall-sdk'
import { DBCard, findCard } from './database'

export async function prices(cards: string[]): Promise<number[]> {
    const query = (await Promise.all(cards.map(findCard)))
        .filter((card): card is DBCard => card !== undefined)
        .map(card => `!"${card.name}"`)
        .join(' or ')

    const fullCards = await scryfall.Cards.search(query, { unique: 'prints' }).waitForAll()

    return cards.map(card => {
        const fullCard = fullCards.find(c => c.name === card)
        if (card === 'Verdurous Gearhulk') {
            console.log(fullCard)
        }

        return Number(fullCard?.prices?.usd ?? fullCard?.prices?.usd_foil ?? 0)
    })
}
