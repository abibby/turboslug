import { Bucket } from '@google-cloud/storage'
import { createHash } from 'crypto'
import { getStorage } from 'firebase-admin/storage'
import { promises as fs } from 'fs'
import { chunk, groupBy } from 'lodash'
import fetch from 'node-fetch'
import { Card } from 'scryfall-sdk'
import { Chunk, DBCard } from './interfaces'

interface BulkData {
    data: Array<{
        type: string
        download_uri: string
    }>
}

export async function downloadCards(): Promise<void> {
    const bulk = (await fetch('https://api.scryfall.com/bulk-data').then(r =>
        r.json(),
    )) as BulkData

    const url = bulk.data.find(d => d.type === 'default_cards')?.download_uri
    if (url === undefined) {
        throw new Error('Could not find default cards download URI')
    }
    const allCards = (await fetch(url).then(r => r.json())) as Card[]

    allCards.sort(
        (a, b) =>
            Math.min(...a.multiverse_ids!) - Math.min(...b.multiverse_ids!),
    )
    const chunks: Chunk[] = []
    let i = 0
    await fs.mkdir('dist/cards', { recursive: true })
    const collectedCards = Object.values(
        groupBy(Object.values(allCards).filter(validCard), 'name'),
    ).map(toDBCard)

    const storage = getStorage()
    const bucket = storage.bucket()
    for (const cards of chunk(collectedCards, 1000)) {
        const path = `cards/${i}.json`
        const content = JSON.stringify(cards)
        await writeFile(bucket, path, content)

        chunks.push({
            hash: createHash('sha256').update(content).digest('hex'),
            path: path,
            index: i,
        })
        i++
    }
    await writeFile(bucket, 'cards/chunks.json', JSON.stringify(chunks))
}

function toDBCard(cards: Card[]): DBCard {
    const card = cards[0]
    const id = card.multiverse_ids![0]

    const commonCard: Omit<DBCard, 'oracle_text' | 'mana_cost' | 'type'> = {
        id: String(id),
        name: card.name,
        color_identity: card.color_identity,
        legalities: Object.entries(card.legalities)
            .filter(([, legal]) => legal === 'legal')
            .map(([format]) => format)
            .sort(),
        cmc: card.cmc,
        set: cards.map(c => c.set),
        image_urls: Object.fromEntries(
            cards.map(c => [
                c.set,
                `https://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=${
                    c.multiverse_ids![0]
                }`,
            ]),
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
    return !!c.multiverse_ids && c.multiverse_ids.length !== 0
}

async function writeFile(
    bucket: Bucket,
    path: string,
    content: string | Buffer,
): Promise<void> {
    await bucket.file(path).save(content)
}
