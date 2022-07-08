import { DBCard } from './database'

export const MainBoard = 'Main'

export interface Board {
    name: string
    cards: Slot[]
}

export interface Slot {
    quantity: number
    card: DBCard
    version?: string
    tags: string[]
}
