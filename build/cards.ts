import { createHash } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { groupBy } from 'lodash'
import fetch from 'node-fetch'
import { Card } from 'scryfall-sdk'
import { Chunk, DBCard } from '../src/js/database'

interface BulkData {
    data: Array<{
        type: string
        download_uri: string
    }>
}

export async function downloadCards(): Promise<void> {
    const bulk: BulkData = await fetch(
        'https://api.scryfall.com/bulk-data',
    ).then(r => r.json())

    const url = bulk.data.find(d => d.type === 'default_cards')?.download_uri
    if (url === undefined) {
        throw new Error('Could not find default cards download URI')
    }
    const allCards: Card[] = await fetch(url).then(r => r.json())

    allCards.sort((a, b) => a.released_at.localeCompare(b.released_at))
    const chunks: Chunk[] = []
    await mkdir('public/cards', { recursive: true })
    const collectedCards = Object.values(
        groupBy(Object.values(allCards).filter(validCard), 'name'),
    ).map(toDBCard)

    const cardsBySet = Object.entries(groupBy(collectedCards, a => a.set[0]))

    for (const [set, cards] of cardsBySet) {
        const path = `/cards/${set}.json`
        const content = JSON.stringify(cards)
        await writeFile('public' + path, content)

        chunks.push({
            hash: createHash('sha256').update(content).digest('hex'),
            path: path,
            index: set,
        })
    }
    await writeFile('public/cards/chunks.json', JSON.stringify(chunks))
}

function toDBCard(cards: Card[]): DBCard {
    const card = cards[0]
    const id = createHash('md5').update(card.name).digest('base64')

    const commonCard: Omit<DBCard, 'oracle_text' | 'mana_cost' | 'type'> = {
        id: id,
        name: card.name,
        color_identity: card.color_identity,
        legalities: Object.entries(card.legalities)
            .filter(([, legal]) => legal === 'legal')
            .map(([format]) => format)
            .sort(),
        cmc: card.cmc,
        set: cards.map(c => c.set),
        power: card.power ?? null,
        toughness: card.toughness ?? null,
        scryfall_url: card.scryfall_uri,
        image_urls: Object.fromEntries(
            cards.map(c => {
                const key = c.set + '#' + c.collector_number
                const url = imageURL(c)
                if (url) {
                    const u = new URL(url)
                    u.search = ''
                    return [key, u.toString()]
                }

                return [key, '/assets/card-back.jpg']
            }),
        ),
    }
    if (card.card_faces) {
        return {
            ...commonCard,
            oracle_text: card.card_faces[0].oracle_text ?? '',
            mana_cost: card.card_faces[0].mana_cost ?? '',
            type: card.card_faces[0].type_line,
        }
    }

    return {
        ...commonCard,
        oracle_text: card.oracle_text ?? '',
        mana_cost: card.mana_cost ?? '',
        type: card.type_line ?? '',
    }
}

function validCard(c: Card): boolean {
    return c.type_line !== 'Card' && c.type_line !== 'Card // Card'
}

if (typeof require !== 'undefined' && require.main === module) {
    downloadCards()
}

function imageURL(c: Card): string | undefined {
    if (c.image_uris) {
        return c.image_uris.large
    }
    if (c.card_faces?.[0].image_uris) {
        return c.card_faces[0].image_uris?.large
    }
}
