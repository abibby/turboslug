import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { Chunk, DBCard } from 'js/database'
import { chunk, groupBy } from 'lodash'
import fetch from 'node-fetch'
import { Card, ImageUris } from 'scryfall-sdk'

export async function downloadCards(): Promise<void> {
    const url = 'https://archive.scryfall.com/json/scryfall-default-cards.json'
    const allCards: Card[] = await fetch(url).then(r => r.json())

    allCards.sort((a, b) => Math.min(...a.multiverse_ids!) - Math.min(...b.multiverse_ids!))
    const chunks: Chunk[] = []
    let i = 0
    await fs.mkdir('dist/cards', { recursive: true })
    const collectedCards = Object.values(groupBy(Object.values(allCards).filter(validCard), 'name')).map(toDBCard)

    for (const cards of chunk(collectedCards, 1000)) {
        const path = `cards/${i}.json`
        const content = JSON.stringify(cards)
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

function toDBCard(cards: Card[]): DBCard {
    const card = cards[0]
    const id = card.multiverse_ids![0]

    const commonCard = {
        id: String(id),
        name: card.name,
        color_identity: card.color_identity,
        legalities: Object.entries(card.legalities)
            .filter(([, legal]) => legal === 'legal')
            .map(([format]) => format)
            .sort(),
        cmc: card.cmc,
        set: cards.map(c => c.set),
        image_url: `https://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=${id}`,
    }
    if (card.card_faces) {
        return {
            ...commonCard,
            oracle_text: card.card_faces[0].oracle_text || '',
            mana_cost: card.card_faces[0].mana_cost,
            type: card.card_faces[0].type_line,
        }
    }

    return {
        ...commonCard,
        oracle_text: card.oracle_text || '',
        mana_cost: card.mana_cost || '',
        type: card.type_line || '',
    }
}

function validCard(c: Card): boolean {
    return !!c.multiverse_ids && c.multiverse_ids.length !== 0
}

if (typeof require !== 'undefined' && require.main === module) {
    downloadCards()
}
