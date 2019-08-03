import 'css/deck-list.scss'
import { Deck } from 'js/deck'
import { Component, h } from 'preact'

interface Props {
    deck: Deck
}

export default class DeckList extends Component<Props> {

    private get cards() {
        return this.props.deck.flatMap(slot => duplicate(slot.card, slot.quantity))
    }

    public render() {
        return <div class='deck-list'>
            {this.cards.map((card, i) => <div
                key={card.id + '-' + i}
                class='card'
            >
                <img
                    src={card.image_url}
                    alt={card.name}
                />
            </div>)}
        </div>
    }
}

function duplicate<T>(e: T, count: number): T[] {
    const arr: T[] = []
    for (let i = 0; i < count; i++) {
        arr.push(e)
    }
    return arr
}
