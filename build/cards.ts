import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { Chunk } from 'js/database'
import { Card } from 'js/scryfall'
import fetch from 'node-fetch'

type FullCard = Card & { edhrec_rank: number }

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

function prepareCard(card: Card & { edhrec_rank: number }): Card {
    delete card.edhrec_rank
    const formats = [
        'standard',
        'future',
        'frontier',
        'modern',
        'legacy',
        'pauper',
        'vintage',
        'penny',
        'commander',
        'brawl',
        'duel',
        'oldschool',
    ]
    const legalities = card.legalities
    card.legalities = {}
    for (const format of formats) {
        card.legalities[format] = legalities[format] || 'not_legal'
    }
    return card
}

export async function downloadCards() {
    const url = 'https://archive.scryfall.com/json/scryfall-oracle-cards.json'
    const allCards: FullCard[] = await fetch(url).then(r => r.json())
    allCards.sort((a, b) => Math.min(...a.multiverse_ids) - Math.min(...b.multiverse_ids))
    const chunks: Chunk[] = []
    let i = 0
    await fs.mkdir('dist/cards', { recursive: true })
    for (const cards of chunk(allCards, 100)) {
        const path = `cards/${i}.json`
        const content = JSON.stringify(cards.map(prepareCard))
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

if (typeof require != 'undefined' && require.main == module) {
    downloadCards()
}
