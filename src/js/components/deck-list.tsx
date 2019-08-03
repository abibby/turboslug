import 'css/deck-list.scss'
import { range } from 'js/collection'
import { Deck } from 'js/deck'
import { Component, h } from 'preact'

interface Props {
    deck: Deck
}

export default class DeckList extends Component<Props> {
    public render() {
        return <div class='deck-list'>
            {this.props.deck.map(slot => (
                <div
                    key={slot.card.id}
                    class='slot'
                >
                    {range(slot.quantity).map(i => (
                        <div key={i} class='card' >
                            <img
                                src={slot.card.image_url}
                                alt={slot.card.name}
                            />
                        </div>
                    )).toArray()}
                </div>
            ))}
        </div>
    }
}
