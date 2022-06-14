import { get, set, Store } from 'idb-keyval'
import chunk from 'lodash/chunk'
import { Card, Cards } from 'scryfall-sdk'
import { DBCard } from './database'
import { day } from './time'
import { notNullish } from './util'

const priceCache = new Store('price-cache')

interface CacheEntry {
    price: number
    date: number
}

export async function prices(cards: DBCard[]): Promise<Map<string, number>> {
    const cachePriceMap = new Map<string, number>(
        (
            await Promise.all(
                cards.map(
                    async (card): Promise<[string, number] | undefined> => {
                        const price = await cachePrice(card.name)
                        if (price === undefined) {
                            return undefined
                        }
                        return [card.name, price]
                    },
                ),
            )
        ).filter((price): price is [string, number] => price !== undefined),
    )

    const fullCards = await searchCards(
        cards.filter(card => cachePriceMap.get(card.name) === undefined),
    )

    await Promise.all(
        fullCards.map(async card => {
            const price = card?.prices?.usd ?? card?.prices?.usd_foil
            if (price === undefined) {
                return
            }
            await setCachePrice(card.name, Number(price))
        }),
    )

    return new Map(
        cards
            .map((card): [string, number] | undefined => {
                const fullCard = fullCards.find(c => c.name === card.name)
                const price =
                    fullCard?.prices?.usd ??
                    fullCard?.prices?.usd_foil ??
                    undefined
                if (price !== undefined) {
                    return [card.name, Number(price)]
                }
                const cPrice = cachePriceMap.get(card.name)
                if (cPrice !== undefined) {
                    return [card.name, cPrice]
                }
                return undefined
            })
            .filter(notNullish),
    )
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

async function searchCards(cards: DBCard[]): Promise<Card[]> {
    const fullCards: Card[] = []
    for (const cs of chunk(cards, 30)) {
        const query = cs.map(card => `!"${card.name}"`).join(' or ')
        fullCards.push(...(await Cards.search(query).waitForAll()))
    }

    return fullCards
}
