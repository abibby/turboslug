import { DB } from 'js/database'
import { Card } from 'js/scryfall'
import { Component, h } from 'preact'

interface Props {
    value: string
}

interface State {
    value: string
    suggestion: Card[]
}

export default class Search extends Component<Props, State> {

    constructor(props: Props) {
        super(props)

        this.state = {
            value: this.props.value,
            suggestion: [],
        }
    }

    public render() {
        return <div>
            <input type='text' onInput={this.onChange} />
            {this.state.suggestion.map(card => <div key={card.id}>{card.name} {card.mana_cost}</div>)}
        </div>
    }

    public onChange = async (e: Event) => {
        const input = e.target as HTMLInputElement
        const value = input.value

        const cards: Card[] = []
        await DB.cards.where('name').startsWithIgnoreCase(value).limit(10).each(card => cards.push(card))

        this.setState({ suggestion: cards })
    }
}
