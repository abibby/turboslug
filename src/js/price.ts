import { get, set, Store } from 'idb-keyval'
import chunk from 'lodash/chunk'
import * as scryfall from 'scryfall-sdk'
import { DBCard, findCard } from './database'
import { day } from './time'

const priceCache = new Store('price-cache')

interface CacheEntry {
    price: number
    date: number
}

export async function prices(cards: string[]): Promise<number[]> {
    const realCards = (await Promise.all(cards.map(findCard)))
        .filter((card): card is DBCard => card !== undefined)
        .map(card => card.name)

    const cachePriceMap = new Map<string, number>(
        (await Promise.all(realCards.map(cachePrice)))
            .filter((price): price is number => price !== undefined)
            .map((price, i) => [cards[i], price]),
    )

    const fullCards = await searchCards(realCards.filter(card => cachePriceMap.get(card) === undefined))

    await Promise.all(fullCards.map(async card => {
        const price = card?.prices?.usd ?? card?.prices?.usd_foil
        if (price === undefined) {
            return
        }
        await setCachePrice(card.name, Number(price))
    }))

    return cards.map(card => {
        const fullCard = fullCards.find(c => c.name === card)
        const price = fullCard?.prices?.usd ?? fullCard?.prices?.usd_foil ?? undefined
        if (price !== undefined) {
            return Number(price)
        }
        return cachePriceMap.get(card) ?? 0
    })
}

async function cachePrice(card: string): Promise<number | undefined> {
    const price: CacheEntry = await get(card, priceCache)
    if (price === undefined || Date.now() - price.date > day) {
        return
    }

    return price.price
}

async function setCachePrice(card: string, price: number): Promise<void> {
    const data: CacheEntry = {
        price: price,
        date: Date.now(),
    }
    await set(card, data, priceCache)
}

async function searchCards(cards: string[]): Promise<scryfall.Card[]> {
    console.log(cards)

    const fullCards: scryfall.Card[] = []
    for (const cs of chunk(cards, 30)) {
        const query = cs.map(card => `!"${card}"`).join(' or ')
        fullCards.push(... await scryfall.Cards.search(query).waitForAll())
    }

    return fullCards
}
