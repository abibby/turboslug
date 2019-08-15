import DeckStats from 'js/components/dack-stats'
import DeckBuilder from 'js/components/deck-builder'
import DeckList from 'js/components/deck-list'
import { Deck } from 'js/deck'
import { store } from 'js/save'
import Layout from 'js/views/layout'
import { Component, h } from 'preact'
import NewDeckBuilder from 'js/components/new-deck-builder';

interface Props {
    matches?: {
        name: string,
    }
}

interface State {
    deck: Deck
}

export default class EditDeck extends Component<Props, State> {
    private readonly store = store('local')

    constructor(props: {}) {
        super(props)

        this.state = {
            deck: [],
        }

        this.loadDeck()
    }
    public render() {

        return <Layout>
            <h1>Edit Deck</h1>
            <NewDeckBuilder />
            <DeckBuilder onChange={this.deckChange} cards={this.state.deck} />
            <DeckStats deck={this.state.deck} />
            <DeckList deck={this.state.deck} />
            <pre>
                {this.state.deck.map(slot => `${slot.quantity} ${slot.card.name}`).join('\n')}
            </pre>
        </Layout>
    }

    public componentDidUpdate(previousProps: Props) {
        if (previousProps.matches!.name !== this.props.matches!.name) {
            this.loadDeck()
        }
    }

    private deckChange = async (deck: Deck) => {
        this.setState({ deck: deck })
        await this.store.save(this.props.matches!.name, deck)
    }

    private async loadDeck() {
        const deck = await this.store.load(this.props.matches!.name)
        this.setState({ deck: deck || [] })
    }

}
