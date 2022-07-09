import { createStore, get, set } from 'idb-keyval'
import chunk from 'lodash/chunk'
import { Card, Cards } from 'scryfall-sdk'
import { collect } from './collection'
import { Slot } from './deck'
import { day } from './time'
import { notNullish } from './util'

const priceCache = createStore('turboslug', 'price-cache')

interface CacheEntry {
    price: number
    date: number
}

// TODO: use versions for price information
export async function prices(slots: Slot[]): Promise<Map<string, number>> {
    const cachePriceMap = new Map<string, number>(
        (
            await Promise.all(
                slots.map(async slot => {
                    const price = await cachePrice(slot)
                    if (price === undefined) {
                        return undefined
                    }
                    return [slot.card.name, price] as const
                }),
            )
        ).filter(notNullish),
    )

    const fullCards = await searchCards(
        slots.filter(slot => cachePriceMap.get(slot.card.name) === undefined),
    )

    await Promise.all(
        fullCards.map(async card => {
            const price = card?.prices?.usd ?? card?.prices?.usd_foil
            if (price === undefined) {
                return
            }
            await setCachePrice(card, Number(price))
        }),
    )

    return new Map(
        slots
            .map((slot): [string, number] | undefined => {
                const fullCard = fullCards.find(c => c.name === slot.card.name)
                const price =
                    fullCard?.prices?.usd ??
                    fullCard?.prices?.usd_foil ??
                    undefined
                if (price !== undefined) {
                    return [slot.card.name, Number(price)]
                }
                const cPrice = cachePriceMap.get(slot.card.name)
                if (cPrice !== undefined) {
                    return [slot.card.name, cPrice]
                }
                return undefined
            })
            .filter(notNullish),
    )
}

function cacheKey(slot: Slot | Card, withVersion: boolean): string {
    if ('card' in slot) {
        if (slot.version !== undefined && withVersion) {
            return slot.card.name + '|' + slot.version
        }
        return slot.card.name
    }
    if (withVersion) {
        return slot.name + '|' + slot.set + '#' + slot.collector_number
    }
    return slot.name
}

async function cachePrice(
    slot: Slot | Card,
    withVersion = true,
): Promise<number | undefined> {
    const price = await get<CacheEntry>(cacheKey(slot, withVersion), priceCache)
    if (price === undefined || Date.now() - price.date > day) {
        return
    }

    return price.price
}

async function setCachePrice(slot: Slot | Card, price: number): Promise<void> {
    const data: CacheEntry = {
        price: price,
        date: Date.now(),
    }
    await set(cacheKey(slot, true), data, priceCache)
    const cp = await cachePrice(slot, false)
    if (price < (cp ?? Number.MAX_VALUE)) {
        await set(cacheKey(slot, false), data, priceCache)
    }
}

async function searchCards(cards: Slot[]): Promise<Card[]> {
    const fullCards: Card[] = []
    for (const cs of chunk(cards, 20)) {
        const query = cs
            .map(card => {
                const parts = card.version?.split('#') ?? []
                if (parts.length >= 2) {
                    const [set, cn] = parts
                    return `(!"${card.card.name}" set:${set} cn:${cn})`
                }
                return `!"${card.card.name}"`
            })
            .join(' or ')
        fullCards.push(
            ...(await Cards.search(
                query + ' usd>0 unique:prints',
            ).waitForAll()),
        )
    }
    return collect(fullCards)
        .groupBy(c => c.name)
        .map(([, groupedCards]) => {
            let card: Card | undefined
            for (const c of groupedCards) {
                if (
                    (c.prices.usd ?? 0) <
                    (card?.prices?.usd ?? Number.MAX_VALUE)
                ) {
                    card = c
                }
            }
            return card
        })
        .filter(notNullish)
        .toArray()
}
