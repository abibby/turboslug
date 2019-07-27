import 'css/deck-builder.scss'
import Search from 'js/components/search'
import { DBCard } from 'js/database'
import { Component, h } from 'preact'
import CardRow from './card-row'

export interface Slot {
    quantity: number
    card: DBCard
    tags?: string[]
}

interface Props {
    cards?: Slot[]
    onChange?: (deck: Slot[]) => void
}
interface State {
    cards: Slot[]
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
        const cards = this.state.cards.concat([{ quantity: quantity, card: card }])
        this.setState({
            cards: cards,
            searchValue: '',
        })
        this.search.focus()
        if (this.props.onChange) {
            this.props.onChange(cards)
        }
    }
    private searchChange = (quantity: number, value: string) => {
        this.setState({
            searchValue: value,
        })
    }
}
