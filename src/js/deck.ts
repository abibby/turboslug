import { DBCard } from './database'

export interface Slot {
    quantity: number
    card: DBCard
    tags: string[]
}
