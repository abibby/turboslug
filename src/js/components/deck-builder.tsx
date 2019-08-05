import 'css/deck-builder.scss'
import Search from 'js/components/search'
import { DBCard } from 'js/database'
import { Deck } from 'js/deck'
import { Component, h } from 'preact'
import CardRow from './card-row'

interface Props {
    cards?: Deck
    onChange?: (deck: Deck) => void
}
interface State {
    cards: Deck
    searchValue: string
    filter: string
}
export default class DeckBuilder extends Component<Props, State> {
    private search: CardRow

    constructor(props: Props) {
        super(props)

        this.state = {
            cards: this.props.cards || [],
            searchValue: '',
            filter: '',
        }
    }
    public render() {
        return <div class='deck-builder'>
            <div class='card-row'>
                <div />
                <div />
                <div />
                <Search
                    onChange={this.filterChange}
                    placeholder='Enter a filter'
                />
            </div>
            <div class='deck'>
                {this.state.cards.map((card, i) => <CardRow
                    key={card.card.id}
                    name={card.card.name}
                    quantity={card.quantity}
                    filter={this.state.filter}
                    onChange={this.cardChange(i)}
                    onSelect={this.cardSelect(i)}
                />)}
            </div>
            <CardRow
                ref={e => this.search = e}
                name={this.state.searchValue}
                filter={this.state.filter}
                onSelect={this.addCard}
                onChange={this.searchChange}
            />
        </div>
    }

    public componentDidUpdate(previousProps: Props) {
        let newCards = this.state.cards
        let update = false
        if (this.props.cards !== undefined && previousProps.cards !== this.props.cards) {
            newCards = this.props.cards
            update = true
        }
        if (newCards.find(c => c.quantity <= 0)) {
            newCards = newCards.filter(c => c.quantity > 0)
            update = true
        }
        if (update) {
            this.setState({ cards: newCards })

        }
    }

    private filterChange = (value: string): void => {
        this.setState({ filter: value })

    }

    private addCard = (quantity: number, card: DBCard) => {
        const cardInDeck = this.state.cards.find(c => c.card.id === card.id) || { quantity: 0 }

        const cards = this.state.cards
            .filter(c => c.card.id !== card.id)
            .concat([{ quantity: quantity + cardInDeck.quantity, card: card }])

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
    private cardChange(i: number) {
        return (quantity: number, value: string) => {

            const cards = [...this.state.cards]
            cards[i].quantity = quantity

            this.setState({ cards: cards })

            if (this.props.onChange) {
                this.props.onChange(cards)
            }
        }
    }
    private cardSelect(i: number) {
        return (quantity: number, card: DBCard) => {

            const cards = [...this.state.cards]
            cards[i].quantity = quantity
            cards[i].card = card

            this.setState({ cards: cards })

            if (this.props.onChange) {
                this.props.onChange(cards)
            }
        }
    }
}
