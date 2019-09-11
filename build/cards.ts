import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { Chunk, DBCard } from 'js/database'
import fetch from 'node-fetch'
import { Card, ImageUris } from 'scryfall-sdk'

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
    const url = 'https://archive.scryfall.com/json/scryfall-oracle-cards.json'
    // const url = 'https://www.mtgjson.com/json/AllCards.json'
    const allCards: Card[] = await fetch(url).then(r => r.json())
    // allCards.sort((a, b) => Math.min(...a.multiverse_ids) - Math.min(...b.multiverse_ids))
    const chunks: Chunk[] = []
    let i = 0
    await fs.mkdir('dist/cards', { recursive: true })
    for (const cards of chunk(Object.entries(allCards).map(([, card]) => card), 1000)) {
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

function imageURL(imageUris: ImageUris | null | undefined): string {
    if (imageUris === null || imageUris === undefined) {
        return ''
    }
    return imageUris.normal
}

function toDBCard(c: Card): DBCard {
    const commonCard = {
        id: c.id,
        name: c.name,
        color_identity: c.color_identity,
        legalities: Object.entries(c.legalities)
            .filter(([, legal]) => legal === 'legal')
            .map(([format]) => format),
        cmc: c.cmc,
        set: c.set,
    }
    if (c.card_faces) {
        return {
            ...commonCard,
            oracle_text: c.card_faces[0].oracle_text || '',
            mana_cost: c.card_faces[0].mana_cost,
            type: c.card_faces[0].type_line,
            image_url: imageURL(c.card_faces[0].image_uris),
        }
    }

    return {
        ...commonCard,
        oracle_text: c.oracle_text || '',
        mana_cost: c.mana_cost || '',
        type: c.type_line || '',
        image_url: imageURL(c.image_uris),
    }
}
