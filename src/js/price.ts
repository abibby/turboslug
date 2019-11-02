import * as scryfall from 'scryfall-sdk'

export async function prices(cards: string[]): Promise<number[]> {
    const query = cards
        .filter(card => card !== '')
        .map(card => `!"${card}"`)
        .join(' or ')

    const fullCards = await scryfall.Cards.search(query).waitForAll()

    return cards.map(card => {
        const fullCard = fullCards.find(c => c.name === card)
        if (
            fullCard !== undefined
            && fullCard.prices !== null
            && fullCard.prices.usd !== null
        ) {
            return Number(fullCard.prices.usd)
        }
        return 0
    })
}
