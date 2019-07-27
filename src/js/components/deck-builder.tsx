import 'css/deck-builder.scss'
import Search from 'js/components/search'
import { DBCard } from 'js/database'
import { Component, h } from 'preact'
import CardRow from './card-row'

interface Card {
    quantity: number
    card: DBCard
}

interface Props {
    cards?: Card[]
}
interface State {
    cards: Card[]
    searchValue: string
}
export default class DeckBuilder extends Component<Props, State> {
    private search: CardRow

    constructor(props: Props) {
        super(props)

        this.state = {
            cards: [],
            searchValue: '',
        }
    }
    public render() {
        return <div class='deck-builder'>
            <div class='deck'>
                {this.state.cards.map((card, i) => <CardRow key={i} name={card.card.name} quantity={card.quantity} />)}
            </div>
            <CardRow
                ref={e => this.search = e}
                name={this.state.searchValue}
                onSelect={this.addCard}
                onChange={this.searchChange}
            />
        </div>
    }

    private addCard = (quantity: number, card: DBCard) => {
        this.setState({
            cards: this.state.cards.concat([{ quantity: quantity, card: card }]),
            searchValue: '',
        })
        this.search.focus()
    }
    private searchChange = (quantity: number, value: string) => {
        this.setState({
            searchValue: value,
        })
    }
}
