import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { Chunk, DBCard } from 'js/database'
import fetch from 'node-fetch'

type Layout =
    | 'normal'
    | 'split'
    | 'flip'
    | 'transform'
    | 'meld'
    | 'leveler'
    | 'saga'
    | 'planar'
    | 'scheme'
    | 'vanguard'
    | 'token'
    | 'double_faced_token'
    | 'emblem'
    | 'augment'
    | 'aftermath'
    | 'host'

type Legality = 'Not Legal' | 'Legal'
interface Legalities {
    brawl: Legality
    commander: Legality
    duel: Legality
    future: Legality
    frontier: Legality
    legacy: Legality
    modern: Legality
    pauper: Legality
    penny: Legality
    standard: Legality
    vintage: Legality
}

interface Ruling {
    date: string
    text: string
}

interface Card {
    colorIdentity: Array<'W' | 'U' | 'B' | 'R' | 'G'>
    colorIndicator: string[]
    colors: string[]
    convertedManaCost: number
    edhrecRank?: number
    faceConvertedManaCost: number
    foreignData: object[]
    hand?: string
    isReserved?: boolean
    layout: Layout
    legalities: Legalities
    life: string
    loyalty?: string
    manaCost: string
    mtgstocksId: number
    name: string
    names: string[]
    power: string
    printings: string[]
    purchaseUrls: { cardmarket: string, tcgplayer: string, mtgstocks: string }
    rulings: Ruling[]
    scryfallOracleId: string
    side?: string
    subtypes: string[]
    supertypes: string[]
    text: string
    toughness: string
    type: string
    types: string[]
    uuid: string
}

function* chunk<T>(arr: T[], size: number): Iterable<T[]> {
    let temp: T[] = []
    for (const element of arr) {
        temp.push(element)
        if (temp.length >= size) {
            yield temp
            temp = []
        }
    }
}

export async function downloadCards(): Promise<void> {
    // const url = 'https://archive.scryfall.com/json/scryfall-oracle-cards.json'
    const url = 'https://www.mtgjson.com/json/AllCards.json'
    const allCards: { [name: string]: Card } = await fetch(url).then(r => r.json())
    // allCards.sort((a, b) => Math.min(...a.multiverse_ids) - Math.min(...b.multiverse_ids))
    const chunks: Chunk[] = []
    let i = 0
    await fs.mkdir('dist/cards', { recursive: true })
    for (const cards of chunk(Object.entries(allCards).map(([, card]) => card), 100)) {
        const path = `cards/${i}.json`
        const content = JSON.stringify(cards.map(toDBCard))
        await fs.writeFile('dist/' + path, content)

        chunks.push({
            hash: createHash('sha256').update(content).digest('hex'),
            path: path,
            index: i,
        })
        i++
    }
    await fs.writeFile('dist/cards/chunks.json', JSON.stringify(chunks))
}

if (typeof require !== 'undefined' && require.main === module) {
    downloadCards()
}

function toDBCard(c: Card): DBCard {
    return {
        id: c.uuid,
        name: c.name,
        oracle_text: c.text,
        color_identity: c.colorIdentity,
        mana_cost: c.manaCost || '',
        set: c.printings,
        type: c.type,
        // tslint:disable-next-line: max-line-length
        image_url: `https://img.scryfall.com/cards/large/front/${c.scryfallOracleId[0]}/${c.scryfallOracleId[1]}/${c.scryfallOracleId}.jpg?1562878628`,
        legalities: Object.entries(c.legalities)
            .filter(([, legal]) => legal === 'legal')
            .map(([format]) => format),
        cmc: c.convertedManaCost,
    }
}
