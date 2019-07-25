import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { Chunk } from 'js/database';
import { Card } from 'js/scryfall'
import fetch from 'node-fetch'

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

fetch('https://archive.scryfall.com/json/scryfall-oracle-cards.json').then(r => r.json())
    .then(async (cards: Card[]) => {
        cards.sort((a, b) => Math.min(...a.multiverse_ids) - Math.min(...b.multiverse_ids))
        const chunks: Chunk[] = []
        let i = 0
        await fs.mkdir('dist/cards', { recursive: true })
        for (const cs of chunk(cards, 100)) {
            const path = `cards/${i}.json`
            const content = JSON.stringify(cs)
            await fs.writeFile('dist/' + path, content)

            chunks.push({
                hash: createHash('sha256').update(content).digest('hex'),
                path: path,
                index: i,
            })
            i++
        }
        await fs.writeFile('dist/cards/chunks.json', JSON.stringify(chunks))
    })
