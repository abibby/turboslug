export interface DBCard {
    id: string
    name: string
    oracle_text: string
    mana_cost: string
    set: string[]
    type: string
    image_urls: Record<string, string>
    color_identity: Array<'W' | 'U' | 'B' | 'R' | 'G'>
    legalities: string[]
    cmc: number
}

export interface Chunk {
    index: number
    hash: string
    path: string
}
